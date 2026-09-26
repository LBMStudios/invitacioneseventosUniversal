import os
import sys
import time
import zipfile
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, ImageOps, ExifTags

SOURCE_DIR = r"C:\Users\Lucas Rossi\Downloads\TransferNow-20260831CdP3OnRu"
OUTPUT_BASE = r"c:\Users\Lucas Rossi\Downloads\UAInvitacón\firebase\public\assets\galeria"
THUMBS_DIR = os.path.join(OUTPUT_BASE, "thumbs")
HD_DIR = os.path.join(OUTPUT_BASE, "hd")
ZIP_PATH = os.path.join(OUTPUT_BASE, "Album_Universal_Assistance_Coyote_vs_Acme_HD.zip")
JSON_PATH = os.path.join(OUTPUT_BASE, "gallery_items.json")

os.makedirs(THUMBS_DIR, exist_ok=True)
os.makedirs(HD_DIR, exist_ok=True)

def get_exif_datetime(filepath):
    try:
        with Image.open(filepath) as img:
            exif = img.getexif()
            if exif:
                # 306: DateTime, 36867: DateTimeOriginal
                dt = exif.get(36867) or exif.get(306)
                if dt:
                    return str(dt)
    except Exception:
        pass
    return ""

def process_single_photo(index, filename):
    src_path = os.path.join(SOURCE_DIR, filename)
    num_str = f"{index:03d}"
    hd_filename = f"photo_{num_str}.jpg"
    thumb_filename = f"thumb_{num_str}.webp"
    
    hd_path = os.path.join(HD_DIR, hd_filename)
    thumb_path = os.path.join(THUMBS_DIR, thumb_filename)
    
    with Image.open(src_path) as img:
        # Crucial: fix rotation based on camera orientation sensor
        img = ImageOps.exif_transpose(img)
        if img.mode != "RGB":
            img = img.convert("RGB")
            
        orig_w, orig_h = img.size
        
        # 1. HD Version (max 2048px on longest edge)
        ratio_hd = min(2048.0 / max(orig_w, orig_h), 1.0)
        hd_size = (max(1, int(orig_w * ratio_hd)), max(1, int(orig_h * ratio_hd)))
        hd_img = img.resize(hd_size, Image.Resampling.LANCZOS)
        hd_img.save(hd_path, "JPEG", quality=86, optimize=True)
        
        # 2. Thumbnail Version (max 640px on longest edge)
        ratio_th = min(640.0 / max(orig_w, orig_h), 1.0)
        th_size = (max(1, int(orig_w * ratio_th)), max(1, int(orig_h * ratio_th)))
        th_img = img.resize(th_size, Image.Resampling.LANCZOS)
        th_img.save(thumb_path, "WEBP", quality=80, method=4)
        
    return {
        "id": index,
        "filename": filename,
        "src": f"/assets/galeria/hd/{hd_filename}",
        "thumb": f"/assets/galeria/thumbs/{thumb_filename}",
        "w": hd_size[0],
        "h": hd_size[1]
    }

def main():
    start_time = time.time()
    print(f"Buscando fotos en: {SOURCE_DIR}")
    
    if not os.path.exists(SOURCE_DIR):
        print(f"Error: La carpeta {SOURCE_DIR} no existe.")
        sys.exit(1)
        
    raw_files = [f for f in os.listdir(SOURCE_DIR) if f.upper().endswith(('.JPG', '.JPEG'))]
    print(f"Se encontraron {len(raw_files)} fotos originales.")
    
    # Ordenar por fecha EXIF y por nombre
    print("Extrayendo metadatos para ordenar cronológicamente...")
    items_with_dt = []
    for f in raw_files:
        dt = get_exif_datetime(os.path.join(SOURCE_DIR, f))
        items_with_dt.append((dt, f))
        
    # Ordenar por timestamp y fallback a nombre
    items_with_dt.sort(key=lambda x: (x[0], x[1]))
    sorted_files = [x[1] for x in items_with_dt]
    
    print(f"Procesando {len(sorted_files)} fotos en paralelo...")
    gallery_items = [None] * len(sorted_files)
    
    with ThreadPoolExecutor(max_workers=6) as executor:
        future_to_idx = {
            executor.submit(process_single_photo, idx + 1, fn): idx
            for idx, fn in enumerate(sorted_files)
        }
        
        done_count = 0
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                item = future.result()
                gallery_items[idx] = item
                done_count += 1
                if done_count % 20 == 0 or done_count == len(sorted_files):
                    print(f"  [{done_count}/{len(sorted_files)}] fotos procesadas...")
            except Exception as e:
                print(f"Error procesando {sorted_files[idx]}: {e}")
                raise e

    # Guardar metadata JSON
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(gallery_items, f, indent=2)
    print(f"Metadata guardada en: {JSON_PATH}")
    
    # Crear archivo ZIP del álbum HD
    print(f"Generando ZIP del Álbum Completo HD: {ZIP_PATH}...")
    with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for item in gallery_items:
            photo_file = os.path.join(HD_DIR, os.path.basename(item["src"]))
            arcname = f"Universal_Assistance_Coyote_vs_Acme_{item['id']:03d}.jpg"
            zipf.write(photo_file, arcname=arcname)
            
    zip_size_mb = os.path.getsize(ZIP_PATH) / (1024 * 1024)
    thumbs_size_mb = sum(os.path.getsize(os.path.join(THUMBS_DIR, f)) for f in os.listdir(THUMBS_DIR)) / (1024 * 1024)
    hd_size_mb = sum(os.path.getsize(os.path.join(HD_DIR, f)) for f in os.listdir(HD_DIR)) / (1024 * 1024)
    
    total_time = time.time() - start_time
    print("=" * 60)
    print(f"PROCESAMIENTO COMPLETADO en {total_time:.1f} segundos")
    print(f"  * Total de fotos HD: {len(gallery_items)} ({hd_size_mb:.2f} MB)")
    print(f"  * Total miniaturas WebP: {len(gallery_items)} ({thumbs_size_mb:.2f} MB)")
    print(f"  * ZIP Álbum Completo: {zip_size_mb:.2f} MB")
    print("=" * 60)

if __name__ == "__main__":
    main()
