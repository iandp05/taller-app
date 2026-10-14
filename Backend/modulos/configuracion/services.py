# backend/modulos/configuracion/services.py
from sqlalchemy.orm import Session
from . import models, schemas

def get_or_create_configuracion(db: Session) -> models.ConfiguracionTaller:
    config = db.query(models.ConfiguracionTaller).first()
    if not config:
        config = models.ConfiguracionTaller()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

def update_configuracion(db: Session, config_data: schemas.ConfiguracionUpdate) -> models.ConfiguracionTaller:
    config = get_or_create_configuracion(db)
    data = config_data.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(config, key, value)
    db.commit()
    db.refresh(config)
    return config
