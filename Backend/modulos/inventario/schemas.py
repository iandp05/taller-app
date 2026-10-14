# backend/modulos/inventario/schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional

# 1. Esquema Base
class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=150, description="Nombre del repuesto o insumo")
    codigo: Optional[str] = Field(None, max_length=50, description="Código de barras o SKU")
    categoria: str = Field(..., min_length=2, max_length=50, description="Categoría del repuesto")
    precio: float = Field(..., ge=0.0, description="Precio unitario, no puede ser negativo")
    cantidad: int = Field(0, ge=0, description="Stock disponible, no puede ser negativo")
    stock_critico: int = Field(5, ge=0, description="Stock crítico de alerta, no puede ser negativo")

    @field_validator("nombre", "categoria", mode="before")
    @classmethod
    def limpiar_espacios(cls, v):
        if v and isinstance(v, str):
            return v.strip()
        return v

    @field_validator("codigo", mode="before")
    @classmethod
    def limpiar_codigo(cls, v):
        if v and isinstance(v, str):
            return v.strip().upper() # Quita espacios y fuerza mayúsculas para el escáner
        return v

# 2. Esquema para CREAR (POST)
class ProductoCreate(ProductoBase):
    pass

# 3. Esquema para ACTUALIZAR (PUT/PATCH)
class ProductoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=150)
    codigo: Optional[str] = Field(None, max_length=50)
    categoria: Optional[str] = Field(None, min_length=2, max_length=50)
    precio: Optional[float] = Field(None, ge=0.0)
    cantidad: Optional[int] = Field(None, ge=0)
    stock_critico: Optional[int] = Field(None, ge=0)

    @field_validator("nombre", "categoria", mode="before")
    @classmethod
    def limpiar_espacios_update(cls, v):
        if v is not None and isinstance(v, str):
            return v.strip()
        return v

    @field_validator("codigo", mode="before")
    @classmethod
    def limpiar_codigo_update(cls, v):
        if v is not None and isinstance(v, str):
            return v.strip().upper()
        return v

# 4. Esquema de RESPUESTA (GET)
class ProductoResponse(ProductoBase):
    id: int

    class Config:
        from_attributes = True