from __future__ import annotations

import html
import re
from typing import Any


_VAR = re.compile(r"\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}")


def render_variables(template: str | None, variables: dict[str, Any]) -> str:
    """Substitute `{{ path.to.key }}` placeholders with values from a dict.

    Missing keys become an empty string. Values are converted with `str()`.
    `None` templates render as empty string.
    """
    if not template:
        return ""

    def _lookup(path: str) -> str:
        cur: Any = variables
        for part in path.split("."):
            if isinstance(cur, dict) and part in cur:
                cur = cur[part]
            else:
                return ""
        return "" if cur is None else str(cur)

    return _VAR.sub(lambda m: _lookup(m.group(1)), template)


def render_markdown_min(md: str) -> str:
    """Minimal, safe-ish Markdown to HTML for the campaign preview.

    Supports: paragraphs, line breaks, **bold**, *italic*, [text](url), and
    auto-linking bare URLs. This is not a full Markdown engine — authors who
    need more control should fill in `body_html` directly on the template.
    """
    text = md or ""
    safe = html.escape(text)

    safe = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', safe)

    safe = re.sub(
        r"(?<!href=\")(https?://[^\s<]+)",
        r'<a href="\1">\1</a>',
        safe,
    )

    safe = re.sub(r"\*\*([^*\n]+)\*\*", r"<strong>\1</strong>", safe)
    safe = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", safe)

    paragraphs = [p.strip() for p in re.split(r"\n{2,}", safe) if p.strip()]
    return "".join(f"<p>{p.replace(chr(10), '<br>')}</p>" for p in paragraphs)


def template_to_text_html(
    subject_tmpl: str | None,
    body_md: str | None,
    body_html: str | None,
    variables: dict[str, Any],
) -> tuple[str, str, str]:
    """Render (subject, html, text) with variables substituted. Handles NULL inputs."""
    subject = render_variables(subject_tmpl or "", variables)
    text = render_variables(body_md or "", variables)
    if body_html:
        html_out = render_variables(body_html, variables)
    else:
        html_out = render_markdown_min(text)
    return subject, html_out, text
