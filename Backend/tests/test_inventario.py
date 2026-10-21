import pytest

def test_crear_producto_inventario(client):
    producto = {
        "nombre": "Filtro de Aceite Bosch",
        "codigo": "BOSCH-1234",
        "categoria": "Filtros",
        "precio": 8500.0,
        "cantidad": 10,
        "stock_critico": 3
    }
    response = client.post("/inventario/", json=producto)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == "Filtro de Aceite Bosch"
    assert data["precio"] == 8500.0
    assert "id" in data

def test_listar_inventario(client):
    response = client.get("/inventario/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_alertas_stock_critico(client):
    # Create low stock item
    item_critico = {
        "nombre": "Bujía NGK",
        "codigo": "NGK-999",
        "categoria": "Encendido",
        "precio": 3500.0,
        "cantidad": 1,
        "stock_critico": 5
    }
    client.post("/inventario/", json=item_critico)

    response = client.get("/inventario/alertas")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(item["nombre"] == "Bujía NGK" for item in data)
