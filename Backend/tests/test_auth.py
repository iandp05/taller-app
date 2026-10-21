import pytest

def test_login_exitoso(client):
    response = client.post(
        "/usuarios/login",
        json={"username": "luca", "password": "1234"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_fallido_clave_incorrecta(client):
    response = client.post(
        "/usuarios/login",
        json={"username": "luca", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "detail" in response.json()

def test_obtener_usuario_actual(client, auth_headers):
    # Retrieve user list or check login token response
    response = client.get("/usuarios/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
