# backend/modulos/usuarios/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from . import schemas, services

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.post("/", response_model=schemas.UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    db_usuario = services.get_usuario_por_username(db, username=usuario.username)
    if db_usuario:
        raise HTTPException(
            status_code=400, 
            detail="El nombre de usuario ya está en uso. Elige otro."
        )
    return services.create_usuario(db=db, usuario=usuario)

@router.get("/", response_model=List[schemas.UsuarioResponse])
def leer_usuarios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_usuarios(db, skip=skip, limit=limit)

@router.get("/{usuario_id}", response_model=schemas.UsuarioResponse)
def leer_usuario(usuario_id: str, db: Session = Depends(get_db)):
    db_usuario = services.get_usuario(db, usuario_id=usuario_id)
    if db_usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return db_usuario

@router.put("/{usuario_id}", response_model=schemas.UsuarioResponse)
def actualizar_usuario(usuario_id: str, usuario_data: schemas.UsuarioUpdate, db: Session = Depends(get_db)):
    if usuario_data.username:
        db_existente = services.get_usuario_por_username(db, username=usuario_data.username)
        if db_existente and db_existente.id != usuario_id:
            raise HTTPException(status_code=400, detail="Este nombre de usuario ya le pertenece a otro empleado.")

    db_usuario = services.update_usuario(db, usuario_id=usuario_id, usuario_data=usuario_data)
    if db_usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return db_usuario

@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(usuario_id: str, db: Session = Depends(get_db)):
    try:
        db_usuario = services.delete_usuario(db, usuario_id=usuario_id)
        if db_usuario is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
    except Exception:
        raise HTTPException(
            status_code=400, 
            detail="No se puede eliminar a este empleado porque tiene historial de órdenes de trabajo asociadas."
        )

@router.put("/me/tema")
def actualizar_tema_usuario(tema_data: dict, db: Session = Depends(get_db)):
    nuevo_tema = tema_data.get("preferencia_tema", "light")
    usuario = services.get_usuario_por_username(db, "luca")
    if usuario:
        usuario.preferencia_tema = nuevo_tema
        db.commit()
    return {"preferencia_tema": nuevo_tema}

@router.post("/login", response_model=schemas.UsuarioTokenResponse)
def login_usuario(credenciales: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    usuario_limpio = credenciales.username.strip().lower()
    usuario = services.authenticate_user(db, usuario_limpio, credenciales.password)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
        
    access_token = services.create_access_token(
        data={"sub": usuario.username, "id": str(usuario.id), "rol": usuario.rol}
    )

    return {
        "id": str(usuario.id),
        "nombre": usuario.nombre,
        "username": usuario.username,
        "rol": usuario.rol,
        "preferencia_tema": usuario.preferencia_tema or "light",
        "access_token": access_token,
        "token_type": "bearer"
    }
