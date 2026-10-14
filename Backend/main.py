# backend/main.py
import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import engine, Base, ejecutar_migraciones_sqlite
from utils.backups import ejecutar_backup_diario
from seed import sembrar_datos_completos

# ==========================================
# 1. IMPORTAR MODELOS 
# (Obligatorio para que SQLAlchemy lea las relaciones y cree las tablas)
# ==========================================
from modulos.usuarios import models as usuarios_models
from modulos.clientes import models as clientes_models
from modulos.vehiculos import models as vehiculos_models
from modulos.inventario import models as inventario_models
from modulos.ordenes import models as ordenes_models
from modulos.presupuestos import models as presupuestos_models
from modulos.factura import models as facturas_models  
from modulos.configuracion import models as configuracion_models

# ==========================================
# 2. IMPORTAR ROUTERS (Las rutas / endpoints)
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

Base.metadata.create_all(bind=engine)
ejecutar_migraciones_sqlite()
ejecutar_backup_diario()
try:
    sembrar_datos_completos()
except Exception as err:
    print("Aviso al verificar datos de inicio:", err)

app = FastAPI(
    title="API Taller Mecánico",
    description="Sistema ERP/CRM para gestión local de clientes, vehículos, stock y órdenes de trabajo.",
    version="1.0.0"
)

# ==========================================
# 3. CONFIGURACIÓN DE CORS MULTI-TENANT
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*", "X-Taller-Slug"],
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
