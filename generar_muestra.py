import csv
import random

comunas_santiago = ["Las Condes", "Providencia", "Ñuñoa", "Vitacura", "Lo Barnechea", "Santiago Centro", "La Florida", "Maipú", "Macul", "San Miguel"]
comunas_regiones = ["Viña del Mar", "Valparaíso", "Concón", "La Serena", "Coquimbo", "Concepción", "San Pedro de la Paz", "Temuco", "Puerto Varas", "Antofagasta"]

tipos = ["Departamento", "Casa", "Loft", "Penthouse", "Parcela"]
adjetivos = ["Hermoso", "Amplio", "Moderno", "Acogedor", "Luminoso", "Exclusivo", "Remodelado", "Nuevo", "Espectacular"]
caracteristicas = ["con vista despejada", "cerca de metro", "en barrio tranquilo", "con excelentes terminaciones", "con gran terraza", "cerca de colegios", "con áreas verdes", "con piscina y quincho"]

def generar_propiedades(cantidad):
    propiedades = []
    
    for i in range(cantidad):
        es_santiago = random.choice([True, True, False]) # Más peso a Santiago
        comuna = random.choice(comunas_santiago) if es_santiago else random.choice(comunas_regiones)
        region = "Metropolitana" if es_santiago else "Regiones"
        tipo = random.choice(tipos)
        
        # Ajuste de tamaño y piezas según tipo
        if tipo == "Departamento" or tipo == "Loft":
            bedrooms = random.randint(1, 3)
            bathrooms = random.randint(1, 2)
            sqm = random.randint(35, 120)
            precio = random.randint(2500, 8000) * 30000 # Precio simulado en pesos basado en UF
        elif tipo == "Penthouse":
            bedrooms = random.randint(3, 5)
            bathrooms = random.randint(3, 4)
            sqm = random.randint(140, 300)
            precio = random.randint(9000, 25000) * 30000
        elif tipo == "Parcela":
            bedrooms = random.randint(3, 6)
            bathrooms = random.randint(2, 5)
            sqm = random.randint(120, 400) # Metros construidos
            precio = random.randint(4000, 15000) * 30000
        else: # Casa
            bedrooms = random.randint(2, 5)
            bathrooms = random.randint(1, 4)
            sqm = random.randint(70, 250)
            precio = random.randint(3500, 15000) * 30000
            
        titulo = f"{random.choice(adjetivos)} {tipo} en {comuna} {random.choice(caracteristicas)}"
        descripcion = f"Excelente oportunidad de inversión o vivienda. {titulo}. Cuenta con {bedrooms} dormitorios y {bathrooms} baños, distribuidos en {sqm} m2. Ubicación privilegiada en la comuna de {comuna}, región {region}. Contáctanos para agendar una visita."
        
        # Direccion simulada
        calles = ["Av. Apoquindo", "Av. Providencia", "Irarrázaval", "Av. Kennedy", "Gran Avenida", "Av. del Mar", "Av. Libertad", "San Martín"]
        direccion = f"{random.choice(calles)} {random.randint(100, 9999)}"
        
        propiedades.append({
            'title': titulo,
            'description': descripcion,
            'price': precio,
            'region': region,
            'comuna': comuna,
            'address': direccion,
            'bedrooms': bedrooms,
            'bathrooms': bathrooms,
            'sqm': sqm
        })
        
    return propiedades

def save_to_csv(properties, filename):
    keys = ['title', 'description', 'price', 'region', 'comuna', 'address', 'bedrooms', 'bathrooms', 'sqm']
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(properties)

if __name__ == "__main__":
    props = generar_propiedades(150) # Generamos 150 propiedades
    save_to_csv(props, "propiedades_muestra_chile.csv")
    print(f"Éxito: Se generaron {len(props)} propiedades realistas de muestra.")
