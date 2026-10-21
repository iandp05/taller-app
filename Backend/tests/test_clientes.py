import pytest

def test_crear_cliente(client):
    nuevo_cliente = {
        "nombre": "Juan Perez",
        "telefono": "1122334455",
        "email": "juan@perez.com",
        "cuit_dni": "20334445559",
        "direccion": "Av. Corrientes 1234",
        "tipo_cliente": "Particular"
    }
    response = client.post("/clientes/", json=nuevo_cliente)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == "Juan Perez"
    assert "id" in data
    assert isinstance(data["id"], str)

def test_listar_clientes(client):
    # Ensure at least one client exists
    client.post("/clientes/", json={
        "nombre": "Cliente Listado",
        "telefono": "1100000000",
        "cuit_dni": "20123456789"
    })
    response = client.get("/clientes/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_actualizar_cliente(client):
    # Create client
    crear_res = client.post("/clientes/", json={
        "nombre": "Maria Lopez",
        "telefono": "1199887766",
        "email": "maria@lopez.com",
        "cuit_dni": "27338889991",
        "direccion": "Calle Falsa 123",
        "tipo_cliente": "Particular"
    })
    cliente_id = crear_res.json()["id"]

    # Update client
    update_res = client.put(f"/clientes/{cliente_id}", json={
        "nombre": "Maria Lopez Actualizada",
        "telefono": "1199887700"
    })
    assert update_res.status_code == 200
    assert update_res.json()["nombre"] == "Maria Lopez Actualizada"

def test_eliminar_cliente(client):
    # Create client
    crear_res = client.post("/clientes/", json={
        "nombre": "Cliente a Borrar",
        "telefono": "000000",
        "cuit_dni": "20000000000"
    })
    cliente_id = crear_res.json()["id"]

    # Delete
    del_res = client.delete(f"/clientes/{cliente_id}")
    assert del_res.status_code == 204

    # Verify deleted
    get_res = client.get(f"/clientes/{cliente_id}")
    assert get_res.status_code == 404
