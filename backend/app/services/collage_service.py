from pathlib import Path
from PIL import Image

from app.layouts.layouts import LAYOUTS


def crop_to_ratio(image, target_width, target_height, zoom=1.0):
    """
    Crop an image to the target aspect ratio without stretching,
    then resize it to the exact slot dimensions.
    """

    target_ratio = target_width / target_height

    width, height = image.size
    current_ratio = width / height

  

    if current_ratio > target_ratio:
        # Image is too wide.
        # Crop left and right.
        new_width = int(height * target_ratio)

        left = (width - new_width) // 2

        image = image.crop(
            (
                left,
                0,
                left + new_width,
                height
            )
        )

    else:
        
        new_height = int(width / target_ratio)

        top = (height - new_height) // 2

        image = image.crop(
            (
                0,
                top,
                width,
                top + new_height
            )
        )



    if zoom > 1.0:

        width, height = image.size

        crop_width = int(width / zoom)
        crop_height = int(height / zoom)

        left = (width - crop_width) // 2
        top = (height - crop_height) // 2

        image = image.crop(
            (
                left,
                top,
                left + crop_width,
                top + crop_height
            )
        )

  
    return image.resize(
        (target_width, target_height),
        Image.Resampling.LANCZOS
    )


def generate_collage(photo_paths, layout_name, output_folder):
    """
    Generate a collage from uploaded photos.

    Args:
        photo_paths (list): List of image file paths.
        layout_name (str): one, three, four.
        output_folder (str): Folder where collage will be saved.

    Returns:
        str: Path to generated collage.
    """


    layout = LAYOUTS[layout_name]

    canvas_width, canvas_height = layout["canvas"]
    slots = layout["slots"]

   
    if len(photo_paths) != len(slots):
        raise ValueError(
            f"{layout_name} layout requires "
            f"{len(slots)} photos, "
            f"but got {len(photo_paths)}."
        )


    canvas = Image.new(
        "RGB",
        (canvas_width, canvas_height),
        "white"
    )

    if layout_name == "one":
        zoom = 1.0

    elif layout_name == "three":
        zoom = 1.15

    elif layout_name == "four":
        zoom = 1.20

    else:
        zoom = 1.0




    for photo_path, slot in zip(photo_paths, slots):

        image = Image.open(photo_path).convert("RGB")

        x, y, width, height = slot

        
        image = crop_to_ratio(
            image,
            width,
            height,
            zoom=zoom
        )

        canvas.paste(
            image,
            (x, y)
        )

        image.close()

   

    output_folder = Path(output_folder)

    output_folder.mkdir(
        parents=True,
        exist_ok=True
    )

  

    output_path = output_folder / "collage.jpg"

    canvas.save(
        output_path,
        quality=95
    )

    return str(output_path)