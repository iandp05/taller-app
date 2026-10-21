import pytest

def test_crear_vehiculo_y_catalogo(client):
    # 1. First create a client
    cliente_res = client.post("/clientes/", json={
        "nombre": "Carlos Gol",
        "telefono": "1144556677",
        "cuit_dni": "20112233445"
    })
    cliente_id = cliente_res.json()["id"]

    # 2. Create vehicle linked to client
    vehiculo_data = {
        "patente": "AA 123 BB",
        "marca": "Volkswagen",
        "modelo": "Gol Trend",
        "anio": 2018,
        "cliente_id": cliente_id
    }
    veh_res = client.post("/vehiculos/", json=vehiculo_data)
    assert veh_res.status_code == 201
    data = veh_res.json()
    assert data["patente"] == "AA123BB"  # Normalized without spaces
    assert data["marca"] == "Volkswagen"
    assert "id" in data

def test_listar_vehiculos(client):
    response = client.get("/vehiculos/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_obtener_catalogo_marcas_modelos(client):
    response = client.get("/vehiculos/catalogo/marcas-modelos")
    assert response.status_code == 200
    data = response.json()
    assert "Volkswagen" in data
    assert "Gol" in data["Volkswagen"]
