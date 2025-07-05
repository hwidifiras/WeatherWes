"""
Patch pour l'endpoint measurements pour les tests
Cette version fonctionne avec mongomock qui ne supporte pas async/await
"""
from fastapi import HTTPException, status
from models import Location, Measurement, LocationResponse, MeasurementSummary
from datetime import datetime, timedelta
from typing import List, Dict, Any
import statistics
import sys
import traceback
import httpx

# Constante pour le TTL du cache
CACHE_TTL = timedelta(hours=1)

async def calculate_measurement_summaries(measurements: List[Measurement]) -> Dict[str, MeasurementSummary]:
    """Calculer les résumés des mesures par paramètre"""
    # Regrouper les mesures par paramètre
    grouped = {}
    for m in measurements:
        if m.parameter not in grouped:
            grouped[m.parameter] = []
        grouped[m.parameter].append(m.value)
    
    # Calculer les statistiques
    summaries = {}
    for param, values in grouped.items():
        if not values:
            continue
        
        try:
            summary = MeasurementSummary(
                parameter=param,
                count=len(values),
                min=min(values),
                max=max(values),
                avg=statistics.mean(values),
                median=statistics.median(values) if len(values) > 0 else 0,
                unit=measurements[0].unit if len(measurements) > 0 else "µg/m³"
            )
            summaries[param] = summary
        except Exception as e:
            print(f"Erreur lors du calcul des statistiques pour {param}: {e}")
    
    return summaries

async def get_measurements_for_tests(app, location_id: str, force_refresh: bool = False):
    """
    Version de l'endpoint get_measurements spécifique pour les tests
    qui fonctionne avec mongomock.
    """
    try:
        print(f"Fetching measurements for location_id: {location_id}")
        
        # Define location query
        try:
            # Essayer d'abord de l'interpréter comme un ID numérique
            int_id = int(location_id)
            location_query = {"id": int_id}
            print(f"Searching for location with numeric ID: {int_id}")
        except ValueError:
            # C'est peut-être un code comme UKA00472
            print(f"ID non numérique, recherche de code alternatif: {location_id}")
            location_query = {
                "$or": [
                    {"name": {"$regex": location_id, "$options": "i"}},
                    {"id": location_id}
                ]
            }
        
        # Version synchrone pour mongomock
        location_doc = None
        for doc in app.mongodb.locations.find(location_query):
            location_doc = doc
            break
        
        if not location_doc:
            raise HTTPException(status_code=404, detail="Location not found")
        
        location = Location(**location_doc)
        
        # Get the numeric OpenAQ ID
        openaq_id = str(location.id)
        
        # Check cache for measurements
        print(f"Checking cache with location_id: {location_id}, openaq_id: {openaq_id}")
        
        # Version synchrone pour mongomock
        cached_measurements = []
        for doc in app.mongodb.measurements.find({
            "location_id": openaq_id
        }):
            cached_measurements.append(Measurement(**doc))
        
        if not force_refresh and cached_measurements:
            summaries = await calculate_measurement_summaries(cached_measurements)
            return LocationResponse(
                location=location,
                measurements=cached_measurements,
                measurements_summary=summaries
            )
        
        # Si pas de données en cache ou force_refresh, on retourne juste les données disponibles
        # Dans un test, il n'y a pas besoin de faire un appel API réel
        if not cached_measurements:
            cached_measurements = []  # Empty list if no measurements found
        
        summaries = await calculate_measurement_summaries(cached_measurements)
        return LocationResponse(
            location=location,
            measurements=cached_measurements,
            measurements_summary=summaries
        )
        
    except HTTPException as he:
        # Propager les exceptions HTTP telles quelles
        raise he
    except Exception as e:
        # Toute autre exception est convertie en 500 Internal Server Error
        print("=== UNEXPECTED ERROR in get_measurements ===")
        print(f"Error while processing location_id: {location_id}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
