# backend/modulos/pdf/router.py
import os
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.paths import APP_PATHS

router = APIRouter(prefix="/pdf", tags=["Gestión de Archivos PDF"])

class PDFGuardarRequest(BaseModel):
    subcarpeta: str  # "Facturas", "Presupuestos", "Ordenes"
    nombre_archivo: str  # ej. "Factura_B_101_Juan_Perez.pdf"
    contenido_base64: str

@router.post("/guardar_local")
def guardar_pdf_localmente(payload: PDFGuardarRequest):
    """
    Recibe un documento PDF codificado en Base64 y lo guarda automáticamente
    en la carpeta del Escritorio del usuario (Desktop/TallerERP_Datos/PDFs/...).
    """
    try:
        sub = payload.subcarpeta.lower()
        if "factura" in sub:
            target_dir = APP_PATHS["pdf_facturas"]
        elif "presupuesto" in sub:
            target_dir = APP_PATHS["pdf_presupuestos"]
        else:
            target_dir = APP_PATHS["pdf_ordenes"]

        os.makedirs(target_dir, exist_ok=True)

        # Limpieza del nombre de archivo para evitar caracteres inválidos
        nombre_limpio = "".join(c for c in payload.nombre_archivo if c.isalnum() or c in ("_", "-", ".", " "))
        if not nombre_limpio.endswith(".pdf"):
            nombre_limpio += ".pdf"

        file_path = os.path.join(target_dir, nombre_limpio)

        # Decodificación Base64 y guardado directo en disco
        pdf_bytes = base64.b64decode(payload.contenido_base64)
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)

        return {
            "guardado": True,
            "ruta": file_path,
            "mensaje": f"PDF guardado correctamente en: {file_path}"
        }

    except Exception as e:
        print("Error guardando PDF localmente:", e)
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo guardar el PDF localmente: {str(e)}"
        )
