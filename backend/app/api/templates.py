from fastapi import APIRouter

from app.services.template_service import load_templates
from app.layouts.layouts import LAYOUTS

router = APIRouter()


@router.get("/templates")
def list_templates():

    templates = load_templates()

    return {
        "templates": [
            {
                "id": template_id,
                "layout": template["layout"],
                "frame": template["frame"],
                "slots": len(LAYOUTS[template["layout"]]["slots"]),
            }
            for template_id, template in templates.items()
        ]
    }
