import pytest

def test_crear_y_actualizar_presupuesto(client):
    # 1. Create client
    cli_res = client.post("/clientes/", json={
        "nombre": "Pedro Presupuestos",
        "telefono": "1155667788",
        "cuit_dni": "20556677889"
    })
    cli_id = cli_res.json()["id"]

    # 2. Create vehicle
    veh_res = client.post("/vehiculos/", json={
        "patente": "PRE 123",
        "marca": "Toyota",
        "modelo": "Corolla",
        "anio": 2021,
        "cliente_id": cli_id
    })
    veh_id = veh_res.json()["id"]

    # 3. Create presupuesto
    presupuesto_data = {
        "vehiculo_id": veh_id,
        "cliente_id": cli_id,
        "estado": "Emitido",
        "validez_dias": "15 días",
        "condiciones_pago": "Contado",
        "detalles": [
            {
                "descripcion": "Alineación y balanceo",
                "cantidad": 1,
                "precio_unitario": 25000.0
            }
        ]
    }
    res = client.post("/presupuestos/", json=presupuesto_data)
    assert res.status_code == 201
    p_data = res.json()
    assert p_data["total"] == 25000.0
    p_id = p_data["id"]

    # 4. Update presupuesto using PresupuestoUpdate
    upd_res = client.put(f"/presupuestos/{p_id}", json={
        "estado": "Aprobado"
    })
    assert upd_res.status_code == 200
    assert upd_res.json()["estado"] == "Aprobado"
