# backend/modulos/usuarios/schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional

class UsuarioBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre completo del usuario")
    username: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario para login")
    rol: str = Field("Mecánico", min_length=2, max_length=50, description="Rol asignado en el taller")
    preferencia_tema: Optional[str] = Field("light", description="Tema preferido (light u dark)")

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

class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6, max_length=128, description="Contraseña de acceso (mínimo 6 caracteres)")

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

class UsuarioResponse(UsuarioBase):
    id: str

    class Config:
        from_attributes = True

class UsuarioLogin(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)

class UsuarioTokenResponse(UsuarioResponse):
    access_token: str
    token_type: str = "bearer"
