import os
import sys
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, ImageOps

source_dir = r"C:\Users\Lucas Rossi\Downloads\TransferNow-20260831CdP3OnRu"
web_dir = r"c:\Users\Lucas Rossi\Downloads\UAInvitacón\firebase\public\assets\galeria\web"
os.makedirs(web_dir, exist_ok=True)

json_path = r"c:\Users\Lucas Rossi\Downloads\UAInvitacón\firebase\public\assets\galeria\gallery_items.json"
with open(json_path, "r", encoding="utf-8") as f:
    items = json.load(f)

def process_web(item):
    src_file = os.path.join(source_dir, item["filename"])
    num_str = f"{item['id']:03d}"
    out_file = os.path.join(web_dir, f"web_{num_str}.webp")
    with Image.open(src_file) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode != "RGB":
            img = img.convert("RGB")
        orig_w, orig_h = img.size
        ratio = min(1920.0 / max(orig_w, orig_h), 1.0)
        new_size = (max(1, int(orig_w * ratio)), max(1, int(orig_h * ratio)))
        web_img = img.resize(new_size, Image.Resampling.LANCZOS)
        web_img.save(out_file, "WEBP", quality=82, method=4)
    item["web"] = f"/assets/galeria/web/web_{num_str}.webp"

def main():
    t0 = time.time()
    print(f"Generando 130 fotos WebP a 1920px en {web_dir}...")
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = [executor.submit(process_web, it) for it in items]
        done = 0
        for f in as_completed(futures):
            f.result()
            done += 1
            if done % 25 == 0 or done == len(items):
                print(f"  [{done}/{len(items)}]...")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2)

    total_web_mb = sum(os.path.getsize(os.path.join(web_dir, f)) for f in os.listdir(web_dir)) / (1024 * 1024)
    print(f"Completado en {time.time()-t0:.1f}s | Tamaño total web: {total_web_mb:.2f} MB")

if __name__ == "__main__":
    main()
