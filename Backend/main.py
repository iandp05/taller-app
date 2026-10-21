# backend/main.py
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import sessionmaker
from database import engine, Base, get_turso_engine, ejecutar_migraciones_sqlite, ejecutar_migraciones_turso
from utils.backups import ejecutar_backup_diario
from seed import sembrar_datos_completos
from worker_sync import iniciar_worker_sync_background

# ==========================================
# 1. IMPORTAR MODELOS 
# ==========================================
from modulos.usuarios import models as usuarios_models
from modulos.clientes import models as clientes_models
from modulos.vehiculos import models as vehiculos_models
from modulos.inventario import models as inventario_models
from modulos.ordenes import models as ordenes_models
from modulos.presupuestos import models as presupuestos_models
from modulos.factura import models as facturas_models  
from modulos.configuracion import models as configuracion_models
from modulos.sync import models as sync_models

# ==========================================
# 2. IMPORTAR ROUTERS
# ==========================================
from modulos.usuarios import router as usuarios_router
from modulos.clientes import router as clientes_router
from modulos.vehiculos import router as vehiculos_router
from modulos.inventario import router as inventario_router
from modulos.ordenes import router as ordenes_router
from modulos.presupuestos import router as presupuestos_router
from modulos.factura import router as factura_router
from modulos.configuracion import router as configuracion_router
from modulos.actualizaciones import router as actualizaciones_router

from modulos.usuarios.services import get_password_hash

# ==========================================
# LIFESPAN CONTEXT MANAGER (CREACIÓN AUTOMÁTICA DDL EN AMBOS MOTORES)
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Crear tablas en SQLite local
    try:
        Base.metadata.create_all(bind=engine)
        ejecutar_migraciones_sqlite()
        ejecutar_backup_diario()
        sembrar_datos_completos()
    except Exception as err_loc:
        print("Aviso al inicializar BDD local:", err_loc)

    # 2. Crear tablas DDL obligatorias en Turso Cloud DB y verificar usuario inicial
    turso_engine = get_turso_engine()
    if turso_engine:
        try:
            Base.metadata.create_all(bind=turso_engine)
            ejecutar_migraciones_turso(turso_engine)
            temp_session = sessionmaker(autocommit=False, autoflush=False, bind=turso_engine)()
            if temp_session.query(usuarios_models.Usuario).filter(usuarios_models.Usuario.username == "luca").first() is None:
                nuevo_empleado = usuarios_models.Usuario(
                    nombre="Luca Del Pino",
                    username="luca",
                    password_hash=get_password_hash("1234"),
                    rol="Mecánico"
                )
                temp_session.add(nuevo_empleado)
                temp_session.commit()
            temp_session.close()
            print("--- ¡Estructura DDL y Usuario inicial verificados en Turso Cloud DB! ---")
        except Exception as err_tur:
            print("Aviso al inicializar BDD en Turso Cloud DB:", err_tur)

    # 3. Iniciar worker de sincronización Outbox en segundo plano
    try:
        iniciar_worker_sync_background(intervalo_segundos=7)
    except Exception as err_w:
        print("Aviso al iniciar worker de sincronización:", err_w)

    yield

app = FastAPI(
    title="API Taller Mecánico",
    description="Sistema ERP/CRM para gestión local de clientes, vehículos, stock y órdenes de trabajo.",
    version="1.0.0",
    lifespan=lifespan
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "https://taller-erp.netlify.app")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Error interno en el servidor: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "*"
        }
    )

# ==========================================
# 3. CONFIGURACIÓN DE CORS MULTI-TENANT
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://taller-erp.netlify.app",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Taller-Slug", "x-taller-slug", "Accept", "Origin"],
    expose_headers=["*"],
)

# ==========================================
# 4. CONECTAR LAS RUTAS API A LA APLICACIÓN
# ==========================================
app.include_router(usuarios_router.router)
app.include_router(clientes_router.router)
app.include_router(vehiculos_router.router)
app.include_router(inventario_router.router)
app.include_router(ordenes_router.router)
app.include_router(presupuestos_router.router)
app.include_router(factura_router.router)
app.include_router(configuracion_router.router)
app.include_router(actualizaciones_router.router)

# ==========================================
# 5. SERVIR INTERFAZ WEB SPA (Frontend React)
# ==========================================
def get_frontend_dist_dir():
    if getattr(sys, 'frozen', False):
        base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
        dist_dir = os.path.join(base_dir, "dist_frontend")
        if os.path.exists(dist_dir):
            return dist_dir
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dist_dir = os.path.join(base_dir, "Frontend", "dist")
    if os.path.exists(dist_dir):
        return dist_dir
    return None

frontend_dist = get_frontend_dist_dir()
if frontend_dist and os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if not full_path or full_path == "":
            return FileResponse(os.path.join(frontend_dist, "index.html"))

        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        return FileResponse(os.path.join(frontend_dist, "index.html"))
