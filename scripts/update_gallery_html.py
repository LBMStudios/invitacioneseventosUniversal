import json

html_path = r"c:\Users\Lucas Rossi\Downloads\UAInvitacón\firebase\public\galeria.html"
json_path = r"c:\Users\Lucas Rossi\Downloads\UAInvitacón\firebase\public\assets\galeria\gallery_items.json"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

with open(json_path, "r", encoding="utf-8") as f:
    items = json.load(f)

# 1. Update header download button
old_btn1 = """<a id="btnDownloadAll" href="#" onclick="alert('El enlace de descarga del álbum completo se activará cuando estén publicadas las fotos del fotógrafo.'); return false;" class="btn-cta" style="background: linear-gradient(135deg, #0284c7, #0369a1); font-size: 13px; padding: 10px 18px;">
        📦 Descargar Todo el Álbum
      </a>"""
new_btn1 = """<a id="btnDownloadAll" href="/assets/galeria/Album_Universal_Assistance_Coyote_vs_Acme_HD.zip" download="Album_Universal_Assistance_Coyote_vs_Acme_HD.zip" class="btn-cta" style="background: linear-gradient(135deg, #0284c7, #0369a1); font-size: 13px; padding: 10px 18px;">
        📦 Descargar Todo el Álbum (ZIP HD)
      </a>"""
if old_btn1 in html:
    html = html.replace(old_btn1, new_btn1)
    print("Header download button updated.")
else:
    print("Warning: old_btn1 not found verbatim.")

# 2. Update footer banner download button
old_btn2 = """<a href="#" onclick="alert('El enlace de descarga del álbum completo se activará cuando estén publicadas las fotos del fotógrafo.'); return false;" class="btn-cta" style="padding: 12px 24px; font-size: 14px; white-space: nowrap; text-decoration: none;">
        📦 Descargar Álbum
      </a>"""
new_btn2 = """<a href="/assets/galeria/Album_Universal_Assistance_Coyote_vs_Acme_HD.zip" download="Album_Universal_Assistance_Coyote_vs_Acme_HD.zip" class="btn-cta" style="padding: 12px 24px; font-size: 14px; white-space: nowrap; text-decoration: none;">
        📦 Descargar Todo el Álbum (ZIP HD)
      </a>"""
if old_btn2 in html:
    html = html.replace(old_btn2, new_btn2)
    print("Footer download button updated.")
else:
    print("Warning: old_btn2 not found verbatim.")

# 3. Update badge
html = html.replace(
    '<span class="gal-toolbar-badge" id="photoCountBadge">3 Fotos HD</span>',
    '<span class="gal-toolbar-badge" id="photoCountBadge">130 Fotos HD</span>'
)

# 4. Replace GALLERY_ITEMS array
start_marker = "    // Colección de fotos del evento\n    const GALLERY_ITEMS = ["
end_marker = "    ];"
idx_start = html.find(start_marker)
if idx_start != -1:
    idx_end = html.find(end_marker, idx_start) + len(end_marker)
    json_str = json.dumps(items, indent=4)
    new_gallery_block = f"    // Colección de fotos oficiales del evento (130 fotos HD)\n    const GALLERY_ITEMS = {json_str};"
    html = html[:idx_start] + new_gallery_block + html[idx_end:]
    print("Successfully replaced GALLERY_ITEMS.")
else:
    print("Error: GALLERY_ITEMS start_marker not found.")

# 5. Ensure img.src uses thumb in renderGallery
old_render_img = "img.src = item.src;"
new_render_img = "img.src = item.thumb || item.src;"
if old_render_img in html:
    html = html.replace(old_render_img, new_render_img, 1)
    print("Successfully updated renderGallery thumbnail source.")

# 6. Ensure download filename is friendly in openLightboxByIndex
old_dl = "document.getElementById('lightbox-download-link').href = item.src;"
new_dl = "const dlLink = document.getElementById('lightbox-download-link'); dlLink.href = item.src; dlLink.download = 'Universal_Assistance_Coyote_vs_Acme_' + String(item.id).padStart(3, '0') + '.jpg';"
if old_dl in html:
    html = html.replace(old_dl, new_dl)
    print("Successfully updated download link with custom filename.")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("galeria.html updated successfully!")
