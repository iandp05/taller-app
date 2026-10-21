import pytest
import os
import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure Backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import Base, get_db
from main import app
from modulos.usuarios import models as user_models, services as user_services
from modulos.vehiculos import models as veh_models

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Creates all tables in the test database and seeds default data."""
    Base.metadata.create_all(bind=engine_test)
    db = TestingSessionLocal()

    # Seed default user 'luca' if not present
    existing = db.query(user_models.Usuario).filter(user_models.Usuario.username == "luca").first()
    if not existing:
        hashed_pw = user_services.get_password_hash("1234")
        test_user = user_models.Usuario(
            username="luca",
            nombre="Luca Test",
            password_hash=hashed_pw,
            rol="Admin"
        )
        db.add(test_user)

    # Seed default catalog vehicle
    existing_cat = db.query(veh_models.CatalogoVehiculo).first()
    if not existing_cat:
        cat_veh = veh_models.CatalogoVehiculo(marca="Volkswagen", modelo="Gol")
        db.add(cat_veh)

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine_test)

@pytest.fixture
def db_session():
    """Provides a transactional database session for tests."""
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    """Provides a TestClient configured with the overridden test database session."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client):
    """Logs in as default user 'luca' and returns Authorization headers with JWT token."""
    response = client.post(
        "/usuarios/login",
        json={"username": "luca", "password": "1234"}
    )
    assert response.status_code == 200, f"Login failed during test setup: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
