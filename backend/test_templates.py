"""
Self-check for the template catalogue.

Every generate call goes layout -> slots -> frame file, and a missing frame or a
layout with no template only shows up as a 400 at the end of a photo session.
Run: python test_templates.py
"""

from pathlib import Path

from PIL import Image

from app.layouts.layouts import LAYOUTS
from app.services.template_service import TEMPLATE_DIR, get_template, load_templates


def test_templates():
    templates = load_templates()

    assert templates, "templates.json is empty"

    slot_counts = set()

    for template_id in templates:
        template = get_template(template_id)

        layout = template["layout"]

        assert layout in LAYOUTS, (
            f"{template_id} uses unknown layout '{layout}'"
        )

        frame = Path(template["frame_path"])

        assert frame.exists(), (
            f"{template_id} frame missing: {frame}"
        )

        # An opaque frame composites over the whole collage and ships a blank print.
        alpha = Image.open(frame).convert("RGBA").getchannel("A")

        assert alpha.getextrema()[0] < 255, (
            f"{template_id} frame has no transparency: {frame}"
        )

        slot_counts.add(len(LAYOUTS[layout]["slots"]))

    # The frontend picks a template by photo count, so every count the booth can
    # capture (1, 3, 4) needs one.
    for count in (1, 3, 4):
        assert count in slot_counts, (
            f"no template takes {count} photo(s); the UI cannot generate that layout"
        )

    for name, layout in LAYOUTS.items():
        width, height = layout["canvas"]

        for x, y, w, h in layout["slots"]:
            assert x >= 0 and y >= 0, f"{name}: negative slot origin"
            assert x + w <= width and y + h <= height, (
                f"{name}: slot ({x},{y},{w},{h}) falls outside {width}x{height}"
            )

    print(f"OK: {len(templates)} templates, slot counts {sorted(slot_counts)}")


if __name__ == "__main__":
    test_templates()
