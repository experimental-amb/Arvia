import urllib.request
import json
import csv

def fetch_properties():
    all_properties = []
    offsets = [0, 50]
    
    for offset in offsets:
        url = f"https://api.mercadolibre.com/sites/MLC/search?category=MLC1459&limit=50&offset={offset}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                
            results = data.get('results', [])
            
            for item in results:
                title = item.get('title', '')
                price = item.get('price', 0)
                
                location = item.get('location', {})
                region = location.get('state', {}).get('name', 'Desconocido')
                comuna = location.get('city', {}).get('name', 'Desconocido')
                address = location.get('address_line', '')
                if not address: address = comuna
                
                attributes = item.get('attributes', [])
                
                bedrooms = 0
                bathrooms = 0
                sqm = 0
                
                for attr in attributes:
                    if attr['id'] in ('ROOMS', 'BEDROOMS'):
                        try: bedrooms = int(attr.get('value_struct', {}).get('number', attr.get('value_name', 0)))
                        except: pass
                    elif attr['id'] in ('FULL_BATHROOMS', 'BATHROOMS'):
                        try: bathrooms = int(attr.get('value_struct', {}).get('number', attr.get('value_name', 0)))
                        except: pass
                    elif attr['id'] in ('COVERED_AREA', 'TOTAL_AREA'):
                        try: 
                            val = attr.get('value_struct', {}).get('number', 0)
                            sqm = float(val) if val else 0
                        except: pass
                        
                description = f"Excelente oportunidad en {comuna}. {title}. Precio publicado: ${price}."
                
                all_properties.append({
                    'title': title,
                    'description': description,
                    'price': price,
                    'region': region,
                    'comuna': comuna,
                    'address': address,
                    'bedrooms': bedrooms,
                    'bathrooms': bathrooms,
                    'sqm': sqm
                })
        except Exception as e:
            print(f"Error fetching data: {e}")
            
    return all_properties

def save_to_csv(properties, filename):
    keys = ['title', 'description', 'price', 'region', 'comuna', 'address', 'bedrooms', 'bathrooms', 'sqm']
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(properties)

if __name__ == "__main__":
    props = fetch_properties()
    if props:
        save_to_csv(props, "propiedades_reales_chile.csv")
        print(f"Éxito: Se extrajeron {len(props)} propiedades reales y se guardaron en propiedades_reales_chile.csv")
    else:
        print("No se pudieron extraer propiedades.")
