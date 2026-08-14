from fastapi import APIRouter

from app.layouts.layouts import LAYOUTS
from app.services.template_service import load_templates

router = APIRouter()


@router.get("/templates")
def list_templates():
    """
    Template catalogue for the frontend.

    `slots` is what the client needs: it picks the template whose slot count
    matches the number of photos it captured, so no layout mapping is hardcoded
    in the UI.
    """

    templates = load_templates()

    return {
        "templates": [
            {
                "id": template_id,
                "name": template.get("name", template_id),
                "layout": template["layout"],
                "frame": template["frame"],
                "slots": len(LAYOUTS[template["layout"]]["slots"]),
            }
            for template_id, template in templates.items()
            if template["layout"] in LAYOUTS
        ]
    }
