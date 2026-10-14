# Backend/seed_completo.py
from database import SesionLocal, engine, Base

from modulos.vehiculos.models import CatalogoVehiculo, Vehiculo
from modulos.clientes.models import Cliente
from modulos.ordenes.models import OrdenTrabajo
from modulos.inventario.models import Producto
from modulos.usuarios.models import Usuario
from modulos.usuarios.services import get_password_hash

# 1. Catálogo ampliado de marcas y modelos frecuentes
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
        "Brava", "Bravo", "Marea", "Marea Weekend",
        "Idea", "Punto", "Punto Evo", "Linea",
        "500", "500L", "500X", "500e",
        "Cronos", "Argo", "Mobi", "Toro", "Strada",
        "Pulse", "Fastback", "Fiorino", "Qubo",
        "Ducato", "Scudo", "Doblo", "Doblo Cargo",
        "Multipla", "Coupé", "Barchetta",
        "Palio Adventure", "Siena Adventure",
        "Toro Ultra", "Titano"
    ],

    "Ford": [
        "Falcon", "Falcon Sprint", "Ranchero", "Taunus", "Fairlane", "Sierra", "Orion",
        "Escort", "Escort XR3", "Escort RS", "Galaxy",
        "Fiesta", "Fiesta Kinetic", "Fiesta ST",
        "Focus", "Focus ST", "Focus RS",
        "Ka", "Ka+", "Ka Freestyle",
        "EcoSport", "EcoSport Storm",
        "Mondeo", "Fusion", "Kuga",
        "Territory", "Maverick", "Bronco", "Bronco Sport",
        "Ranger", "Ranger Raptor", "Ranger Wildtrak",
        "F-100", "F-100 Perkins", "F-150", "F-150 Raptor", "F-250",
        "F-350", "F-450", "F-550",
        "Explorer", "Expedition", "Everest",
        "Edge", "Escape",
        "Transit", "Transit Custom", "Transit Connect",
        "Tourneo", "Tourneo Custom",
        "Courier", "Ranger XL", "Ranger XLS", "Ranger XLT"
    ],

    "Volkswagen": [
        "Escarabajo", "Combi", "Kombi", "Karmann Ghia",
        "1500", "Gacel", "Senda", "Carat", "Quantum",
        "Gol", "Gol GL", "Gol GTI", "Gol Power", "Gol Trend",
        "Saveiro", "Saveiro Cross", "Pointer",
        "Fox", "CrossFox", "Suran",
        "Up!", "Up! GTI",
        "Polo", "Polo Classic", "Polo Sedan", "Polo GTS",
        "Virtus", "Vento", "Bora",
        "Golf", "Golf GTI", "Golf R", "Golf Variant",
        "Passat", "Passat Variant", "CC", "Arteon",
        "Jetta", "New Beetle", "Beetle",
        "T-Cross", "Taos", "Nivus", "Tiguan",
        "Tiguan Allspace", "Touareg", "Teramont",
        "Amarok", "Amarok V6",
        "Transporter", "Multivan", "Caravelle",
        "Caddy", "Crafter",
        "ID.3", "ID.4", "ID.5", "ID.7"
    ],

    "Chevrolet": [
        "400", "400 Super", "Chevy", "Chevy Serie 2", "Chevette", "C-10", "C-20",
        "C-14", "C-15", "Silverado",
        "Kadett", "Monza", "Corsa", "Corsa Classic", "Classic",
        "Astra", "Vectra", "Zafira", "Meriva",
        "Agile", "Prisma", "Celta",
        "Aveo", "Cruze", "Cruze Hatchback",
        "Onix", "Onix Plus",
        "Spin", "Montana", "S10", "S10 High Country",
        "Tracker", "Tracker RS", "Captiva",
        "Equinox", "Trailblazer", "Blazer",
        "Tahoe", "Suburban",
        "Camaro", "Corvette",
        "Spark", "Sonic", "Malibu",
        "Impala", "Cavalier"
    ],

    "Peugeot": [
        "203", "403", "404", "404 Grand Luxe", "504", "504 TN", "505",
        "205", "205 GTI", "309",
        "306", "306 S16", "405", "405 Mi16",
        "406", "406 Coupé", "407",
        "206", "206 RC", "207", "207 Compact",
        "208", "208 GT",
        "307", "307 SW", "308", "308 GT",
        "408", "508",
        "2008", "3008", "5008",
        "Partner", "Partner Patagónica",
        "Expert", "Boxer",
        "RCZ", "607", "807",
        "Traveller", "Rifter"
    ],

    "Citroën": [
        "2CV", "3CV", "Ami 8", "Mehari",
        "Visa", "AX", "BX", "ZX",
        "Xsara", "Xsara Picasso",
        "C3", "C3 Picasso", "C3 Aircross",
        "C4", "C4 Picasso", "C4 Grand Picasso",
        "C4 Lounge", "C4 Cactus", "C4 X",
        "C5", "C5 Aircross",
        "C6", "C8",
        "Berlingo", "Berlingo Multispace",
        "Jumper", "Jumpy",
        "SpaceTourer",
        "DS3", "DS4", "DS5"
    ],

    "Toyota": [
        "Hilux", "Hilux SW4", "SW4",
        "Corolla", "Corolla Cross", "Corolla Hybrid",
        "Yaris", "Yaris Hatchback", "Yaris Sedan",
        "Etios", "Etios Hatchback", "Etios Sedan",
        "Camry", "Camry Hybrid",
        "RAV4", "RAV4 Hybrid",
        "Land Cruiser", "Land Cruiser Prado",
        "Land Cruiser 70", "Land Cruiser 100", "Land Cruiser 200",
        "Land Cruiser 300",
        "Prius", "Prius C", "Prius Prime",
        "C-HR", "C-HR Hybrid",
        "Rush",
        "Hiace", "Hiace Commuter",
        "Tacoma", "Tundra", "4Runner",
        "Fortuner", "Innova",
        "Celica", "Supra", "GR Supra",
        "MR2", "MR-S",
        "Corona", "Carina", "Starlet",
        "Avalon", "Avensis",
        "Auris", "Verso",
        "Aygo", "Vitz"
    ],

    "Nissan": [
        "Frontier", "Navara",
        "Kicks", "Kicks e-Power",
        "Versa", "Sentra", "March",
        "Tiida", "Tiida Sedan",
        "X-Trail", "X-Trail Hybrid",
        "Murano", "Pathfinder",
        "Patrol", "Patrol Y60", "Patrol Y61", "Patrol Y62",
        "Terrano", "Terrano II",
        "Qashqai", "Juke",
        "Note", "Cube",
        "370Z", "350Z", "300ZX", "240Z",
        "Leaf",
        "Altima", "Maxima",
        "Primera", "Bluebird",
        "NV200", "NV350",
        "Urvan"
    ],

    "Honda": [
        "Civic", "Civic Si", "Civic Type R",
        "Civic Hatchback", "Civic Hybrid",
        "City", "City Hatchback",
        "Fit", "Jazz",
        "HR-V", "HR-V Hybrid",
        "CR-V", "CR-V Hybrid",
        "ZR-V",
        "BR-V", "Pilot",
        "Passport",
        "Accord", "Accord Hybrid",
        "Prelude",
        "Integra", "Integra Type R",
        "S2000",
        "NSX",
        "Legend",
        "Odyssey",
        "Stream",
        "Element"
    ],

    "Jeep": [
        "Willys", "CJ-3", "CJ-5", "CJ-7",
        "Cherokee", "Grand Cherokee",
        "Wrangler", "Wrangler Rubicon",
        "Renegade", "Compass", "Commander",
        "Gladiator",
        "Patriot", "Liberty",
        "Wagoneer", "Grand Wagoneer"
    ],

    "RAM": [
        "1500", "1500 Classic", "1500 Rebel",
        "1500 TRX", "1500 Laramie",
        "2500", "2500 Power Wagon",
        "3500", "4500", "5500",
        "Rampage",
        "ProMaster",
        "Dakota"
    ],

    "Hyundai": [
        "Atos", "i10", "i20", "i30",
        "Accent", "Elantra", "Sonata",
        "Veloster", "Veloster N",
        "HB20", "HB20S", "HB20X",
        "Creta", "Creta Grand",
        "Tucson", "Tucson Hybrid",
        "Santa Fe", "Santa Fe Hybrid",
        "Kona", "Kona Electric",
        "Palisade",
        "Terracan", "Galloper",
        "H-1", "Staria",
        "ix35", "ix55",
        "Genesis", "Coupe",
        "Ioniq", "Ioniq 5", "Ioniq 6",
        "Nexo"
    ],

    "Kia": [
        "Picanto", "Morning",
        "Rio", "Rio Sedan", "Rio Hatchback",
        "Cerato", "Forte",
        "Optima", "K5",
        "Sportage", "Sportage Hybrid",
        "Seltos",
        "Sorento", "Sorento Hybrid",
        "Carnival",
        "Besta",
        "Soul", "Soul EV",
        "Stonic",
        "Niro", "Niro Hybrid",
        "EV6", "EV9",
        "Mohave", "Telluride"
    ],

    "Chery": [
        "QQ", "QQ3", "QQ6",
        "Face", "Skin",
        "Fulwin", "Fulwin 2",
        "Tiggo", "Tiggo 2", "Tiggo 2 Pro",
        "Tiggo 3", "Tiggo 4", "Tiggo 4 Pro",
        "Tiggo 5", "Tiggo 7", "Tiggo 7 Pro",
        "Tiggo 8", "Tiggo 8 Pro",
        "Arrizo 3", "Arrizo 5", "Arrizo 6",
        "Arrizo 8"
    ],

    "Alfa Romeo": [
        "33", "75", "90",
        "145", "146", "147",
        "155", "156", "156 GTA",
        "159", "164", "166",
        "MiTo", "Giulietta",
        "Giulia", "Giulia Quadrifoglio",
        "Stelvio", "Stelvio Quadrifoglio",
        "Brera", "Spider",
        "4C", "4C Spider",
        "Tonale"
    ],

    "Audi": [
        "50", "80", "90", "100", "200",
        "A1", "A1 Sportback",
        "A3", "A3 Sedan", "A3 Sportback",
        "A4", "A4 Avant",
        "A5", "A5 Sportback", "A5 Coupé",
        "A6", "A6 Avant",
        "A7", "A8",
        "Q2", "Q3", "Q3 Sportback",
        "Q4 e-tron",
        "Q5", "Q5 Sportback",
        "Q7", "Q8",
        "TT", "TT RS",
        "R8",
        "RS3", "RS4", "RS5", "RS6", "RS7",
        "S3", "S4", "S5", "S6", "S7",
        "e-tron", "e-tron GT"
    ],

    "BMW": [
        "Serie 1", "Serie 2", "Serie 2 Gran Coupé",
        "Serie 3", "Serie 3 Touring",
        "Serie 4", "Serie 4 Gran Coupé",
        "Serie 5", "Serie 5 Touring",
        "Serie 6", "Serie 6 Gran Turismo",
        "Serie 7", "Serie 8",
        "X1", "X2", "X3", "X4",
        "X5", "X6", "X7",
        "XM",
        "Z3", "Z4", "Z8",
        "i3", "i4", "i5", "i7",
        "iX", "iX1", "iX3",
        "M2", "M3", "M4", "M5", "M8",
        "X3 M", "X4 M", "X5 M", "X6 M"
    ],

    "Mercedes-Benz": [
        "Clase A", "Clase B", "Clase C", "Clase E", "Clase S",
        "Clase CLA", "Clase CLS", "Clase CLK",
        "Clase SLK", "Clase SL",
        "Clase G", "Clase GLC", "Clase GLE", "Clase GLS",
        "GLA", "GLB",
        "EQA", "EQB", "EQC", "EQE", "EQS",
        "Sprinter", "Sprinter Chasis",
        "Vito", "Viano", "Clase V",
        "1114", "1518", "1620", "1720",
        "Actros", "Atego",
        "AMG GT", "AMG GT 4-Door",
        "SLS AMG"
    ],

    "Volvo": [
        "240", "340", "440", "460", "480",
        "740", "760", "780",
        "850", "940", "960",
        "S40", "S60", "S70", "S80", "S90",
        "V40", "V50", "V60", "V70", "V90",
        "C30", "C40", "C70",
        "XC40", "XC40 Recharge",
        "XC60", "XC60 Recharge",
        "XC70", "XC90",
        "EX30", "EX40", "EX90"
    ],

    "Subaru": [
        "Impreza", "Impreza WRX", "WRX",
        "WRX STI", "Legacy",
        "Forester", "Outback",
        "XV", "Crosstrek",
        "Tribeca", "BRZ",
        "SVX", "Justy",
        "Levorg"
    ],

    "Mitsubishi": [
        "Lancer", "Lancer Evolution",
        "Galant", "Colt",
        "Eclipse", "Eclipse Cross",
        "ASX", "Outlander",
        "Outlander Sport",
        "Montero", "Montero Sport",
        "Pajero", "Pajero Sport",
        "L200", "Triton",
        "Canter",
        "Space Wagon"
    ],

    "Suzuki": [
        "Swift", "Swift Sport",
        "Baleno", "Celerio",
        "Alto", "Wagon R",
        "Ignis",
        "Vitara", "Grand Vitara",
        "Jimny", "Jimny Sierra",
        "S-Cross",
        "SX4",
        "Samurai",
        "Carry"
    ],

    "Mazda": [
        "Mazda 2", "Mazda 3", "Mazda 5", "Mazda 6",
        "323", "626",
        "MX-3", "MX-5 Miata", "MX-6",
        "RX-7", "RX-8",
        "CX-3", "CX-30", "CX-5",
        "CX-7", "CX-9", "CX-50", "CX-60", "CX-90",
        "BT-50"
    ],

    "Isuzu": [
        "D-Max", "Trooper", "Rodeo",
        "MU-X", "Amigo",
        "NPR", "NQR", "NKR",
        "FVR", "FTR"
    ],

    "Land Rover": [
        "Defender", "Defender 90", "Defender 110", "Defender 130",
        "Discovery", "Discovery Sport",
        "Range Rover", "Range Rover Sport",
        "Range Rover Evoque",
        "Range Rover Velar",
        "Freelander",
        "Range Rover Classic"
    ],

    "Jaguar": [
        "X-Type", "S-Type", "XF", "XJ",
        "XE", "F-Type",
        "F-Pace", "E-Pace", "I-Pace",
        "XK", "XK8", "XKR",
        "E-Type"
    ],

    "Porsche": [
        "356", "911", "911 Carrera", "911 Turbo", "911 GT3",
        "912", "914", "928", "944", "959",
        "968",
        "Boxster", "Cayman",
        "Panamera",
        "Macan", "Macan Electric",
        "Cayenne",
        "Taycan",
        "918 Spyder"
    ],

    "Lexus": [
        "IS", "IS F",
        "ES", "GS", "GS F",
        "LS",
        "RC", "RC F",
        "LC",
        "UX", "UX 300e",
        "NX", "NX Hybrid",
        "RX", "RX Hybrid",
        "GX", "LX",
        "LM"
    ],

    "BYD": [
        "Dolphin", "Dolphin Mini",
        "Atto 3", "Yuan Plus",
        "Seal", "Seal U",
        "Han", "Tang",
        "Song Plus",
        "King",
        "Shark"
    ],

    "Geely": [
        "Emgrand", "Emgrand X7",
        "Coolray", "Azkarra",
        "Okavango",
        "Geometry C",
        "Monjaro"
    ],

    "Haval": [
        "H1", "H2", "H3", "H5", "H6",
        "H7", "H8", "H9",
        "Jolion", "Dargo"
    ],

    "JAC": [
        "S2", "S3", "S4", "S7",
        "JS2", "JS3", "JS4", "JS8",
        "T6", "T8",
        "T9",
        "Sunray"
    ],

    "Changan": [
        "CS15", "CS35", "CS35 Plus",
        "CS55", "CS55 Plus",
        "CS75", "CS75 Plus",
        "CS85", "CS95",
        "Hunter",
        "Alsvin",
        "UNI-T", "UNI-K", "UNI-V"
    ],

    "BAIC": [
        "X25", "X35", "X55",
        "X7", "BJ20", "BJ40", "BJ60",
        "EU5", "D20",
        "F40"
    ],

    "DFSK": [
        "Glory 500", "Glory 580", "Glory 560",
        "Fengon 5", "Fengon 6",
        "Fengon 7",
        "K01", "K02", "C31", "C32",
        "C35", "C36"
    ],

    "Jetour": [
        "X70", "X70 Plus", "X90",
        "Dashing", "X50",
        "T2"
    ],

    "Omoda": [
        "O5", "C5", "C7",
        "E5"
    ],

    "Jaecoo": [
        "J7", "J8"
    ],

    "MG": [
        "MG 3", "MG 4", "MG 5",
        "MG 6", "MG 7",
        "ZS", "ZS EV",
        "HS", "HS PHEV",
        "RX5", "RX8",
        "Marvel R",
        "Cyberster"
    ],

    "Otra": [
        "Otro Modelo"
    ]
}

# 2. Clientes de prueba (CUITs válidos)
clientes_iniciales = [
    {
        "nombre": "Carlos Gomez",
        "telefono": "2966123456",
        "email": "carlos.gomez@email.com",
        "domicilio": "Av. San Martin 450",
        "cuit": "20-12345678-6",
        "condicion_iva": "Consumidor Final"
    },
    {
        "nombre": "Mariana Ruiz",
        "telefono": "2974987654",
        "email": "mariana.ruiz@email.com",
        "domicilio": "Calle Falsa 123",
        "cuit": "27-87654321-9",
        "condicion_iva": "Responsable Inscripto"
    },
    {
        "nombre": "Esteban Quito",
        "telefono": "2944555888",
        "email": "esteban.taller@email.com",
        "domicilio": "Ruta 3 Km 1820",
        "cuit": "20-11223344-0",
        "condicion_iva": "Monotributista"
    }
]

# 3. Vehículos de prueba vinculados a los clientes
vehiculos_iniciales = [
    {"cliente_id": 1, "patente": "AA123BB", "marca": "Toyota", "modelo": "Etios", "anio": 2017},
    {"cliente_id": 2, "patente": "AB456CC", "marca": "Volkswagen", "modelo": "Gol Trend", "anio": 2018},
    {"cliente_id": 3, "patente": "AC789DD", "marca": "Ford", "modelo": "Ranger", "anio": 2019}
]

# 4. Inventario de Repuestos
repuestos_iniciales = [
    {"nombre": "Aceite Sintético 10W40 (Bidón 4L)", "codigo": "ACE-10W40-4L", "categoria": "Lubricantes", "precio": 45000.00, "cantidad": 15, "stock_critico": 4},
    {"nombre": "Filtro de Aceite Mann Filter", "codigo": "FIL-ACE-01", "categoria": "Filtros", "precio": 12500.00, "cantidad": 8, "stock_critico": 3},
    {"nombre": "Pastillas de Freno Delanteras", "codigo": "FRE-PAS-DEL", "categoria": "Frenos", "precio": 42000.00, "cantidad": 6, "stock_critico": 2},
    {"nombre": "Kit de Embrague Completo", "codigo": "TRAN-EMB-01", "categoria": "Transmisión", "precio": 185000.00, "cantidad": 2, "stock_critico": 1},
    {"nombre": "Batería 12V 75Ah", "codigo": "ELEC-BAT-75", "categoria": "Electricidad", "precio": 120000.00, "cantidad": 3, "stock_critico": 1},
    {"nombre": "Bomba de Agua", "codigo": "MOT-BOM-AGUA", "categoria": "Motor", "precio": 65000.00, "cantidad": 3, "stock_critico": 1}
]

def sembrar_datos_completos():
    # 1. Crear las tablas de la base de datos (Esto crea el archivo taller.db automáticamente)
    Base.metadata.create_all(bind=engine)
    db = SesionLocal()
    
    try:
        if db.query(CatalogoVehiculo).count() == 0:
            for marca, modelos in catalogo_vehiculos.items():
                for modelo in modelos:
                    db.add(CatalogoVehiculo(marca=marca, modelo=modelo))
            db.commit()
            print("1. Catálogo de vehículos cargado.")

        if db.query(Cliente).count() == 0:
            for c in clientes_iniciales:
                db.add(Cliente(**c))
            db.commit()
            print("2. Clientes de prueba cargados.")

        if db.query(Vehiculo).count() == 0:
            for v in vehiculos_iniciales:
                db.add(Vehiculo(**v))
            db.commit()
            print("3. Vehículos asignados a los clientes cargados.")

        if db.query(Producto).count() == 0:
            for p in repuestos_iniciales:
                db.add(Producto(**p))
            db.commit()
            print("4. Inventario y repuestos cargados.")

        if db.query(Usuario).filter(Usuario.username == "luca").first() is None:
            nuevo_empleado = Usuario(
                nombre="Luca Del Pino",
                username="luca",
                password_hash=get_password_hash("1234"),
                rol="Mecánico"
            )
            db.add(nuevo_empleado)
            db.commit()
            print("5. Empleado 'Luca' registrado con éxito.")

        print("--- ¡Base de Datos iniciada y lista para usarse! ---")

    except Exception as e:
        db.rollback()
        print(f"Ocurrió un error durante la siembra de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sembrar_datos_completos()