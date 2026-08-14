import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
CONFIG_FILE = os.path.join(TEMPLATE_DIR, "templates.json")


def load_templates():
    with open(CONFIG_FILE, "r") as f:
        return json.load(f)


def get_template(template_id: str):

    templates = load_templates()

    if template_id not in templates:
        raise Exception("Template not found")

    template = templates[template_id]

    return {
        "layout": template["layout"],
        "frame": template["frame"],
        "frame_path": os.path.join(
            TEMPLATE_DIR,
            template["layout"],
            template["frame"]
        )
    }
