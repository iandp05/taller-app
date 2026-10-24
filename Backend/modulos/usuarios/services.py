from sqlalchemy.orm import Session
import bcrypt
import os
from datetime import datetime, timedelta, timezone
from jose import jwt
from . import models, schemas

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "taller_secret_key_super_segura_jwt_production_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 Horas

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_password_hash(password: str):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def get_usuario(db: Session, usuario_id: str):
    return db.query(models.Usuario).filter(models.Usuario.id == str(usuario_id)).first()

def get_usuario_by_username(db: Session, username: str):
    return db.query(models.Usuario).filter(models.Usuario.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    usuario = get_usuario_by_username(db, username)
    if not usuario:
        return False
    pwd_bytes = password.encode('utf-8')
    hash_bytes = usuario.password_hash.encode('utf-8')
    if not bcrypt.checkpw(pwd_bytes, hash_bytes):
        return False
    return usuario

def get_usuarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Usuario).offset(skip).limit(limit).all()

def create_usuario(db: Session, usuario: schemas.UsuarioCreate):
    hashed_password = get_password_hash(usuario.password)
    db_usuario = models.Usuario(
        nombre=usuario.nombre,
        username=usuario.username,
        password_hash=hashed_password,
        rol=usuario.rol,
        preferencia_tema=usuario.preferencia_tema or "light"
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

def update_usuario(db: Session, usuario_id: str, usuario: schemas.UsuarioUpdate):
    db_usuario = get_usuario(db, usuario_id)
    if db_usuario:
        if usuario.nombre is not None:
            db_usuario.nombre = usuario.nombre
        if usuario.username is not None:
            db_usuario.username = usuario.username
        if usuario.rol is not None:
            db_usuario.rol = usuario.rol
        if usuario.password is not None:
            db_usuario.password_hash = get_password_hash(usuario.password)
        db.commit()
        db.refresh(db_usuario)
    return db_usuario

def delete_usuario(db: Session, usuario_id: str):
    db_usuario = get_usuario(db, usuario_id)
    if db_usuario:
        db.delete(db_usuario)
        db.commit()
    return db_usuario
