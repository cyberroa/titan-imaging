from __future__ import annotations

from app.settings import get_settings
from app.unsubscribe_tokens import make_token


def unsubscribe_url(email: str, campaign_id: str | None = None) -> str:
    settings = get_settings()
    base = (settings.public_api_url or settings.public_site_url or "").rstrip("/")
    token = make_token(email, campaign_id=campaign_id)
    return f"{base}/api/v1/unsubscribe?token={token}"


def text_footer(email: str, campaign_id: str | None = None) -> str:
    settings = get_settings()
    url = unsubscribe_url(email, campaign_id=campaign_id)
    address = settings.mailing_address or "Titan Imaging"
    return (
        "\n\n---\n"
        f"You received this email because you're a Titan Imaging contact. "
        f"To stop receiving messages, unsubscribe here: {url}\n"
        f"{address}"
    )


def html_footer(email: str, campaign_id: str | None = None) -> str:
    settings = get_settings()
    url = unsubscribe_url(email, campaign_id=campaign_id)
    address = settings.mailing_address or "Titan Imaging"
    return (
        '<hr style="margin:32px 0;border:none;border-top:1px solid #ddd">'
        '<p style="font-size:12px;color:#666;line-height:1.5">'
        "You received this email because you're a Titan Imaging contact."
        f' <a href="{url}" style="color:#666">Unsubscribe</a>.'
        f"<br>{address}"
        "</p>"
    )


def list_unsubscribe_headers(email: str, campaign_id: str | None = None) -> dict[str, str]:
    """
    Returns headers Resend will forward: `List-Unsubscribe` (mailto+url) and
    `List-Unsubscribe-Post` for one-click unsubscribe (RFC 8058).
    """
    url = unsubscribe_url(email, campaign_id=campaign_id)
    settings = get_settings()
    mailto = settings.email_from_customer or settings.email_from or settings.admin_notify_email
    parts = [f"<{url}>"]
    if mailto:
        parts.append(f"<mailto:{mailto}?subject=unsubscribe>")
    return {
        "List-Unsubscribe": ", ".join(parts),
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }
