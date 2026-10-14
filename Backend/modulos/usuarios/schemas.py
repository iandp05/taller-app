# backend/modulos/usuarios/schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional

# 1. Esquema Base
class UsuarioBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre completo del usuario")
    username: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario para login")
    rol: str = Field("Mecánico", min_length=2, max_length=50, description="Rol asignado en el taller")

    @field_validator("nombre", "rol", mode="before")
    @classmethod
    def limpiar_textos(cls, v):
        if v is not None and isinstance(v, str):
            return v.strip()
        return v

    @field_validator("username", mode="before")
    @classmethod
    def limpiar_username(cls, v):
        if v is not None and isinstance(v, str):
            return v.strip().lower()
        return v

# 2. Esquema para CREAR (POST)
class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6, max_length=128, description="Contraseña de acceso (mínimo 6 caracteres)")

# 3. Esquema para ACTUALIZAR (PUT/PATCH)
class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    rol: Optional[str] = Field(None, min_length=2, max_length=50)
    password: Optional[str] = Field(None, min_length=6, max_length=128)

    @field_validator("nombre", "rol", mode="before")
    @classmethod
    def limpiar_textos_update(cls, v):
        if v is not None and isinstance(v, str):
            return v.strip()
        return v

    @field_validator("username", mode="before")
    @classmethod
    def limpiar_username_update(cls, v):
        if v is not None and isinstance(v, str):
            return v.strip().lower()
        return v

# 4. Esquema de RESPUESTA (GET)
class UsuarioResponse(UsuarioBase):
    id: int

    class Config:
        from_attributes = True

# 5. Esquema de LOGIN
class UsuarioLogin(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)

# 6. Esquema de RESPUESTA DE LOGIN CON TOKEN JWT
class UsuarioTokenResponse(UsuarioResponse):
    access_token: str
    token_type: str = "bearer"
