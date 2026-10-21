# Backend/seed.py
from database import SesionLocal, engine, Base

from modulos.vehiculos.models import CatalogoVehiculo, Vehiculo
from modulos.clientes.models import Cliente
from modulos.ordenes.models import OrdenTrabajo
from modulos.inventario.models import Producto
from modulos.usuarios.models import Usuario
from modulos.usuarios.services import get_password_hash

# Catálogo ampliado de marcas y modelos frecuentes
catalogo_vehiculos = {
    "IKA / Rastrojero": [
        "Rastrojero Diesel", "Rastrojero Frontal", "Estanciera", "Baqueano", "Carabela", "Jeep IKA"
    ],
    "Torino": [
        "Torino 300", "Torino 380", "Torino GS", "Torino Grand Routier", "Torino Comahue"
    ],
    "Dodge / Chrysler (Arg)": [
        "Dodge 1500", "Dodge GTX", "Dodge Polara", "Dodge Coronado", "Dodge D-100", "Coronado", "Valiant"
    ],
    "Renault": [
        "R 4", "R 5", "R 6", "R 8", "R 9", "R 10", "R 11", "R 12", "R 14", "R 18", "R 19",
        "R 20", "R 21", "Fuego", "Estafette", "Express", "Trafic", "Twingo",
        "Clio", "Clio II", "Clio Mio", "Clio III", "Clio IV",
        "Megane", "Megane II", "Megane III", "Megane IV",
        "Sandero", "Sandero Stepway", "Stepway", "Logan",
        "Symbol", "Fluence", "Latitude", "Laguna", "Safrane", "Scenic",
        "Grand Scenic", "Kangoo", "Kangoo Express",
        "Duster", "Duster Oroch", "Oroch", "Captur",
        "Koleos", "Kadjar", "Arkana", "Austral", "Espace",
        "Alaskan", "Master", "Master Minibus", "Twizy",
        "Zoe", "Megane E-Tech", "Kwid", "Kwid E-Tech",
        "Taliant", "Kiger", "Triber"
    ],
    "Fiat": [
        "600", "1100", "1500", "1600", "125", "125 Sport", "128", "128 IAVA", "133", "147", "Spazio", "Vivace",
        "Duna", "Uno", "Uno Fire", "Uno Way", "Palio", "Palio Weekend",
        "Siena", "Siena EL", "Regata", "Regatta", "Tempra", "Tipo",
        "Marea", "Marea Weekend", "Bravo", "Brava", "Stilo", "Punto", "Linea",
        "Grand Siena", "Argo", "Cronos", "Mobi", "Panda", "500", "500X", "500L",
        "Fiorino", "Strada", "Toro", "Ducato", "Fastback", "Pulse", "Titano"
    ],
    "Volkswagen": [
        "Escarabajo", "Kombi", "G Gol", "Gol Trend", "Gol Power", "GTI", "Pointer", "Senda", "Gacel",
        "Quantum", "Carat", "Santana", "Polo", "Polo Classic", "Polo Track",
        "Fox", "CrossFox", "Suran", "Suran Cross", "Voyage", "Bora", "Golf",
        "Golf Variant", "Vento", "Passat", "Passat CC", "CC", "Scirocco",
        "Virtus", "Nivus", "T-Cross", "Taos", "Tiguan", "Tiguan Allspace",
        "Touareg", "Amarok", "Saveiro", "Up!", "ID.3", "ID.4", "ID.Buzz"
    ],
    "Ford": [
        "Falcon", "Fairlane", "Taunus", "Sierra", "Sierra XR4", "Escort", "Escort XR3",
        "Orion", "Fiesta", "Fiesta Max", "Fiesta Kinetic", "Focus", "Focus III",
        "Mondeo", "Ka", "Ka+", "Ecosport", "Kuga", "Territory", "Bronco", "Bronco Sport",
        "Explorer", "Edge", "Everest", "Maverick", "Ranger", "Ranger Raptor",
        "F-100", "F-150", "F-150 Raptor", "F-250", "F-350", "Transit", "Mustang", "Mustang Mach-E"
    ],
    "Chevrolet": [
        "400", "Chevy", "Chevy SS", "Chevette", "Monza", "Opala", "Kadett", "Ipanema",
        "Corsa", "Corsa Classic", "Classic", "Corsa II", "Astra", "Vectra", "Celta", "Prisma",
        "Agile", "Montana", "Onix", "Onix Plus", "Prisma II", "Sonic", "Cruze", "Malibu",
        "Omega", "Suprema", "Meriva", "Zafira", "Spin", "Captiva", "Tracker", "Equinox",
        "Blazer", "Trailblazer", "Grand Blazer", "Silverado", "S10", "D-20", "Express", "Camaro"
    ],
    "Peugeot": [
        "403", "404", "504", "505", "205", "205 GTI", "106", "306", "405", "406", "605", "607",
        "206", "207", "207 Compact", "208", "208 II", "307", "308", "407", "408", "508",
        "1007", "2008", "3008", "5008", "Partner", "Partner Patagónica", "Expert", "Boxer", "Rifter", "Landtrek"
    ],
    "Citroën": [
        "2CV", "3CV", "Mehari", "Ami 8", "CX", "BX", "AX", "ZX", "Xantia", "XM",
        "Saxo", "Xsara", "Xsara Picasso", "C3", "C3 Aircross", "C3 Picasso", "C4",
        "C4 Lounge", "C4 Cactus", "C4 Picasso", "Grand C4 Picasso", "C5", "C5 Aircross",
        "C6", "Berlingo", "Jumpy", "Jumper", "DS3", "DS4", "DS5"
    ],
    "Toyota": [
        "Corolla", "Corolla Cross", "Corolla Fielder", "Corona", "Camry", "Celica", "Supra",
        "Yaris", "Etios", "Prius", "C-HR", "RAV4", "Land Cruiser", "Land Cruiser Prado",
        "SW4", "Hilux", "Hilux GR-Sport", "Hiace", "Coaster", "86", "GR Yaris", "GR86"
    ],
    "Nissan": [
        "Sentra", "Tiida", "Versa", "Note", "March", "Kicks", "Qashqai", "X-Trail",
        "Murano", "Pathfinder", "Patrol", "Frontier", "Navara", "NP300", "Terrano",
        "350Z", "370Z", "GT-R", "Leaf"
    ],
    "Honda": [
        "Civic", "Civic Si", "Accord", "Fit", "City", "HR-V", "WR-V", "CR-V",
        "ZR-V", "Pilot", "Passport", "Odyssey", "Legend", "NSX"
    ],
    "Hyundai": [
        "Atos", "i10", "Grand i10", "i30", "Elantra", "Sonata", "Genesis", "Veloster",
        "Tucson", "Santa Fe", "Veracruz", "Creta", "Kona", "Palisade", "H-1", "HR", "Porter"
    ],
    "Kia": [
        "Picanto", "Rio", "Cerato", "Optima", "Stinger", "Soul", "Seltos", "Sportage",
        "Sorento", "Mohave", "Carnival", "K2500", "K2700"
    ],
    "Volkswagen Commercial / Pesados": [
        "Worker", "Delivery", "Constellation", "Volksbus"
    ],
    "Mercedes-Benz": [
        "Clase A", "Clase B", "Clase C", "Clase E", "Clase S", "CLA", "CLS",
        "GLA", "GLB", "GLC", "GLE", "GLS", "Clase G", "Clase X",
        "180", "190", "220", "230", "280", "300", "500",
        "Vito", "Sprinter", "Accelo", "Atego", "Axor", "Actros", "1114", "1620", "1634"
    ],
    "BMW": [
        "Serie 1", "Serie 2", "Serie 3", "Serie 4", "Serie 5", "Serie 6", "Serie 7", "Serie 8",
        "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z3", "Z4", "M2", "M3", "M4", "M5"
    ],
    "Audi": [
        "A1", "A3", "A4", "A5", "A6", "A7", "A8",
        "Q2", "Q3", "Q5", "Q7", "Q8", "TT", "R8", "e-tron"
    ]
}

def sembrar_datos_completos(session=None, bind_engine=None):
    target_engine = bind_engine or engine
    Base.metadata.create_all(bind=target_engine)
    db = session or SesionLocal()
    
    try:
        # Use fast bulk_save_objects to insert catalog in a single batch
        if db.query(CatalogoVehiculo).count() == 0:
            catalog_objects = [
                CatalogoVehiculo(marca=marca, modelo=modelo)
                for marca, modelos in catalogo_vehiculos.items()
                for modelo in modelos
            ]
            db.bulk_save_objects(catalog_objects)
            db.commit()

        if db.query(Usuario).filter(Usuario.username == "luca").first() is None:
            nuevo_empleado = Usuario(
                nombre="Luca Del Pino",
                username="luca",
                password_hash=get_password_hash("1234"),
                rol="Mecánico"
            )
            db.add(nuevo_empleado)
            db.commit()

        print("--- ¡Base de Datos iniciada y lista para usarse! ---")

    except Exception as e:
        db.rollback()
        print(f"Aviso durante la siembra de datos: {e}")
    finally:
        if not session:
            db.close()

if __name__ == "__main__":
    sembrar_datos_completos()
