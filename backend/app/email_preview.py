from __future__ import annotations

from app.email_footer import html_footer, text_footer
from app.templating import template_to_text_html


def render_inbox_preview(
    subject_tmpl: str | None,
    body_md: str | None,
    body_html: str | None,
    variables: dict,
    *,
    campaign_id: str | None = None,
) -> tuple[str, str, str]:
    email = str(variables.get("email") or "preview@example.com")
    subject, html_out, text_out = template_to_text_html(subject_tmpl, body_md, body_html, variables)
    html_out = (html_out or "") + html_footer(email, campaign_id)
    text_out = (text_out or "") + text_footer(email, campaign_id)
    return subject, html_out, text_out
