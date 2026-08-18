from pathlib import Path

from app.services.session_service import (
    load_session,
    get_photo_paths,
    update_layout,
)

from app.services.template_service import get_template
from app.services.collage_service import generate_collage
from app.services.frame_service import apply_frame


def generate_final(session_id: str, template_id: str):

    
    session = load_session(session_id)

    if session is None:
        raise Exception("Session not found")

   
    template = get_template(template_id)

    if template is None:
        raise Exception(
            f"Template '{template_id}' not found"
        )

    layout = template["layout"]
    frame = template["frame"]
    frame_path = template["frame_path"]

    
    update_layout(
        session_id,
        template_id
    )

    
    photo_paths = get_photo_paths(session_id)

    if not photo_paths:
        raise Exception(
            "No photos uploaded for this session"
        )

   
    output_folder = (
        Path(__file__).resolve().parents[2]
        / "storage"
        / "uploads"
        / session_id
        / "output"
    )

    output_folder.mkdir(
        parents=True,
        exist_ok=True
    )

    collage_path = generate_collage(
        photo_paths=photo_paths,
        layout_name=layout,
        output_folder=str(output_folder)
    )

    final_image = apply_frame(
        collage_path=collage_path,
        frame_path=frame_path,
        output_folder=str(output_folder)
    )

   
    return {
        "success": True,
        "message": "Photo generated successfully.",
        "sessionId": session_id,
        "templateId": template_id,
        "layout": layout,
        "frame": frame,
        "collage": collage_path,
        "final_image": final_image,
    }