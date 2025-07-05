"""
Utilitaires pour le backend WeatherWeS
"""
from typing import Dict, Any, Optional, Tuple, List
import httpx
import json
from datetime import datetime, timedelta
import random

async def check_openaq_api_params(
    base_url: str, 
    test_id: str,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Tester différents formats de paramètres pour déterminer le bon format
    pour l'API OpenAQ
    
    Args:
        base_url: URL de base de l'API OpenAQ (e.g., 'https://api.openaq.org/v3')
        test_id: ID à utiliser pour les tests
        api_key: Clé API optionnelle
        
    Returns:
        Un dictionnaire contenant les résultats des tests
    """
    results = {}
    headers = {"X-API-Key": api_key} if api_key else {}
    station_info = {}
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Vérifier si la station existe dans l'API OpenAQ
        try:
            print(f"Checking if station ID {test_id} exists in OpenAQ API")
            
            # Essai avec l'endpoint /locations en cherchant par ID
            locations_response = await client.get(
                f"{base_url}/locations",
                params={"id": test_id, "limit": 5},
                headers=headers
            )
            
            station_info["locations_by_id"] = {
                "status": locations_response.status_code,
                "success": locations_response.status_code == 200,
                "url": str(locations_response.url),
            }
            
            if locations_response.status_code == 200:
                data = locations_response.json()
                results_count = len(data.get("results", []))
                station_info["locations_by_id"]["found"] = results_count > 0
                station_info["locations_by_id"]["count"] = results_count
                
                if results_count > 0:
                    station_info["locations_by_id"]["station"] = data["results"][0]
            else:
                try:
                    station_info["locations_by_id"]["error"] = locations_response.json()
                except:
                    station_info["locations_by_id"]["error"] = locations_response.text
            
            # Essayer de trouver la station par nom
            # Pour cela, si nous avons trouvé la station par ID, utiliser son nom
            if station_info.get("locations_by_id", {}).get("found", False):
                station_name = station_info["locations_by_id"]["station"].get("name", "")
                
                if station_name:
                    print(f"Searching for station by name: {station_name}")
                    name_response = await client.get(
                        f"{base_url}/locations",
                        params={"name": station_name, "limit": 10},
                        headers=headers
                    )
                    
                    station_info["locations_by_name"] = {
                        "status": name_response.status_code,
                        "success": name_response.status_code == 200,
                        "url": str(name_response.url),
                        "name": station_name
                    }
                    
                    if name_response.status_code == 200:
                        data = name_response.json()
                        results_count = len(data.get("results", []))
                        station_info["locations_by_name"]["found"] = results_count > 0
                        station_info["locations_by_name"]["count"] = results_count
                        
                        if results_count > 0:
                            # Check if any of the results have the same ID
                            matching_stations = [
                                station for station in data.get("results", [])
                                if str(station.get("id")) == str(test_id)
                            ]
                            
                            station_info["locations_by_name"]["matching_id_count"] = len(matching_stations)
                    else:
                        try:
                            station_info["locations_by_name"]["error"] = name_response.json()
                        except:
                            station_info["locations_by_name"]["error"] = name_response.text
        except Exception as e:
            station_info["error"] = str(e)
        
        # Test des paramètres pour measurements
        tests = [
            ("location_id", {"location_id": test_id}),
            ("location", {"location": test_id}),
            ("locations", {"locations": test_id}),
            ("id", {"id": test_id}),
            ("entity", {"entity": test_id})
        ]
        
        for param_name, params in tests:
            try:
                print(f"Testing parameter format: {param_name}={test_id}")
                response = await client.get(
                    f"{base_url}/measurements",
                    params={**params, "limit": 5},
                    headers=headers
                )
                
                results[param_name] = {
                    "status": response.status_code,
                    "success": response.status_code == 200,
                    "url": str(response.url),
                }
                
                if response.status_code == 200:
                    data = response.json()
                    results[param_name]["count"] = len(data.get("results", []))
                    
                    # Ajouter des informations sur les mesures trouvées
                    if data.get("results"):
                        parameter_counts = {}
                        dates = []
                        for measurement in data.get("results", []):
                            parameter = measurement.get("parameter")
                            parameter_counts[parameter] = parameter_counts.get(parameter, 0) + 1
                            dates.append(measurement.get("date"))
                        
                        results[param_name]["parameters"] = parameter_counts
                        if dates:
                            results[param_name]["latest_date"] = max(dates)
                            results[param_name]["earliest_date"] = min(dates)
                else:
                    try:
                        results[param_name]["error"] = response.json()
                    except:
                        results[param_name]["error"] = response.text
            except Exception as e:
                results[param_name] = {
                    "status": "error",
                    "success": False,
                    "error": str(e)
                }
    
    # Trouver le meilleur paramètre (celui qui a fonctionné)
    best_param = None
    for param, result in results.items():
        if result.get("success", False) and result.get("count", 0) > 0:
            best_param = param
            break
    
    return {
        "station_info": station_info,
        "results": results,
        "recommended_param": best_param,
        "timestamp": datetime.utcnow().isoformat(),
        "test_id": test_id,
        "summary": {
            "exists_in_api": station_info.get("locations_by_id", {}).get("found", False),
            "has_measurements": any(result.get("success", False) and result.get("count", 0) > 0 for result in results.values()),
            "total_measurements": sum(result.get("count", 0) for result in results.values() if result.get("success", False)),
            "recommendation": "Retry with different ID" if not best_param else f"Use {best_param} parameter"
        }
    }

async def save_debug_info(data: Dict[str, Any], filepath: str = "openaq_debug.json"):
    """
    Sauvegarde les informations de débogage dans un fichier JSON
    
    Args:
        data: Données à sauvegarder
        filepath: Chemin du fichier de sortie
    """
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erreur lors de la sauvegarde du fichier de débogage: {e}")
        return False

def generate_demo_measurements(location_name: str, location_id: str, parameters: List[str] = None):
    """
    Génère des mesures de démonstration quand l'API OpenAQ ne renvoie pas de données.
    Cette fonction crée des mesures réalistes pour les stations qui existent mais n'ont pas
    de données récentes dans l'API.
    
    Args:
        location_name: Nom de la station
        location_id: ID de la station
        parameters: Liste des paramètres à générer (par défaut: PM2.5, PM10, NO2, O3)
        
    Returns:
        Liste de mesures générées
    """
    if parameters is None:
        parameters = ["pm25", "pm10", "no2", "o3"]
    
    measurements = []
    now = datetime.utcnow()
    
    # Valeurs typiques pour chaque paramètre (min, max, unité)
    parameter_ranges = {
        "pm25": (5, 40, "µg/m³"),
        "pm10": (10, 60, "µg/m³"),
        "no2": (10, 80, "µg/m³"),
        "o3": (20, 120, "µg/m³"),
        "co": (0.2, 3, "mg/m³"),
        "so2": (3, 25, "µg/m³"),
    }
    
    # Générer des données pour les 24 dernières heures
    for hour_offset in range(24):
        timestamp = now - timedelta(hours=hour_offset)
        
        for parameter in parameters:
            if parameter in parameter_ranges:
                min_val, max_val, unit = parameter_ranges[parameter]
                
                # Simuler une variation réaliste au cours de la journée
                hour_factor = 1.0
                if 7 <= timestamp.hour <= 10:  # Plus élevé pendant les heures de pointe du matin
                    hour_factor = 1.5
                elif 16 <= timestamp.hour <= 19:  # Plus élevé pendant les heures de pointe du soir
                    hour_factor = 1.4
                elif 0 <= timestamp.hour <= 5:  # Plus bas pendant la nuit
                    hour_factor = 0.7
                
                # Ajouter un peu de bruit aléatoire pour que ce soit réaliste
                base_value = min_val + (max_val - min_val) * random.random() * hour_factor
                value = round(base_value, 1)
                
                measurement = {
                    "location": location_name,
                    "parameter": parameter,
                    "value": value,
                    "unit": unit,
                    "date": timestamp.isoformat(),
                    "coordinates": None,  # Sera rempli par les coordonnées réelles de la station
                    "country": None,  # Sera rempli par le pays réel de la station
                    "city": None,  # Sera rempli par la ville réelle de la station
                    "location_id": location_id,
                    "last_fetched": now.isoformat(),
                    "is_demo": True  # Marquer comme données de démonstration
                }
                
                measurements.append(measurement)
    
    return measurements
