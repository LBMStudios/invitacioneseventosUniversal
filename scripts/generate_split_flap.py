import os
import math
import random
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

# Set up output directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "Graficos")
ASSETS_DIR = os.path.join(BASE_DIR, "firebase", "public", "assets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ----------------------------------------------------
# Brand & Visual Style Configurations
# ----------------------------------------------------
FPS = 24
TOTAL_DURATION_SEC = 6
TOTAL_FRAMES = FPS * TOTAL_DURATION_SEC # 144 frames

# High-contrast color palette
COLOR_BG_DARK = (4, 10, 20)
COLOR_HEADER_BG = (6, 14, 26)
COLOR_BORDER_CYAN = (0, 195, 255)
COLOR_TEXT_WHITE = (255, 255, 255)
COLOR_TEXT_CYAN = (0, 210, 255)
COLOR_TEXT_GOLD = (255, 215, 0)
COLOR_FLAP_TOP = (16, 26, 40)
COLOR_FLAP_BOT = (8, 14, 24)
COLOR_SPLIT_LINE = (2, 4, 8)

CHAR_SET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-:/."

# Load Fonts with bold fallback
def get_font(size):
    font_paths = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/consolab.ttf",
        "C:/Windows/Fonts/trebucbd.ttf",
        "C:/Windows/Fonts/segoui.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

# ----------------------------------------------------
# Load Theme Graphic Assets (Excluding Airplane)
# ----------------------------------------------------
def load_asset(name):
    path = os.path.join(ASSETS_DIR, name)
    if os.path.exists(path):
        try:
            return Image.open(path).convert("RGBA")
        except Exception as e:
            print(f"Warning: Could not load asset {name}: {e}")
    return None

ASSET_BG = load_asset("bg-gradient.jpg") or load_asset("ua-gradient-bg.png")
ASSET_LOGO_UA = load_asset("logo-ua-white.png")
ASSET_FLAMINGO = load_asset("travel-flamingo.png")
ASSET_CLOUD1 = load_asset("travel-cloud-1.png")
ASSET_CLOUD2 = load_asset("travel-cloud-2.png")

# ----------------------------------------------------
# 5 Lobby Screen Data Definitions
# ----------------------------------------------------
SCREENS_DATA = [
    {
        "id": 1,
        "title": "UNIVERSAL ASSISTANCE",
        "subtitle": "PANEL DE BIENVENIDA // EVENTO 2026",
        "rows": [
            {"text": "BIENVENIDOS A BORDO", "type": "gold"},
            {"text": "EVENTO ANUAL 2026", "type": "white"},
            {"text": "DESTINO: EXPERIENCIA VIP", "type": "cyan"},
            {"text": "ESTADO: CONFIRMADO", "type": "gold"},
            {"text": "TU VIAJE ES TU VIAJE", "type": "white"},
        ]
    },
    {
        "id": 2,
        "title": "FLIGHT & PROTECTION BOARD",
        "subtitle": "SERVICIOS DE ASISTENCIA Y VUELOS",
        "rows": [
            {"text": "UA-2026 ASISTENCIA MEDICA   ON TIME", "type": "white"},
            {"text": "UA-724  COBERTURA GLOBAL    BOARDING", "type": "gold"},
            {"text": "UA-365  TELEMEDICINA 24/7   CONFIRMED", "type": "cyan"},
            {"text": "UA-100  VIP ASSISTANCE      READY", "type": "gold"},
            {"text": "UA-999  PROTECCION TOTAL    SCHEDULED", "type": "white"},
        ]
    },
    {
        "id": 3,
        "title": "RED GLOBAL DE ASISTENCIA",
        "subtitle": "COBERTURA INTERNACIONAL EN TODO EL MUNDO",
        "rows": [
            {"text": "DESTINOS: LATAM // EUROPA", "type": "cyan"},
            {"text": "NORTE AMERICA // ASIA", "type": "white"},
            {"text": "COBERTURA SIN LIMITES", "type": "gold"},
            {"text": "APP MOVIL & TRACKING 24H", "type": "white"},
            {"text": "VIAJA SIEMPRE SEGURO", "type": "cyan"},
        ]
    },
    {
        "id": 4,
        "title": "VIP LOUNGE & EXPERIENCE",
        "subtitle": "ESPACIO EXCLUSIVO DE ASISTENCIA",
        "rows": [
            {"text": "COYOTE VS ACME NIGHT", "type": "gold"},
            {"text": "AREA EXCLUSIVA UA", "type": "cyan"},
            {"text": "CHECK-IN DIGITAL OK", "type": "gold"},
            {"text": "DISFRUTA LA NOCHE", "type": "white"},
            {"text": "BIENVENIDO A BORDO", "type": "cyan"},
        ]
    },
    {
        "id": 5,
        "title": "UNIVERSAL ASSISTANCE",
        "subtitle": "A ZURICH COMPANY // LIDERES EN ASISTENCIA",
        "rows": [
            {"text": "UNIVERSAL ASSISTANCE", "type": "cyan"},
            {"text": "MAS DE 40 AÑOS DE HISTORIA", "type": "white"},
            {"text": "LIDERES EN LATINOAMERICA", "type": "gold"},
            {"text": "A ZURICH COMPANY", "type": "cyan"},
            {"text": "GRACIAS POR ACOMPAÑARNOS", "type": "gold"},
        ]
    }
]

# ----------------------------------------------------
# High-Contrast Split-Flap Renderer
# ----------------------------------------------------
def draw_single_tile(draw, font, char, x, y, tile_w, tile_h, color_text, flip_progress=0.0, prev_char=' '):
    radius = max(3, int(tile_w * 0.08))
    half_h = tile_h // 2
    
    # 1. Background top half
    top_rect = [x, y, x + tile_w, y + half_h]
    draw.rounded_rectangle(top_rect, radius=radius, fill=COLOR_FLAP_TOP, outline=(30, 45, 65))
    
    # 2. Background bottom half
    bot_rect = [x, y + half_h, x + tile_w, y + tile_h]
    draw.rounded_rectangle(bot_rect, radius=radius, fill=COLOR_FLAP_BOT, outline=(20, 32, 48))
    
    def render_char_half(c, is_top):
        img_temp = Image.new("RGBA", (tile_w, half_h), (0, 0, 0, 0))
        d_temp = ImageDraw.Draw(img_temp)
        
        bbox = font.getbbox(c)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (tile_w - tw) // 2
        ty = (tile_h - th) // 2 - bbox[1]
        
        # High contrast rendering with slight dark text outline for legibility
        if is_top:
            d_temp.text((tx+1, ty+1), c, font=font, fill=(0, 0, 0, 180))
            d_temp.text((tx, ty), c, font=font, fill=color_text)
        else:
            d_temp.text((tx+1, ty - half_h + 1), c, font=font, fill=(0, 0, 0, 180))
            d_temp.text((tx, ty - half_h), c, font=font, fill=color_text)
        return img_temp

    if flip_progress <= 0.5:
        img_bot_target = render_char_half(char, False)
        img_top_prev = render_char_half(prev_char, True)
        
        draw.bitmap((x, y + half_h), img_bot_target)
        
        scale_y = math.cos(flip_progress * math.pi)
        h_scaled = int(half_h * scale_y)
        if h_scaled > 1:
            img_top_scaled = img_top_prev.resize((tile_w, h_scaled), Image.Resampling.BILINEAR)
            shadow_overlay = Image.new("RGBA", (tile_w, h_scaled), (0, 0, 0, int(180 * (1.0 - scale_y))))
            img_top_scaled = Image.alpha_composite(img_top_scaled, shadow_overlay)
            draw.bitmap((x, y + half_h - h_scaled), img_top_scaled)
    else:
        img_top_target = render_char_half(char, True)
        
        draw.bitmap((x, y), img_top_target)
        
        scale_y = math.sin((flip_progress - 0.5) * math.pi)
        h_scaled = int(half_h * scale_y)
        if h_scaled > 1:
            img_bot_scaled = render_char_half(char, False).resize((tile_w, h_scaled), Image.Resampling.BILINEAR)
            shadow_overlay = Image.new("RGBA", (tile_w, h_scaled), (0, 0, 0, int(150 * (1.0 - scale_y))))
            img_bot_scaled = Image.alpha_composite(img_bot_scaled, shadow_overlay)
            draw.bitmap((x, y + half_h), img_bot_scaled)
            
    # Middle split line
    split_y = y + half_h
    draw.line([(x, split_y), (x + tile_w, split_y)], fill=COLOR_SPLIT_LINE, width=2)
    
    # Hinge rivets
    pin_r = max(2, int(tile_w * 0.04))
    draw.ellipse([x - 1, split_y - pin_r, x + pin_r * 2, split_y + pin_r], fill=(140, 165, 190))
    draw.ellipse([x + tile_w - pin_r * 2, split_y - pin_r, x + tile_w + 1, split_y + pin_r], fill=(140, 165, 190))


def render_screen_frame(screen_info, orientation, frame_idx, char_states):
    if orientation == "vertical":
        width, height = 1080, 1920
        cols_count = 20
        tile_w, tile_h = 48, 72
        gap_x, gap_y = 6, 14
        header_h = 240
        font_title_sz = 36
        font_sub_sz = 22
        font_tile_sz = 46
    else:
        width, height = 1920, 1080
        cols_count = 32
        tile_w, tile_h = 54, 82
        gap_x, gap_y = 6, 16
        header_h = 170
        font_title_sz = 46
        font_sub_sz = 24
        font_tile_sz = 52

    # 1. Base Gradient Canvas with Deep Dark Overlay for Maximum Contrast & Readability
    if ASSET_BG:
        bg_scaled = ASSET_BG.resize((width, height), Image.Resampling.LANCZOS)
        # Deep dark contrast layer (85% opacity dark overlay)
        darkener = Image.new("RGBA", (width, height), (3, 7, 16, 215))
        img = Image.alpha_composite(bg_scaled, darkener)
    else:
        img = Image.new("RGBA", (width, height), COLOR_BG_DARK + (255,))
        
    draw = ImageDraw.Draw(img)
    
    font_title = get_font(font_title_sz)
    font_sub = get_font(font_sub_sz)
    font_tile = get_font(font_tile_sz)
    
    # 2. Header Bar
    header_overlay = Image.new("RGBA", (width, header_h), COLOR_HEADER_BG + (245,))
    img.paste(header_overlay, (0, 0), header_overlay)
    draw.line([(0, header_h), (width, header_h)], fill=COLOR_BORDER_CYAN, width=4)
    
    # Paste UA Logo
    if ASSET_LOGO_UA:
        logo_h = int(header_h * 0.48)
        aspect = ASSET_LOGO_UA.width / ASSET_LOGO_UA.height
        logo_w = int(logo_h * aspect)
        logo_resized = ASSET_LOGO_UA.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
        img.paste(logo_resized, (40, (header_h - logo_h) // 2), logo_resized)
        text_x_offset = 40 + logo_w + 25
    else:
        text_x_offset = 40

    # Header Titles
    title_text = screen_info["title"]
    sub_text = screen_info["subtitle"]
    draw.text((text_x_offset, 32), title_text, font=font_title, fill=COLOR_TEXT_WHITE)
    draw.text((text_x_offset, 32 + font_title_sz + 8), sub_text, font=font_sub, fill=COLOR_BORDER_CYAN)
    
    # Flight indicator badge right
    badge_text = "UNIVERSAL ASSISTANCE • 24 FPS"
    bbox_b = font_sub.getbbox(badge_text)
    bw = bbox_b[2] - bbox_b[0]
    draw.rectangle([width - bw - 60, 38, width - 30, 38 + font_sub_sz + 16], fill=(0, 40, 75, 240), outline=COLOR_BORDER_CYAN)
    draw.text((width - bw - 45, 46), badge_text, font=font_sub, fill=COLOR_TEXT_WHITE)

    # 3. Soft Decorative Edge Overlays (No Airplane, tasteful Cloud/Flamingo framing)
    float_y = int(math.sin(frame_idx * 0.06) * 8)
    
    if ASSET_FLAMINGO:
        flam_h = 280 if orientation == "horizontal" else 320
        flam_aspect = ASSET_FLAMINGO.width / ASSET_FLAMINGO.height
        flam_w = int(flam_h * flam_aspect)
        flam_resized = ASSET_FLAMINGO.resize((flam_w, flam_h), Image.Resampling.LANCZOS)
        # Apply 75% opacity so it stays subtler in background
        flam_alpha = flam_resized.split()[3].point(lambda p: p * 0.75)
        flam_resized.putalpha(flam_alpha)
        fx = 25
        fy = height - flam_h - 35 + float_y
        img.paste(flam_resized, (fx, fy), flam_resized)
        
    if ASSET_CLOUD1:
        cloud_w = 260 if orientation == "horizontal" else 220
        cloud_aspect = ASSET_CLOUD1.height / ASSET_CLOUD1.width
        cloud_h = int(cloud_w * cloud_aspect)
        cloud_resized = ASSET_CLOUD1.resize((cloud_w, cloud_h), Image.Resampling.LANCZOS)
        cloud_alpha = cloud_resized.split()[3].point(lambda p: p * 0.65)
        cloud_resized.putalpha(cloud_alpha)
        cx = width - cloud_w - 20
        cy = height - cloud_h - 25 - float_y
        img.paste(cloud_resized, (cx, cy), cloud_resized)

    # 4. Render Main Split-Flap Board with High Contrast Slate Backing
    rows = screen_info["rows"]
    total_grid_w = cols_count * tile_w + (cols_count - 1) * gap_x
    start_x = (width - total_grid_w) // 2
    
    num_rows = len(rows)
    total_grid_h = num_rows * tile_h + (num_rows - 1) * gap_y
    start_y = header_h + (height - header_h - total_grid_h) // 2
    
    # Board outer frame container (Dark Solid Metal Slate with Electric Cyan Outline)
    padding = 28
    board_rect = [start_x - padding, start_y - padding, start_x + total_grid_w + padding, start_y + total_grid_h + padding]
    
    # Ultra dark solid board backing (96% opaque `#050B14`)
    board_bg = Image.new("RGBA", (board_rect[2] - board_rect[0], board_rect[3] - board_rect[1]), (4, 9, 18, 248))
    img.paste(board_bg, (board_rect[0], board_rect[1]), board_bg)
    draw.rectangle(board_rect, outline=COLOR_BORDER_CYAN, width=4)
    
    # Outer frame border line
    draw.rectangle([board_rect[0]-4, board_rect[1]-4, board_rect[2]+4, board_rect[3]+4], outline=(15, 30, 50), width=2)

    for r_idx, row_item in enumerate(rows):
        target_str = row_item["text"].upper()
        if len(target_str) < cols_count:
            target_str = target_str.ljust(cols_count)
        else:
            target_str = target_str[:cols_count]
            
        row_y = start_y + r_idx * (tile_h + gap_y)
        
        t_type = row_item.get("type", "white")
        if t_type == "gold":
            color_text = COLOR_TEXT_GOLD
        elif t_type == "cyan":
            color_text = COLOR_TEXT_CYAN
        else:
            color_text = COLOR_TEXT_WHITE
            
        for c_idx in range(cols_count):
            tile_x = start_x + c_idx * (tile_w + gap_x)
            state_key = (r_idx, c_idx)
            curr_c, flip_prog, prev_c = char_states[state_key]
            
            draw_single_tile(draw, font_tile, curr_c, tile_x, row_y, tile_w, tile_h, color_text, flip_prog, prev_c)
            
    # 5. Footer Bar
    footer_h = 55
    footer_overlay = Image.new("RGBA", (width, footer_h), (3, 8, 16, 250))
    img.paste(footer_overlay, (0, height - footer_h), footer_overlay)
    draw.line([(0, height - footer_h), (width, height - footer_h)], fill=(0, 195, 255, 120), width=2)
    
    footer_text = "UNIVERSAL ASSISTANCE // A ZURICH COMPANY // PANTALLAS LOBBY 2026"
    draw.text((40, height - footer_h + 16), footer_text, font=get_font(16), fill=(180, 200, 220))
    
    return cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)

# ----------------------------------------------------
# Main Generation Function
# ----------------------------------------------------
def build_screen_animation(screen_info):
    screen_id = screen_info["id"]
    print(f"\n--- Processing Screen {screen_id}: {screen_info['title']} ---")
    
    orientations = ["vertical", "horizontal"]
    
    for orientation in orientations:
        res_str = "1080x1920" if orientation == "vertical" else "1920x1080"
        cols_count = 20 if orientation == "vertical" else 32
        
        jpg_filename = f"pantalla_{screen_id}_{orientation}_{res_str}.jpg"
        mp4_filename = f"pantalla_{screen_id}_{orientation}_{res_str}.mp4"
        
        jpg_path = os.path.join(OUTPUT_DIR, jpg_filename)
        mp4_path = os.path.join(OUTPUT_DIR, mp4_filename)
        
        print(f"Generating {orientation.upper()} ({res_str})...")
        
        w, h = (1080, 1920) if orientation == "vertical" else (1920, 1080)
        temp_mp4 = os.path.join(OUTPUT_DIR, f"temp_{screen_id}_{orientation}.mp4")
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out_video = cv2.VideoWriter(temp_mp4, fourcc, FPS, (w, h))
        
        char_states = {}
        rows = screen_info["rows"]
        
        for r_idx, row in enumerate(rows):
            t_str = row["text"].upper().ljust(cols_count)[:cols_count]
            for c_idx, target_char in enumerate(t_str):
                start_c = random.choice(CHAR_SET[:15]) if random.random() > 0.3 else ' '
                char_states[(r_idx, c_idx)] = [start_c, 0.0, start_c]

        targets = {}
        for r_idx, row in enumerate(rows):
            t_str = row["text"].upper().ljust(cols_count)[:cols_count]
            for c_idx, target_char in enumerate(t_str):
                targets[(r_idx, c_idx)] = target_char

        final_frame_bgr = None
        
        for f in range(TOTAL_FRAMES):
            for r_idx in range(len(rows)):
                for c_idx in range(cols_count):
                    key = (r_idx, c_idx)
                    target = targets[key]
                    curr_c, flip_p, prev_c = char_states[key]
                    
                    start_frame = r_idx * 6 + c_idx * 2
                    
                    if f < start_frame:
                        continue
                    elif curr_c != target and f < 90:
                        flip_p += 0.35
                        if flip_p >= 1.0:
                            flip_p = 0.0
                            prev_c = curr_c
                            if target in CHAR_SET:
                                idx_curr = CHAR_SET.find(curr_c) if curr_c in CHAR_SET else 0
                                idx_targ = CHAR_SET.find(target)
                                if idx_curr != idx_targ:
                                    next_idx = (idx_curr + 1) % len(CHAR_SET)
                                    curr_c = CHAR_SET[next_idx]
                                else:
                                    curr_c = target
                            else:
                                curr_c = target
                        char_states[key] = [curr_c, flip_p, prev_c]
                    else:
                        char_states[key] = [target, 0.0, target]
                        
            frame_bgr = render_screen_frame(screen_info, orientation, f, char_states)
            out_video.write(frame_bgr)
            
            if f == TOTAL_FRAMES - 1:
                final_frame_bgr = frame_bgr
                
        out_video.release()
        
        # Save Static JPG image
        final_rgb = cv2.cvtColor(final_frame_bgr, cv2.COLOR_BGR2RGB)
        img_jpg = Image.fromarray(final_rgb)
        img_jpg.save(jpg_path, "JPEG", quality=95)
        print(f" Saved JPG: {jpg_filename}")
        
        # Convert video to H.264 standard MP4 via ffmpeg
        ffmpeg_cmd = f'ffmpeg -y -i "{temp_mp4}" -c:v libx264 -pix_fmt yuv420p -r {FPS} "{mp4_path}"'
        os.system(ffmpeg_cmd)
        if os.path.exists(temp_mp4):
            os.remove(temp_mp4)
        print(f" Saved MP4: {mp4_filename}")

def main():
    print("=========================================================")
    print(" UNIVERSAL ASSISTANCE - HIGH CONTRAST SPLIT-FLAP GENERATOR")
    print("=========================================================")
    for screen in SCREENS_DATA:
        build_screen_animation(screen)
    print("\nAll 5 lobby screens generated with high legibility and contrast in Graficos/")

if __name__ == "__main__":
    main()
