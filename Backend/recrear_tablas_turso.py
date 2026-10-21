# backend/recrear_tablas_turso.py
import database
from database import Base, get_turso_engine
from seed import sembrar_datos_completos

print("1. Conectando a Turso Cloud DB para recrear todas las tablas con updated_at y UUIDv4...")
engine_turso = get_turso_engine()

if engine_turso:
    try:
        print("Eliminando esquema viejo en Turso DB...")
        Base.metadata.drop_all(bind=engine_turso)
    except Exception as e_drop:
        print("Aviso al borrar tablas viejas:", e_drop)

    print("Creando esquema nuevo con todas las columnas updated_at y UUIDv4...")
    Base.metadata.create_all(bind=engine_turso)

    print("Sembrando usuario 'luca' (1234) y datos iniciales en Turso DB...")
    temp_session = database.sessionmaker(autocommit=False, autoflush=False, bind=engine_turso)()
    sembrar_datos_completos(session=temp_session, bind_engine=engine_turso)
    temp_session.close()

    print("--- ¡TODAS LAS TABLAS HAN SIDO RECREADAS EN TURSO CLOUD DB CON ÉXITO! ---")
else:
    print("Error: No se pudo obtener el engine de Turso Cloud DB. Verifica el archivo .env")
