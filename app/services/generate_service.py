from pathlib import Path
from app.services.session_service import (
    load_session,
    update_layout,
    update_frame,
)
from app.services.template_service import get_template
from app.services.collage_service import generate_collage
from app.services.frame_service import apply_frame
from app.services.session_service import UPLOAD_ROOT

def generate_final(session_id: str, template_id: str):
    session = load_session(session_id)

    if session is None:
        raise Exception("Session not found")

    # Get template details
    template = get_template(template_id)

    layout = template["layout"]
    frame = template["frame"]

    # Save selected layout & frame in session.json
    update_layout(session_id, layout)
    update_frame(session_id, frame)

    # Build photo paths
    photo_folder = Path(UPLOAD_ROOT) / session_id / "photos"

    photo_paths = []

    for photo in session["photos"]:
        photo_paths.append(
            str(photo_folder / photo["filename"])
        )

    # Output folder
    output_folder = Path(UPLOAD_ROOT) / session_id / "output"

    # Generate collage
    collage_path = generate_collage(
        photo_paths=photo_paths,
        layout_name=layout,
        output_folder=str(output_folder)
    )
    final_image = apply_frame(
    collage_path=collage_path,
    frame_path=template["frame_path"],
    output_folder=str(output_folder)
    )

    return {
    "success": True,
    "message": "Collage generated successfully.",
    "layout": layout,
    "frame": frame,
    "collage": collage_path,
    "final_image": final_image
}