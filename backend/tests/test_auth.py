"""End-to-end tests for the auth flow, using a real (in-memory) DB and
FastAPI's TestClient — these hit the actual HTTP endpoints."""


def test_register_creates_user_and_returns_token(client):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": "test@example.com",
            "password": "password123",
            "goal": "lose",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_register_duplicate_email_fails(client):
    payload = {
        "full_name": "Test User",
        "email": "dupe@example.com",
        "password": "password123",
        "goal": "lose",
    }
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/register", json=payload)
    assert second.status_code == 400


def test_login_with_correct_credentials(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Login Test",
            "email": "login@example.com",
            "password": "password123",
            "goal": "maintain",
        },
    )
    response = client.post(
        "/api/auth/login",
        data={"username": "login@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_with_wrong_password_fails(client):
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Login Test",
            "email": "login2@example.com",
            "password": "password123",
            "goal": "maintain",
        },
    )
    response = client.post(
        "/api/auth/login",
        data={"username": "login2@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_protected_endpoint_requires_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
