from pathlib import Path
from PIL import Image


def apply_frame(collage_path: str, frame_path: str, output_folder: str):
    """
    Overlay a transparent PNG frame on the collage.

    Args:
        collage_path: Path to collage.jpg
        frame_path: Path to frame PNG
        output_folder: Session output folder

    Returns:
        Path to final image
    """

    # Open collage
    collage = Image.open(collage_path).convert("RGBA")

    # Open frame
    frame = Image.open(frame_path).convert("RGBA")

    # Resize frame to match collage size
    frame = frame.resize(
        collage.size,
        Image.Resampling.LANCZOS
    )

    # Overlay
    final_image = Image.alpha_composite(
        collage,
        frame
    )

    # Create output folder
    output_folder = Path(output_folder)
    output_folder.mkdir(parents=True, exist_ok=True)

    # Save final image
    output_path = output_folder / "final_hd.png"

    final_image.save(output_path)

    return str(output_path)