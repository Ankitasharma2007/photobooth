from pathlib import Path
from PIL import Image

from app.layouts.layouts import LAYOUTS


def generate_collage(photo_paths, layout_name, output_folder):
    """
    Generate a collage from uploaded photos.

    Args:
        photo_paths (list): List of image file paths.
        layout_name (str): one, two, three, four.
        output_folder (str): Folder where collage will be saved.

    Returns:
        str: Path to generated collage.
    """

    # Get layout configuration
    layout = LAYOUTS[layout_name]

    canvas_width, canvas_height = layout["canvas"]
    slots = layout["slots"]

    # Validate number of photos
    if len(photo_paths) != len(slots):
        raise ValueError(
            f"{layout_name} layout requires {len(slots)} photos, "
            f"but got {len(photo_paths)}."
        )

    # Create blank canvas
    canvas = Image.new(
        "RGB",
        (canvas_width, canvas_height),
        "white"
    )

    # Paste each photo
    for photo_path, slot in zip(photo_paths, slots):

        image = Image.open(photo_path)

        x, y, width, height = slot

        image = image.resize(
            (width, height),
            Image.Resampling.LANCZOS
        )

        canvas.paste(image, (x, y))

    # Create output folder if needed
    output_folder = Path(output_folder)
    output_folder.mkdir(parents=True, exist_ok=True)

    # Save collage
    output_path = output_folder / "collage.jpg"

    canvas.save(
        output_path,
        quality=95
    )

    return str(output_path)