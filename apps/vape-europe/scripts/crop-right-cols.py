"""Crop the right portion of each hi-res page to read MOQ + price columns precisely."""
from PIL import Image
import os

src = r'E:\project\<legacy-project>\vapsolo-site\data\pdf-pages-hi'
dst = r'E:\project\<legacy-project>\vapsolo-site\data\pdf-pages-hi-right'
os.makedirs(dst, exist_ok=True)

files = [
    'VOZOL_p1.png', 'VOZOL_p2.png',
    'Vapen_p1.png', 'Vapen_p2.png',
    'WASPE_p1.png', 'WASPE_p2.png',
]

for f in files:
    img = Image.open(os.path.join(src, f))
    w, h = img.size
    # Take the right ~22% (MOQ and price columns)
    left = int(w * 0.78)
    right = w
    crop = img.crop((left, 0, right, h))
    out = os.path.join(dst, f)
    crop.save(out, 'PNG', optimize=True)
    print(f'wrote {out}  size={crop.size}')
print('done')
