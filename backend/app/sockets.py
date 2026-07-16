import socketio
from app.security import decode_access_token

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

_latest_state: dict = {}


def _room_for(user_id) -> str:
    return f"user:{user_id}"


@sio.event
async def connect(sid, environ, auth):
    token = (auth or {}).get("token")
    payload = decode_access_token(token) if token else None
    if not payload:
        return False

    user_id = payload.get("sub")
    await sio.save_session(sid, {"user_id": user_id})
    await sio.enter_room(sid, _room_for(user_id))

    if user_id in _latest_state:
        await sio.emit("timer_sync", _latest_state[user_id], to=sid)


@sio.event
async def timer_update(sid, data):
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    if not user_id:
        return
    _latest_state[user_id] = data
    await sio.emit("timer_sync", data, room=_room_for(user_id), skip_sid=sid)

    if data.get("phase") == "done":
        await notify_user(user_id, "workout", "Workout session complete — nice work!")


@sio.event
async def disconnect(sid):
    pass


async def notify_user(user_id, notif_type: str, message: str, extra: dict | None = None):
    payload = {"type": notif_type, "message": message, **(extra or {})}
    await sio.emit("notification", payload, room=_room_for(str(user_id)))
