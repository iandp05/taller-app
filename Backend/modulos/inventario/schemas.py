# backend/modulos/inventario/schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional

class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=150, description="Nombre o descripción del repuesto")
    codigo: Optional[str] = Field(None, max_length=50, description="Código de barras o referencia")
    categoria: str = Field("Repuestos", min_length=2, max_length=50)
    precio: float = Field(..., ge=0.0, description="Precio de venta unitario")
    cantidad: int = Field(..., ge=0, description="Stock disponible")
    stock_critico: int = Field(2, ge=0, description="Alerta de stock mínimo")

    @field_validator("nombre", "categoria", mode="before")
    @classmethod
    def limpiar_textos(cls, v):
        if v is not None and isinstance(v, str):
            return v.strip()
        return v

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=150)
    codigo: Optional[str] = Field(None, max_length=50)
    categoria: Optional[str] = Field(None, min_length=2, max_length=50)
    precio: Optional[float] = Field(None, ge=0.0)
    cantidad: Optional[int] = Field(None, ge=0)
    stock_critico: Optional[int] = Field(None, ge=0)

    @field_validator("nombre", "categoria", mode="before")
    @classmethod
    def limpiar_textos_update(cls, v):
        if v is not None and isinstance(v, str):
            return v.strip()
        return v

class ProductoResponse(ProductoBase):
    id: str

    class Config:
        from_attributes = True
