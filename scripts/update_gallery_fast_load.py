import json

html_path = r"c:\Users\Lucas Rossi\Downloads\UAInvitacón\firebase\public\galeria.html"
json_path = r"c:\Users\Lucas Rossi\Downloads\UAInvitacón\firebase\public\assets\galeria\gallery_items.json"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

with open(json_path, "r", encoding="utf-8") as f:
    items = json.load(f)

# 1. Update GALLERY_ITEMS array with the new "web" fields
start_marker = "    // Colección de fotos oficiales del evento (130 fotos HD)\n    const GALLERY_ITEMS = ["
end_marker = "    ];"
idx_start = html.find(start_marker)
if idx_start != -1:
    idx_end = html.find(end_marker, idx_start) + len(end_marker)
    json_str = json.dumps(items, indent=4)
    new_gallery_block = f"    // Colección de fotos oficiales del evento (130 fotos HD)\n    const GALLERY_ITEMS = {json_str};"
    html = html[:idx_start] + new_gallery_block + html[idx_end:]
    print("Updated GALLERY_ITEMS with web webp paths.")
else:
    print("Warning: start_marker for GALLERY_ITEMS not found.")

# 2. Update lightbox HTML to include instant thumbnail blur-up
old_img_wrap = """      <div class="lightbox-img-wrap" id="lightboxImgWrap" onclick="toggleZoom()">
        <img id="lightbox-img" src="" alt="Foto en alta resolución">
      </div>"""

new_img_wrap = """      <div class="lightbox-img-wrap" id="lightboxImgWrap" onclick="toggleZoom()">
        <img id="lightbox-thumb" src="" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; filter: blur(12px); transform: scale(1.02); opacity: 0; transition: opacity 0.2s ease;">
        <img id="lightbox-img" src="" alt="Foto en alta resolución" style="position: relative; max-width: 100%; max-height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.25s ease; z-index: 2;">
      </div>"""

if old_img_wrap in html:
    html = html.replace(old_img_wrap, new_img_wrap)
    print("Updated lightbox-img-wrap with instant blur-up.")
else:
    print("Warning: old_img_wrap not found verbatim.")

# 3. Replace preloadAdjacent and openLightboxByIndex with progressive instant logic
old_fn_block_start = "    function preloadAdjacent(idx) {"
old_fn_block_end = "    function toggleZoom() {"

idx_fn_start = html.find(old_fn_block_start)
idx_fn_end = html.find(old_fn_block_end)

if idx_fn_start != -1 and idx_fn_end != -1:
    new_fn_block = """    function preloadAdjacent(idx) {
      if (!GALLERY_ITEMS.length) return;
      // Precarga agresiva de las próximas 5 fotos y anteriores 2 fotos
      const targets = [
        (idx + 1) % GALLERY_ITEMS.length,
        (idx + 2) % GALLERY_ITEMS.length,
        (idx + 3) % GALLERY_ITEMS.length,
        (idx + 4) % GALLERY_ITEMS.length,
        (idx + 5) % GALLERY_ITEMS.length,
        (idx - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length,
        (idx - 2 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length
      ];

      targets.forEach(tIdx => {
        const item = GALLERY_ITEMS[tIdx];
        if (item) {
          const targetSrc = item.web || item.src;
          if (targetSrc && !preloadedCache.has(targetSrc)) {
            const img = new Image();
            img.decoding = 'async';
            img.src = targetSrc;
            preloadedCache.add(targetSrc);
          }
        }
      });
    }

    function setViewMode(mode) {
      currentMode = mode;
      const grid = document.getElementById('gallery-grid');
      grid.className = `gal-grid mode-${mode}`;

      document.querySelectorAll('.seg-btn').forEach(b => {
        if (b.id && b.id.startsWith('btnMode')) b.classList.remove('active');
      });
      if (mode === 'grid') document.getElementById('btnModeGrid').classList.add('active');
      if (mode === 'large') document.getElementById('btnModeLarge').classList.add('active');
      if (mode === 'feed') document.getElementById('btnModeFeed').classList.add('active');
    }

    function renderGallery() {
      const grid = document.getElementById('gallery-grid');
      grid.innerHTML = '';

      document.getElementById('photoCountBadge').innerText = `${GALLERY_ITEMS.length} Fotos HD`;

      GALLERY_ITEMS.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'gal-card';
        if (item.w && item.h) {
          card.style.aspectRatio = `${item.w} / ${item.h}`;
        }
        card.onclick = () => openLightboxByIndex(idx);

        const img = document.createElement('img');
        img.src = item.thumb || item.src;
        img.alt = `Foto ${item.id} - Avant Premiere Coyote vs. Acme`;
        img.loading = idx < 8 ? 'eager' : 'lazy';
        img.decoding = 'async';
        if (idx < 2) img.fetchPriority = 'high';

        img.onload = () => img.classList.add('loaded');
        if (img.complete) img.classList.add('loaded');

        const overlay = document.createElement('div');
        overlay.className = 'gal-card-overlay';
        overlay.innerHTML = `
          <span style="color: #fff; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
            🔍 Ver en HD
          </span>
        `;

        card.appendChild(img);
        card.appendChild(overlay);
        grid.appendChild(card);
      });

      // Precarga silenciosa en segundo plano de las primeras fotos HD
      setTimeout(() => preloadAdjacent(0), 100);
    }

    function openLightboxByIndex(index) {
      if (index < 0 || index >= GALLERY_ITEMS.length) return;
      currentIndex = index;
      const item = GALLERY_ITEMS[currentIndex];

      const imgWrap = document.getElementById('lightboxImgWrap');
      imgWrap.classList.remove('zoomed');

      const lightThumb = document.getElementById('lightbox-thumb');
      const lightImg = document.getElementById('lightbox-img');

      // 1. Mostrar de inmediato la miniatura (0ms de espera ya que está en caché local)
      if (lightThumb) {
        lightThumb.src = item.thumb || item.src;
        lightThumb.style.opacity = '1';
      }

      // 2. Cargar versión WebP ultra-rápida (o HD)
      const targetSrc = item.web || item.src;
      lightImg.style.opacity = '0';
      lightImg.src = targetSrc;

      const finishLoaded = () => {
        lightImg.style.opacity = '1';
        if (lightThumb) {
          setTimeout(() => { lightThumb.style.opacity = '0'; }, 100);
        }
      };

      lightImg.onload = finishLoaded;
      if (lightImg.complete) finishLoaded();

      document.getElementById('lightbox-counter').innerText = `Foto ${currentIndex + 1} de ${GALLERY_ITEMS.length}`;
      
      const dlLink = document.getElementById('lightbox-download-link');
      dlLink.href = item.src;
      dlLink.download = 'Universal_Assistance_Coyote_vs_Acme_' + String(item.id).padStart(3, '0') + '.jpg';

      const shareText = encodeURIComponent(`¡Mirá esta foto del Avant Premiere de Coyote vs. Acme con Universal Assistance! 🎬📸 ${window.location.origin}${item.src}`);
      document.getElementById('lightbox-share-btn').href = `https://wa.me/?text=${shareText}`;

      document.getElementById('lightboxModal').classList.add('active');

      // Precargar fotos contiguas en memoria
      preloadAdjacent(currentIndex);
    }

"""
    html = html[:idx_fn_start] + new_fn_block + html[idx_fn_end:]
    print("Updated JavaScript functions for instant zero-lag lightbox.")
else:
    print("Warning: fn_block markers not found.")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("galeria.html updated successfully!")
