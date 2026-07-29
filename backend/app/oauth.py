from authlib.integrations.starlette_client import OAuth
from app.config import settings

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    clata_urient_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadl="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)
