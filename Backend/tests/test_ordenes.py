import pytest

def test_crear_orden_trabajo(client):
    # 1. Create client
    cli_res = client.post("/clientes/", json={
        "nombre": "Ana Ramos",
        "telefono": "1133221100",
        "cuit_dni": "27889990001"
    })
    cli_id = cli_res.json()["id"]

    # 2. Create vehicle
    veh_res = client.post("/vehiculos/", json={
        "patente": "AB 987 CD",
        "marca": "Ford",
        "modelo": "Fiesta",
        "anio": 2019,
        "cliente_id": cli_id
    })
    veh_id = veh_res.json()["id"]

    # 3. Create product
    prod_res = client.post("/inventario/", json={
        "nombre": "Aceite Sintético 5W30",
        "codigo": "SHELL-5W30",
        "categoria": "Lubricantes",
        "precio": 15000.0,
        "cantidad": 20,
        "stock_critico": 2
    })
    prod_id = prod_res.json()["id"]

    # 4. Create Work Order
    orden_data = {
        "vehiculo_id": veh_id,
        "descripcion_falla": "Cambio de aceite y filtro",
        "estado": "En Proceso",
        "costo_mano_obra": 12000.0,
        "kilometros": 45000,
        "detalles": [
            {"producto_id": prod_id, "cantidad": 1}
        ]
    }
    orden_res = client.post("/ordenes/", json=orden_data)
    assert orden_res.status_code == 201
    data = orden_res.json()
    assert data["descripcion_falla"] == "Cambio de aceite y filtro"
    assert data["total"] == 27000.0  # 15000 + 12000

def test_listar_ordenes(client):
    response = client.get("/ordenes/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
