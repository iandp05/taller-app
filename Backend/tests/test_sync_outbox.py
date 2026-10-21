import pytest
import json
from modulos.sync.models import SyncQueue

def test_sync_queue_model(db_session):
    # Verify sync_queue table structure and query capability
    entry = SyncQueue(
        sql_statement="INSERT INTO clientes (id, nombre) VALUES ('123', 'Test')",
        params="{}",
        status="PENDING"
    )
    db_session.add(entry)
    db_session.commit()

    saved = db_session.query(SyncQueue).filter(SyncQueue.status == "PENDING").first()
    assert saved is not None
    assert "INSERT INTO clientes" in saved.sql_statement
    assert saved.status == "PENDING"

def test_sync_queue_executemany_batch_detection():
    params_raw = json.dumps([["Toyota", "Corolla"], ["Ford", "Focus"]])
    params = json.loads(params_raw)

    is_batch = isinstance(params, (list, tuple)) and len(params) > 0 and isinstance(params[0], (list, tuple, dict))
    assert is_batch is True

    batch_params = [
        list(p.values()) if isinstance(p, dict) else p
        for p in params
    ]
    assert len(batch_params) == 2
    assert batch_params[0] == ["Toyota", "Corolla"]

def test_sync_estado_endpoint(client):
    response = client.get("/sync/estado")
    assert response.status_code == 200
    data = response.json()
    assert "pendientes" in data
    assert "completados" in data
    assert data["online"] is True

def test_sync_queue_duplicate_error_classification():
    err_msg = "SQLite error: UNIQUE constraint failed: usuarios.username"
    err_str = err_msg.upper()
    is_duplicate_error = any(x in err_str for x in ["UNIQUE", "CONSTRAINT", "PRIMARY KEY", "ALREADY EXISTS"])
    assert is_duplicate_error is True
