"""Crop the hi-res PDF page renders into horizontal strips for OCR-friendly inspection."""
from PIL import Image
import os

src = r'E:\project\<legacy-project>\vapsolo-site\data\pdf-pages-hi'
dst = r'E:\project\<legacy-project>\vapsolo-site\data\pdf-pages-hi-crops'
os.makedirs(dst, exist_ok=True)

files = [
    'VOZOL_p1.png', 'VOZOL_p2.png',
    'Vapen_p1.png', 'Vapen_p2.png',
    'WASPE_p1.png', 'WASPE_p2.png',
]

for f in files:
    img = Image.open(os.path.join(src, f))
    w, h = img.size
    # Split into 3 vertical strips with overlap so we can read each row clearly
    strips = 3
    overlap = 200
    slice_h = (h + (strips - 1) * overlap) // strips
    for i in range(strips):
        top = max(0, i * (slice_h - overlap))
        bottom = min(h, top + slice_h)
        crop = img.crop((0, top, w, bottom))
        out = os.path.join(dst, f.replace('.png', f'_s{i+1}.png'))
        crop.save(out, 'PNG', optimize=True)
        print(f'wrote {out}  size={crop.size}')
print('done')
