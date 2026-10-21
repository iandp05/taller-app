import pytest
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
