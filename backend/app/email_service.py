"""
Sends transactional emails via Gmail SMTP using an "App Password" (Gmail
blocks regular password login for SMTP as a security measure — see README
for how to generate one). Completely optional: if REMINDERS_ENABLED is
False or credentials are missing, sending is skipped and logged instead
of raising, so the app works fine without this configured.
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings

logger = logging.getLogger("ironmind.email")

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465


def send_email(to_address: str, subject: str, html_body: str) -> tuple[bool, str]:
    """Returns (success, message) — never raises, so callers (including the
    daily scheduler) never crash because one email failed to send."""
    if not settings.GMAIL_ADDRESS or not settings.GMAIL_APP_PASSWORD:
        msg = "Email not sent: GMAIL_ADDRESS / GMAIL_APP_PASSWORD not configured."
        logger.warning(msg)
        return False, msg

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.GMAIL_ADDRESS
    message["To"] = to_address
    message.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.login(settings.GMAIL_ADDRESS, settings.GMAIL_APP_PASSWORD)
            server.sendmail(settings.GMAIL_ADDRESS, to_address, message.as_string())
        return True, "Sent successfully."
    except smtplib.SMTPAuthenticationError:
        msg = (
            "Gmail rejected the login. Make sure GMAIL_APP_PASSWORD is a 16-character "
            "App Password (not your regular Gmail password) — see README for setup steps."
        )
        logger.error(msg)
        return False, msg
    except Exception as exc:
        msg = f"Failed to send email: {exc}"
        logger.error(msg, exc_info=True)
        return False, msg


def build_reminder_email(full_name: str, streak_days: int) -> tuple[str, str]:
    first_name = full_name.split(" ")[0] if full_name else "there"
    subject = "Your daily IronMind check-in 💪"

    streak_line = (
        f"You're on a <strong>{streak_days}-day streak</strong> — keep it going!"
        if streak_days > 0
        else "Start today's streak — even a quick check-in counts."
    )

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background:#0A0A0C; color:#F5F1EC; border-radius:12px;">
      <h2 style="color:#E31B3D; margin-top:0;">IronMind</h2>
      <p>Hey {first_name},</p>
      <p>Time for your daily check-in:</p>
      <ul style="line-height:1.8;">
        <li>Log today's <strong>BMI</strong> to keep your trend chart current</li>
        <li>Get in a <strong>workout</strong> — timer or Form Check, your call</li>
      </ul>
      <p>{streak_line}</p>
      <p style="margin-top:24px; font-size:13px; color:#8B8B95;">
        You're receiving this because daily reminders are enabled on your IronMind account.
      </p>
    </div>
    """
    return subject, html_body
