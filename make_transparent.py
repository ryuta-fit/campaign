from PIL import Image
import os

def remove_white_bg(image_path, threshold=240):
    try:
        img = Image.open(image_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check if pixel is close to white
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                newData.append((255, 255, 255, 0)) # Make Transparent
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(image_path, "PNG")
        print(f"Processed: {image_path}")
    except Exception as e:
        print(f"Failed to process {image_path}: {e}")

assets = [
    "assets/kadomatsu_decor.png",
    "assets/hero_illustration.png",
    "assets/gold_cloud.png"
]

for asset in assets:
    if os.path.exists(asset):
        remove_white_bg(asset)
    else:
        print(f"Not found: {asset}")
