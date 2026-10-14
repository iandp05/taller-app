from sqlalchemy.orm import Session
import bcrypt
import os
from datetime import datetime, timedelta
from jose import jwt
from . import models, schemas

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "taller_secret_key_super_segura_jwt_production_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 Horas

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_password_hash(password: str):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def get_usuario(db: Session, usuario_id: int):
    return db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()

def get_usuario_por_username(db: Session, username: str):
    return db.query(models.Usuario).filter(models.Usuario.username == username).first()

def get_usuarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Usuario).offset(skip).limit(limit).all()

def create_usuario(db: Session, usuario: schemas.UsuarioCreate):
    hashed_password = get_password_hash(usuario.password)
    db_usuario = models.Usuario(
        nombre=usuario.nombre,
        username=usuario.username,
        rol=usuario.rol,
        password_hash=hashed_password
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

def update_usuario(db: Session, usuario_id: int, usuario_data: schemas.UsuarioUpdate):
    db_usuario = get_usuario(db, usuario_id)
    if db_usuario:
        if usuario_data.password:
            db_usuario.password_hash = get_password_hash(usuario_data.password)
        if usuario_data.nombre:
            db_usuario.nombre = usuario_data.nombre
        if usuario_data.username:
            db_usuario.username = usuario_data.username
        if usuario_data.rol:
            db_usuario.rol = usuario_data.rol
        db.commit()
        db.refresh(db_usuario)
    return db_usuario

def delete_usuario(db: Session, usuario_id: int):
    db_usuario = get_usuario(db, usuario_id)
    if db_usuario:
        db.delete(db_usuario)
        db.commit()
    return db_usuario

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def authenticate_user(db: Session, username: str, password: str):
    usuario = get_usuario_por_username(db, username)
    if not usuario:
        return False
    if not verify_password(password, usuario.password_hash):
        return False
    return usuario
