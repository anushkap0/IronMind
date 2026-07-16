import datetime as dt

from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.oauth import oauth
from app.security import create_access_token
from app.config import settings

router = APIRouter(prefix="/api/auth/google", tags=["Google OAuth"])


@router.get("/login")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(request, settings.GOOGLE_REDIRECT_URI)


@router.get("/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo") or await oauth.google.userinfo(token=token)

    email = userinfo["email"]
    full_name = userinfo.get("name", email.split("@")[0])

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            full_name=full_name,
            email=email,
            hashed_password=None,
            auth_provider="google",
            goal="maintain",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    user.last_login = dt.datetime.utcnow()
    db.commit()

    jwt_token = create_access_token({"sub": str(user.id)})
    return RedirectResponse(f"{settings.FRONTEND_ORIGIN}/oauth-callback?token={jwt_token}")
