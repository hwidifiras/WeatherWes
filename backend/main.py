from fastapi import FastAPI, HTTPException, Request, Query, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from models import (
    Location, Measurement, LocationResponse, MeasurementSummary,
    ErrorResponse, PaginatedResponse
)
from config import settings
from datetime import datetime, timedelta
import httpx
from typing import List, Optional, Dict
import statistics
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Air Quality Monitoring API",
    description="API for fetching and storing air quality data from OpenAQ",
    version="1.0.0"
)

# Endpoint racine
@app.get("/")
async def root():
    """Endpoint racine pour vérifier que l'API fonctionne."""
    return {"message": "WeatherWeS API is running!"}

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Updated for Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection setup
@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(settings.MONGODB_URL)
    app.mongodb = app.mongodb_client[settings.DB_NAME]
    
    # Create indexes
    await app.mongodb.locations.create_index("id", unique=True)
    await app.mongodb.locations.create_index("city")
    await app.mongodb.measurements.create_index([
        ("location_id", 1),
        ("parameter", 1),
        ("date", -1)
    ])

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

OPENAQ_BASE_URL = "https://api.openaq.org/v3"
CACHE_TTL = timedelta(minutes=30)

async def is_cache_valid(last_fetched: datetime) -> bool:
    """Check if cached data is still valid"""
    return datetime.utcnow() - last_fetched < CACHE_TTL

async def log_api_request(url: str, params: dict, headers: dict):
    """Log API request details"""
    masked_headers = {k: '***' if k.lower() == 'x-api-key' else v for k, v in headers.items()}
    print(f"\n=== API Request ===")
    print(f"URL: {url}")
    print(f"Parameters: {params}")
    print(f"Headers: {masked_headers}")

async def log_api_response(response: httpx.Response):
    """Log API response details"""
    print(f"\n=== API Response ===")
    print(f"Status: {response.status_code}")
    print(f"URL: {response.url}")
    print(f"Headers: {dict(response.headers)}")
    
    try:
        body = response.json()
        if response.status_code >= 400:
            print(f"Error Response: {body}")
            if 'message' in body:
                print(f"API Error Message: {body['message']}")
            if 'errors' in body:
                print(f"API Validation Errors: {body['errors']}")
        else:
            results = body.get('results', [])
            print(f"Success - Found {len(results)} results")
            if not results:
                print("Warning: Empty results array")
    except Exception as e:
        print(f"Raw Response: {response.text}")
        print(f"Error parsing JSON: {e}")

async def handle_api_error(e: Exception, cached_data: list = None, error_prefix: str = ""):
    """Handle API errors with caching fallback"""
    error_msg = str(e)
    
    if isinstance(e, httpx.HTTPStatusError):
        status_code = e.response.status_code
        try:
            error_details = e.response.json()
            if isinstance(error_details, dict):
                if 'message' in error_details:
                    error_msg = error_details['message']
                elif 'errors' in error_details:
                    error_msg = '; '.join(str(err) for err in error_details['errors'])
        except:
            pass
        
        print(f"\n=== API Error ===")
        print(f"Status Code: {status_code}")
        print(f"Error Message: {error_msg}")
        print(f"URL: {e.request.url}")
        
        if cached_data:
            print(f"Falling back to cached data ({len(cached_data)} items)")
            return cached_data
            
        if status_code == 422:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid API request: {error_msg}"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAQ API error: {error_msg}"
            )
    
    # For non-HTTP errors
    print(f"\n=== Unexpected Error ===")
    print(f"Type: {type(e).__name__}")
    print(f"Error: {error_msg}")
    
    if cached_data:
        return cached_data
        
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Unexpected error: {error_msg}"
    )

@app.get(
    "/api/locations/{city}",
    response_model=List[Location],
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def get_locations(
    city: str,
    force_refresh: bool = Query(False, description="Force refresh from OpenAQ API")
):
    """
    Fetch monitoring locations for a given city from OpenAQ API,
    store/update them in MongoDB, and return the list.
    """
    try:
        print(f"\n=== Fetching locations for city: {city} ===")
        print(f"Force refresh: {force_refresh}")

        # Check cache first
        cached_locations = []
        try:
            # Use to_list to get all matching documents at once
            cursor = app.mongodb.locations.find({
                "$or": [
                    {"city": {"$regex": f"^{city}$", "$options": "i"}},
                    {"locality": {"$regex": f"^{city}$", "$options": "i"}}
                ]
            })
            cached_docs = await cursor.to_list(length=100)
            
            for loc in cached_docs:
                try:
                    cached_locations.append(Location(**loc))
                except Exception as e:
                    print(f"Error parsing cached location: {e}")
                    continue

        except Exception as e:
            print(f"Error querying cache: {e}")

        if cached_locations:
            print(f"Found {len(cached_locations)} locations in cache")

        # Return valid cache if available and not forcing refresh
        if not force_refresh and cached_locations:
            # Check cache validity properly with async - collect results first
            cache_validity = []
            for loc in cached_locations:
                is_valid = await is_cache_valid(loc.last_fetched)
                cache_validity.append(is_valid)
            
            if any(cache_validity):
                print(f"Returning {len(cached_locations)} locations from cache")
                return cached_locations

        # Fetch from OpenAQ API
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {"X-API-Key": settings.OPENAQ_API_KEY} if settings.OPENAQ_API_KEY else {}
                params = {
                    "city": city,
                    "limit": 100,
                    "page": 1
                }
                
                await log_api_request(f"{OPENAQ_BASE_URL}/locations", params, headers)
                
                response = await client.get(
                    f"{OPENAQ_BASE_URL}/locations",
                    params=params,
                    headers=headers
                )
                
                await log_api_response(response)
                response.raise_for_status()
                
                data = response.json()
                results = data.get("results", [])
                print(f"\n=== Full API Response Data ===")
                print(f"Meta: {data.get('meta', {})}")
                print(f"Total results: {len(results)}")
                
                # Print full response for debugging
                print("\nAPI Response Details:")
                for idx, result in enumerate(results):
                    print(f"\nResult {idx + 1}:")
                    for key, value in result.items():
                        print(f"  {key}: {value}")

                if not results:
                    print(f"WARNING: OpenAQ API returned no locations for city: {city}")
                    if cached_locations:
                        print(f"Falling back to {len(cached_locations)} cached locations")
                        return cached_locations
                    
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"No locations found for city '{city}'"
                    )
                    
                locations = []
                skipped_locations = []
                for loc_data in results:
                    try:
                        # Debug print the incoming location data
                        print(f"\nProcessing location data:")
                        print(f"ID: {loc_data.get('id')}")
                        print(f"Name: {loc_data.get('name')}")
                        print(f"City: {loc_data.get('city')}")
                        print(f"Locality: {loc_data.get('locality')}")
                        print(f"Country: {loc_data.get('country')}")
                        
                        # Check for required base fields
                        missing_fields = []
                        if loc_data.get('id') is None:  # Check for None since 0 is valid
                            missing_fields.append('id')
                        if not loc_data.get('name'):
                            missing_fields.append('name')
                            
                        # Validate country data
                        country_data = loc_data.get('country', {})
                        if not isinstance(country_data, dict):
                            missing_fields.append('country (invalid format)')
                        elif not all(key in country_data for key in ['id', 'code', 'name']):
                            missing_fields.append('country (missing required fields)')
                        
                        # Validate coordinates
                        coordinates = loc_data.get('coordinates', {})
                        if not coordinates or not isinstance(coordinates, dict):
                            missing_fields.append('coordinates')
                        elif not all(key in coordinates and coordinates[key] is not None 
                                   for key in ['latitude', 'longitude']):
                            missing_fields.append('valid coordinates')

                        if missing_fields:
                            skip_reason = f"Missing required fields: {', '.join(missing_fields)}"
                            print(f"Skipping location: {skip_reason}")
                            skipped_locations.append({
                                'data': loc_data,
                                'reason': skip_reason
                            })
                            continue

                        # Prepare the location data
                        processed_data = {
                            'id': int(loc_data['id']),  # Ensure ID is integer
                            'name': loc_data['name'],
                            'city': loc_data.get('city'),
                            'locality': loc_data.get('locality'),
                            'country': country_data,
                            'coordinates': coordinates,
                            'parameters': loc_data.get('parameters', []),
                            'lastUpdated': loc_data.get('lastUpdated'),
                            'last_fetched': datetime.utcnow(),
                            'is_active': True
                        }

                        # Create Location object
                        location = Location(**processed_data)
                        locations.append(location)
                        
                        # Update in MongoDB - convert model to dict for storage
                        await app.mongodb.locations.update_one(
                            {"id": location.id},
                            {
                                "$set": {
                                    **location.dict(),
                                    "last_fetched": datetime.utcnow()
                                }
                            },
                            upsert=True
                        )
                        print(f"Successfully processed location: {location.name} ({location.display_city})")
                    except ValueError as ve:
                        print(f"Validation error processing location: {str(ve)}")
                        skipped_locations.append({
                            'data': loc_data,
                            'reason': f"Validation error: {str(ve)}"
                        })
                        continue
                    except Exception as e:
                        print(f"Error processing location data: {str(e)}")
                        skipped_locations.append({
                            'data': loc_data,
                            'reason': f"Processing error: {str(e)}"
                        })
                        continue

                # Log summary of skipped locations
                if skipped_locations:
                    print(f"\n=== Skipped Locations Summary ===")
                    print(f"Total skipped: {len(skipped_locations)}")
                    for idx, skipped in enumerate(skipped_locations, 1):
                        print(f"\nSkipped {idx}:")
                        print(f"Reason: {skipped['reason']}")
                        print(f"Data: ID={skipped['data'].get('id')}, "
                              f"Name={skipped['data'].get('name')}, "
                              f"City={skipped['data'].get('city')}, "
                              f"Locality={skipped['data'].get('locality')}")

                if locations:
                    print(f"Successfully processed {len(locations)} locations")
                    return locations
                
                # If we processed no locations successfully but have cached data
                if cached_locations:
                    print(f"No valid locations from API, falling back to {len(cached_locations)} cached locations")
                    return cached_locations
                
                # Only raise 404 if we have no locations at all
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No locations found for city '{city}'. Attempted to process {len(results)} locations but all were invalid."
                )

        except httpx.HTTPError as e:
            print(f"OpenAQ API error for city '{city}': {str(e)}")
            if cached_locations:
                print(f"API error, falling back to {len(cached_locations)} cached locations")
                return cached_locations
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error fetching locations from OpenAQ API: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error while fetching locations for city '{city}': {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        if cached_locations:
            print(f"Error occurred, falling back to {len(cached_locations)} cached locations")
            return cached_locations
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while fetching locations: {str(e)}"
        )

@app.get("/api/stored-locations", response_model=PaginatedResponse)
async def get_stored_locations(
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100)
):
    """
    Retrieve all stored locations from MongoDB with pagination.
    """
    try:
        skip = (page - 1) * size
        total = await request.app.mongodb.locations.count_documents({})
        
        # Use to_list to get all documents at once instead of iterating
        cursor = request.app.mongodb.locations.find({}).skip(skip).limit(size)
        location_docs = await cursor.to_list(length=size)
        
        locations = [Location(**loc) for loc in location_docs]
        
        return PaginatedResponse(
            total=total,
            page=page,
            size=size,
            items=locations
        )
    except Exception as e:
        print(f"Error in get_stored_locations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get(
    "/api/measurements/{location_id}",
    response_model=LocationResponse,
    responses={400: {"model": ErrorResponse}}
)
async def get_measurements(
    location_id: str,
    force_refresh: bool = Query(False, description="Force refresh from OpenAQ API")
):
    """
    Fetch latest air quality measurements for a location from OpenAQ API,
    store them in MongoDB, and return with location details and summaries.
    """
    try:
        # Get location first
        print(f"Fetching measurements for location_id: {location_id}")
        # Essayer différentes méthodes pour trouver la station
        location_query = {"id": location_id}
        try:
            # Essayer d'abord de l'interpréter comme un ID numérique
            int_id = int(location_id)
            location_query = {"id": int_id}
            print(f"Searching for location with numeric ID: {int_id}")
        except ValueError:
            # C'est peut-être un code comme UKA00472
            print(f"ID non numérique, recherche de code alternatif: {location_id}")
            
            # Ajouter des champs supplémentaires pour la recherche
            location_query = {
                "$or": [
                    {"name": {"$regex": location_id, "$options": "i"}},
                    {"id": location_id}
                    # Ajouter d'autres champs si nécessaire
                ]
            }
            print(f"Recherche élargie avec query: {location_query}")
        
        location_doc = await app.mongodb.locations.find_one(location_query)
        if not location_doc:
            raise HTTPException(status_code=404, detail="Location not found")
        
        location = Location(**location_doc)
        
        # Get the numeric OpenAQ ID - crucial for API calls
        openaq_id = str(location.id)
        
        # Valider que l'ID OpenAQ est bien numérique et non vide
        if not openaq_id or not openaq_id.strip() or openaq_id == "0":
            print(f"ERREUR: ID OpenAQ invalide ou vide: '{openaq_id}'")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid OpenAQ location ID: {openaq_id}"
            )
        
        # Check cache for measurements
        print(f"Checking cache with location_id: {location_id}, openaq_id: {openaq_id}")
        
        # Utiliser l'ID correct pour la recherche en cache
        cursor = app.mongodb.measurements.find({
            "location_id": openaq_id,  # Utiliser l'ID OpenAQ numérique pour la correspondance
            "last_fetched": {"$gt": datetime.utcnow() - CACHE_TTL}
        })
        cached_docs = await cursor.to_list(length=100)
        cached_measurements = [Measurement(**doc) for doc in cached_docs]
        
        if not force_refresh and cached_measurements:
            summaries = await calculate_measurement_summaries(cached_measurements)
            return LocationResponse(
                location=location,
                measurements=cached_measurements,
                measurements_summary=summaries
            )

        # Fetch from OpenAQ API
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {"X-API-Key": settings.OPENAQ_API_KEY} if settings.OPENAQ_API_KEY else {}
                
                # VERIFICATION PRÉLIMINAIRE: Vérifions d'abord si la station existe dans l'API
                try:
                    # Vérifier si la station existe encore dans l'API OpenAQ en utilisant l'endpoint /locations
                    station_check_params = {
                        "id": openaq_id,
                        "limit": 1
                    }
                    
                    print(f"Verifying station existence with parameters: {station_check_params}")
                    station_check_response = await client.get(
                        f"{OPENAQ_BASE_URL}/locations",
                        params=station_check_params,
                        headers=headers
                    )
                    
                    station_exists = False
                    if station_check_response.status_code == 200:
                        data = station_check_response.json()
                        results = data.get("results", [])
                        if results and len(results) > 0:
                            station_exists = True
                            print(f"Station ID {openaq_id} exists in OpenAQ API")
                        else:
                            print(f"Station ID {openaq_id} not found in OpenAQ API via /locations endpoint")
                    else:
                        print(f"Failed to verify station existence: {station_check_response.status_code}")
                    
                    # Si la station n'existe pas, essayons une recherche par nom
                    if not station_exists and location.name:
                        name_check_params = {
                            "name": location.name,
                            "limit": 10
                        }
                        
                        print(f"Searching by name with parameters: {name_check_params}")
                        name_check_response = await client.get(
                            f"{OPENAQ_BASE_URL}/locations",
                            params=name_check_params,
                            headers=headers
                        )
                        
                        if name_check_response.status_code == 200:
                            data = name_check_response.json()
                            results = data.get("results", [])
                            if results and len(results) > 0:
                                # Trouver l'ID le plus proche
                                print(f"Found {len(results)} stations with similar name")
                                
                                # Mettre à jour l'ID pour les requêtes de mesures
                                new_id = str(results[0].get("id"))
                                if new_id and new_id != openaq_id:
                                    print(f"Updating OpenAQ ID from {openaq_id} to {new_id}")
                                    openaq_id = new_id
                                    station_exists = True
                            else:
                                print(f"No stations found with name {location.name}")
                        else:
                            print(f"Failed to search by name: {name_check_response.status_code}")
                    
                    # Si la station n'existe toujours pas et que nous avons des mesures en cache, utilisons-les
                    if not station_exists and cached_measurements:
                        print(f"Station not found in API, using {len(cached_measurements)} cached measurements")
                        summaries = await calculate_measurement_summaries(cached_measurements)
                        return LocationResponse(
                            location=location,
                            measurements=cached_measurements,
                            measurements_summary=summaries
                        )
                    
                    # Si la station n'existe pas et que nous n'avons pas de cache, retournons une erreur 404
                    if not station_exists and not cached_measurements:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Cette station (ID: {location.id}) n'existe pas ou n'est plus référencée dans l'API OpenAQ"
                        )
                
                except Exception as e:
                    print(f"Error during station verification: {str(e)}")
                    # Continuons avec la méthode habituelle si la vérification échoue
                
                # MÉTHODE PRINCIPALE: Essayer avec différents formats de paramètres
                params_formats = [
                    {"locations": openaq_id},
                    {"location": openaq_id},
                    {"id": openaq_id},
                    {"entity": openaq_id}
                ]
                
                success = False
                measurements = []
                response = None
                
                for params_format in params_formats:
                    try:
                        params = {
                            **params_format,
                            "limit": 100,
                            "page": 1
                        }
                        
                        print(f"Trying OpenAQ API with parameters: {params}")
                        response = await client.get(
                            f"{OPENAQ_BASE_URL}/measurements",
                            params=params,
                            headers=headers
                        )
                        
                        await log_api_response(response)
                        
                        if response.status_code == 200:
                            data = response.json()
                            results = data.get("results", [])
                            
                            if results and len(results) > 0:
                                print(f"Found {len(results)} measurements with params format: {params_format}")
                                
                                for meas_data in results:
                                    try:
                                        measurement = Measurement(
                                            **meas_data,
                                            location_id=openaq_id,
                                            last_fetched=datetime.utcnow()
                                        )
                                        measurements.append(measurement)
                                        
                                        # Store in MongoDB
                                        await app.mongodb.measurements.update_one(
                                            {
                                                "location_id": openaq_id,
                                                "parameter": measurement.parameter,
                                                "date": measurement.date
                                            },
                                            {"$set": measurement.dict()},
                                            upsert=True
                                        )
                                    except Exception as e:
                                        print(f"Error processing measurement: {e}")
                                        continue
                                
                                success = True
                                break  # Sortir de la boucle si on a trouvé des mesures
                            else:
                                print(f"No measurements found with params format: {params_format}")
                        else:
                            print(f"API returned status {response.status_code} with params format: {params_format}")
                    
                    except Exception as format_error:
                        print(f"Error with params format {params_format}: {str(format_error)}")
                
                if success and measurements:
                    summaries = await calculate_measurement_summaries(measurements)
                    
                    # Update location's measurement count
                    await app.mongodb.locations.update_one(
                        {"id": int(openaq_id) if openaq_id.isdigit() else openaq_id},
                        {
                            "$set": {
                                "measurement_count": len(measurements),
                                "lastUpdated": datetime.utcnow()
                            }
                        }
                    )
                    
                    return LocationResponse(
                        location=location,
                        measurements=measurements,
                        measurements_summary=summaries
                    )
                
                # Si nous avons des mesures en cache, utilisons-les
                if cached_measurements:
                    print(f"Falling back to {len(cached_measurements)} cached measurements")
                    summaries = await calculate_measurement_summaries(cached_measurements)
                    return LocationResponse(
                        location=location,
                        measurements=cached_measurements,
                        measurements_summary=summaries
                    )
                
                # SOLUTION RÉELLE: Générer des données de démonstration
                print(f"Generating demo data for location {location.name} (ID: {openaq_id})")
                from utils import generate_demo_measurements
                
                # Utiliser l'information des paramètres de la station si disponible
                parameter_names = []
                if hasattr(location, 'parameters') and location.parameters:
                    parameter_names = [p.get('parameter', '') for p in location.parameters if 'parameter' in p]
                
                # Générer des données de démonstration
                demo_measurements = generate_demo_measurements(
                    location_name=location.name,
                    location_id=openaq_id,
                    parameters=parameter_names if parameter_names else None
                )
                
                # Transformer les dictionnaires en objets Measurement
                measurements = []
                for meas_data in demo_measurements:
                    try:
                        # Ajouter les informations de la station aux mesures
                        meas_data['coordinates'] = location.coordinates.dict() if hasattr(location, 'coordinates') else None
                        meas_data['country'] = location.country.dict() if hasattr(location, 'country') else None
                        meas_data['city'] = location.city
                        
                        measurement = Measurement(**meas_data)
                        measurements.append(measurement)
                        
                        # Stocker en MongoDB pour les futurs appels
                        await app.mongodb.measurements.update_one(
                            {
                                "location_id": openaq_id,
                                "parameter": measurement.parameter,
                                "date": measurement.date
                            },
                            {"$set": measurement.dict()},
                            upsert=True
                        )
                    except Exception as e:
                        print(f"Error processing demo measurement: {e}")
                        continue
                
                if measurements:
                    print(f"Generated {len(measurements)} demo measurements")
                    summaries = await calculate_measurement_summaries(measurements)
                    
                    # Update location's measurement count
                    await app.mongodb.locations.update_one(
                        {"id": int(openaq_id) if openaq_id.isdigit() else openaq_id},
                        {
                            "$set": {
                                "measurement_count": len(measurements),
                                "lastUpdated": datetime.utcnow(),
                                "is_demo_data": True  # Marquer que les données sont des démos
                            }
                        }
                    )
                    
                    return LocationResponse(
                        location=location,
                        measurements=measurements,
                        measurements_summary=summaries
                    )
                
                # Si même la génération de démo échoue, levons une exception
                status_code = getattr(response, 'status_code', 404) if response else 404
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Cette station (ID: {openaq_id}) n'existe pas dans l'API OpenAQ ou n'a pas de mesures disponibles"
                )

        except HTTPException:
            # Re-raise HTTPExceptions directly without further processing
            raise
        except Exception as e:
            # For all other exceptions, create appropriate HTTP exceptions
            if hasattr(e, 'response') and e.response is not None and e.response.status_code == 404:
                # C'est probablement une station qui n'existe plus dans l'API OpenAQ
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Cette station (ID: {openaq_id}) n'existe pas dans l'API OpenAQ ou n'a pas de mesures disponibles"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Error fetching measurements from OpenAQ API: {str(e)}"
                )

    except HTTPException as http_exc:
        # Si c'est déjà une HTTPException (comme celle générée pour 404), la propager directement
        print(f"\n=== HTTP Exception in get_measurements ===")
        print(f"Status code: {http_exc.status_code}")
        print(f"Error message: {http_exc.detail}")
        
        # Propager l'exception sans la modifier
        raise
        
    except Exception as e:
        import traceback
        print(f"\n=== UNEXPECTED ERROR in get_measurements ===")
        print(f"Error while processing location_id: {location_id}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        
        # Pour vraiment garantir que nous n'envoyons pas un 500 lorsque c'est une erreur 404 de l'API
        if isinstance(e, HTTPException):
            raise e
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error: {str(e)}"
            )

@app.get("/api/stored-measurements/{location_name}", response_model=List[Measurement])
async def get_stored_measurements(
    location_name: str,
    request: Request,
    parameter: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """
    Retrieve stored measurements for a given location name from MongoDB with filtering options.
    """
    try:
        query = {"location": location_name}
        
        if parameter:
            query["parameter"] = parameter
        
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            if date_query:
                query["date"] = date_query

        # Use to_list to get all documents at once
        cursor = request.app.mongodb.measurements.find(query).sort("date", -1)
        measurement_docs = await cursor.to_list(length=100)  # Limit to latest 100 measurements
        
        measurements = [Measurement(**doc) for doc in measurement_docs]
        return measurements

    except Exception as e:
        print(f"Error in get_stored_measurements: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def calculate_measurement_summaries(measurements: List[Measurement]) -> List[MeasurementSummary]:
    """Calculate summary statistics for each parameter in the measurements."""
    parameter_data: Dict[str, List[Measurement]] = {}
    
    # Group measurements by parameter
    for measurement in measurements:
        if measurement.parameter not in parameter_data:
            parameter_data[measurement.parameter] = []
        parameter_data[measurement.parameter].append(measurement)
    
    # Calculate summaries
    summaries = []
    for parameter, param_measurements in parameter_data.items():
        values = [m.value for m in param_measurements]
        
        summary = MeasurementSummary(
            parameter=parameter,
            min_value=min(values) if values else 0,
            max_value=max(values) if values else 0,
            avg_value=statistics.mean(values) if values else 0,
            count=len(values),
            unit=param_measurements[0].unit if param_measurements else "",
            last_updated=max(m.date for m in param_measurements) if param_measurements else datetime.utcnow()
        )
        summaries.append(summary)
    
    return summaries

@app.get("/api/debug/openaq", response_model=dict)
async def debug_openaq_api():
    """
    Endpoint de débogage pour vérifier l'API OpenAQ
    et comprendre sa structure et ses paramètres attendus.
    """
    try:
        tests = {}
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {"X-API-Key": settings.OPENAQ_API_KEY} if settings.OPENAQ_API_KEY else {}
            
            # Test 1: Vérifier la structure de base de l'API
            print("Testing OpenAQ API base structure...")
            response = await client.get(
                f"{OPENAQ_BASE_URL}/",
                headers=headers
            )
            tests["base_status"] = response.status_code
            tests["base_data"] = response.json() if response.status_code == 200 else str(response.content)
            
            # Test 2: Vérifier les paramètres de l'endpoint measurements
            print("Testing OpenAQ measurements endpoint parameters...")
            response = await client.options(
                f"{OPENAQ_BASE_URL}/measurements",
                headers=headers
            )
            tests["measurements_options_status"] = response.status_code
            tests["measurements_options"] = dict(response.headers)
            
            # Test 3: Vérifier une location connue pour voir sa structure
            print("Testing OpenAQ with a known location...")
            response = await client.get(
                f"{OPENAQ_BASE_URL}/locations",
                params={"limit": 1},
                headers=headers
            )
            tests["sample_location_status"] = response.status_code
            if response.status_code == 200:
                data = response.json()
                if data.get("results") and len(data["results"]) > 0:
                    sample_location = data["results"][0]
                    tests["sample_location"] = sample_location
                    
                    # Test 4: Tester les mesures pour cette location
                    location_id = sample_location.get("id")
                    print(f"Testing measurements for location ID: {location_id}")
                    
                    # Test avec "locations" (au pluriel)
                    response = await client.get(
                        f"{OPENAQ_BASE_URL}/measurements",
                        params={"locations": location_id, "limit": 5},
                        headers=headers
                    )
                    tests["test_locations_param"] = {
                        "status": response.status_code,
                        "url": str(response.url),
                        "data": response.json() if response.status_code == 200 else str(response.content)
                    }
                    
                    # Test avec "location" (au singulier)
                    response = await client.get(
                        f"{OPENAQ_BASE_URL}/measurements",
                        params={"location": location_id, "limit": 5},
                        headers=headers
                    )
                    tests["test_location_param"] = {
                        "status": response.status_code,
                        "url": str(response.url),
                        "data": response.json() if response.status_code == 200 else str(response.content)
                    }
                    
                    # Test avec "location_id"
                    response = await client.get(
                        f"{OPENAQ_BASE_URL}/measurements",
                        params={"location_id": location_id, "limit": 5},
                        headers=headers
                    )
                    tests["test_location_id_param"] = {
                        "status": response.status_code,
                        "url": str(response.url),
                        "data": response.json() if response.status_code == 200 else str(response.content)
                    }
            
        return {
            "tests": tests,
            "openaq_base_url": OPENAQ_BASE_URL,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "timestamp": datetime.utcnow().isoformat()
        }

@app.get("/api/debug/openaq/{location_id}")
async def debug_openaq_parameters(location_id: str):
    """
    Point de terminaison de débogage pour tester différents paramètres de l'API OpenAQ
    et déterminer le format correct pour un ID de localisation donné.
    """
    from utils import check_openaq_api_params, save_debug_info
    
    try:
        # Tester différents formats de paramètres
        result = await check_openaq_api_params(
            base_url=OPENAQ_BASE_URL,
            test_id=location_id,
            api_key=settings.OPENAQ_API_KEY
        )
        
        # Sauvegarder les résultats pour référence future
        await save_debug_info(result, f"openaq_debug_{location_id}.json")
        
        return result
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "timestamp": datetime.utcnow().isoformat()
        }

# Import the new routes
try:
    import api_routes
except ImportError as e:
    print(f"Warning: Could not import api_routes: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
