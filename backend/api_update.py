from fastapi import FastAPI, HTTPException, Request, Query, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from models import (
    Location, Measurement, LocationResponse, MeasurementSummary,
    ErrorResponse, PaginatedResponse
)
from config import settings
from datetime import datetime, timedelta
import httpx
from typing import List, Optional, Dict, Union
import statistics
from fastapi.responses import JSONResponse
from math import radians, sin, cos, sqrt, atan2
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
    await app.mongodb.locations.create_index([("coordinates.latitude", 1), ("coordinates.longitude", 1)])
    await app.mongodb.locations.create_index("country.code")
    await app.mongodb.locations.create_index("parameters")
    await app.mongodb.measurements.create_index([
        ("location_id", 1),
        ("parameter", 1),
        ("date", -1)
    ])

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

# Constants
OPENAQ_BASE_URL = "https://api.openaq.org/v2"
CACHE_DURATION = timedelta(hours=1)  # Cache OpenAQ responses for 1 hour

# Helper Functions
async def is_cache_valid(last_fetched: Optional[datetime]) -> bool:
    """Check if cache is still valid based on last fetch time"""
    if not last_fetched:
        return False
        
    now = datetime.utcnow()
    time_diff = now - last_fetched
    
    return time_diff < CACHE_DURATION

# Calculate distance between two points using Haversine formula
def calculate_distance(lat1, lon1, lat2, lon2):
    # Earth radius in kilometers
    R = 6371.0
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c  # Distance in km

# Filter locations by parameters
def filter_by_parameters(location, parameters):
    if not location.get('parameters') or not parameters:
        return False
    return any(param in location.get('parameters', []) for param in parameters)

# Filter locations by radius
def filter_by_radius(location, lat, lon, radius):
    loc_lat = location.get('coordinates', {}).get('latitude')
    loc_lon = location.get('coordinates', {}).get('longitude')
    
    if not loc_lat or not loc_lon:
        return False
        
    distance = calculate_distance(lat, lon, loc_lat, loc_lon)
    return distance <= radius

# Filter locations by bounding box
def filter_by_bbox(location, min_lat, min_lon, max_lat, max_lon):
    loc_lat = location.get('coordinates', {}).get('latitude')
    loc_lon = location.get('coordinates', {}).get('longitude')
    
    if not loc_lat or not loc_lon:
        return False
        
    return (min_lat <= loc_lat <= max_lat) and (min_lon <= loc_lon <= max_lon)

# Log API requests for debugging
async def log_api_request(url, params, headers):
    logger.info(f"API Request: {url}")
    logger.info(f"Params: {params}")
    logger.info(f"Headers: {headers}")

# New endpoint for advanced location filtering
@app.get(
    "/api/locations",
    response_model=List[Location],
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def get_filtered_locations(
    city: Optional[str] = Query(None, description="Filter by city name"),
    country: Optional[str] = Query(None, description="Filter by country code (e.g. US, FR)"),
    latitude: Optional[float] = Query(None, description="Latitude for radius search"),
    longitude: Optional[float] = Query(None, description="Longitude for radius search"),
    radius: Optional[float] = Query(10.0, description="Radius in kilometers"),
    min_lat: Optional[float] = Query(None, description="Minimum latitude for bounding box"),
    min_lon: Optional[float] = Query(None, description="Minimum longitude for bounding box"),
    max_lat: Optional[float] = Query(None, description="Maximum latitude for bounding box"),
    max_lon: Optional[float] = Query(None, description="Maximum longitude for bounding box"),
    parameters: Optional[str] = Query(None, description="Comma-separated list of parameters (e.g. pm25,o3)"),
    has_recent: bool = Query(False, description="Only include locations with recent measurements"),
    exclude_unknown: bool = Query(False, description="Exclude locations with unknown names"),
    limit: int = Query(50, ge=1, le=1000, description="Maximum number of results"),
    page: int = Query(1, ge=1, description="Page number"),
    force_refresh: bool = Query(False, description="Force refresh from OpenAQ API")
):
    """
    Fetch monitoring locations with advanced filtering options.
    Filter by city, country, coordinates (radius or bbox), parameters, etc.
    """
    try:
        # Parse parameters if provided
        param_list = None
        if parameters:
            param_list = [p.strip() for p in parameters.split(',')]
        
        # Build query
        query = {}
        
        # City filter
        if city:
            query["$or"] = [
                {"city": {"$regex": f".*{city}.*", "$options": "i"}},
                {"locality": {"$regex": f".*{city}.*", "$options": "i"}}
            ]
            
        # Country filter    
        if country:
            query["country.code"] = country.upper()
            
        # Exclude unknown locations
        if exclude_unknown:
            query["name"] = {"$ne": None, "$nin": ["", "Unknown", "unknown"]}
            
        logger.info(f"MongoDB Query: {query}")

        # Check cache first
        cached_locations = []
        try:
            # Use to_list to get all matching documents at once
            cursor = app.mongodb.locations.find(query).skip((page - 1) * limit).limit(limit)
            cached_docs = await cursor.to_list(length=limit)
            
            for loc in cached_docs:
                try:
                    # Convert to Location object
                    location = Location(**loc)
                    
                    # Apply post-query filters
                    skip = False
                    
                    # Filter by parameters
                    if param_list and not filter_by_parameters(loc, param_list):
                        skip = True
                        
                    # Filter by radius
                    if latitude is not None and longitude is not None and not filter_by_radius(
                            loc, latitude, longitude, radius):
                        skip = True
                        
                    # Filter by bounding box
                    if min_lat is not None and min_lon is not None and max_lat is not None and max_lon is not None:
                        if not filter_by_bbox(loc, min_lat, min_lon, max_lat, max_lon):
                            skip = True
                    
                    if not skip:
                        cached_locations.append(location)
                        
                except Exception as e:
                    logger.error(f"Error parsing cached location: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error querying cache: {e}")

        if cached_locations:
            logger.info(f"Found {len(cached_locations)} locations in cache")

        # Return valid cache if available and not forcing refresh
        if not force_refresh and cached_locations:
            # Check cache validity properly with async - collect results first
            cache_validity = []
            for loc in cached_locations:
                is_valid = await is_cache_valid(loc.last_fetched)
                cache_validity.append(is_valid)
            
            if any(cache_validity):
                logger.info(f"Returning {len(cached_locations)} filtered locations from cache")
                return cached_locations

        # If we need to fetch from OpenAQ API, we'll still use the city-based approach
        # since that's what the OpenAQ API supports best
        if city:
            # Get the existing implementation to handle the OpenAQ API call
            return await get_locations_by_city(city, force_refresh)
            
        # If no city specified but cache is empty or invalid, return empty list
        return []
        
    except Exception as e:
        logger.error(f"Error in get_filtered_locations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching filtered locations: {str(e)}"
        )

# Legacy endpoint for city-based locations
@app.get(
    "/api/locations/{city}",
    response_model=List[Location],
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def get_locations_by_city(
    city: str,
    force_refresh: bool = Query(False, description="Force refresh from OpenAQ API")
):
    """
    Fetch monitoring locations for a given city from OpenAQ API,
    store/update them in MongoDB, and return the list.
    """
    try:
        logger.info(f"=== Fetching locations for city: {city} ===")
        logger.info(f"Force refresh: {force_refresh}")

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
                    logger.error(f"Error parsing cached location: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error querying cache: {e}")

        if cached_locations:
            logger.info(f"Found {len(cached_locations)} locations in cache")

        # Return valid cache if available and not forcing refresh
        if not force_refresh and cached_locations:
            # Check cache validity properly with async - collect results first
            cache_validity = []
            for loc in cached_locations:
                is_valid = await is_cache_valid(loc.last_fetched)
                cache_validity.append(is_valid)
            
            if any(cache_validity):
                logger.info(f"Returning {len(cached_locations)} locations from cache")
                return cached_locations

        # Fetch from OpenAQ API
        async with httpx.AsyncClient() as client:
            headers = {"accept": "application/json"}
            params = {"limit": 100, "page": 1, "sort": "desc", "order_by": "lastUpdated"}

            # Search by city using OpenAQ API
            try:
                params["city"] = city
                
                await log_api_request(f"{OPENAQ_BASE_URL}/locations", params, headers)
                
                response = await client.get(
                    f"{OPENAQ_BASE_URL}/locations",
                    headers=headers,
                    params=params,
                    timeout=20.0
                )

                response.raise_for_status()
                logger.info(f"OpenAQ Response Status: {response.status_code}")

                # Process API response
                if response.status_code == 200:
                    data = response.json()
                    api_locations = data.get("results", [])
                    
                    if not api_locations:
                        logger.warning(f"OpenAQ API returned no locations for city: {city}")
                        if cached_locations:
                            # Return stale cache if no fresh data available
                            logger.warning("Returning stale cache as fallback")
                            return cached_locations
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"No locations found for city: {city}"
                        )

                    # Update MongoDB and process response
                    processed_locations = []
                    
                    for loc_data in api_locations:
                        # Skip locations without coordinates
                        if "coordinates" not in loc_data or not loc_data["coordinates"]:
                            continue
                            
                        # Add last_fetched timestamp
                        loc_data["last_fetched"] = datetime.utcnow()
                        
                        # Get parameters for this location by fetching latest measurements
                        try:
                            params = {"location_id": loc_data["id"], "limit": 5}
                            measurements_response = await client.get(
                                f"{OPENAQ_BASE_URL}/latest/measurements",
                                headers=headers,
                                params=params
                            )
                            
                            if measurements_response.status_code == 200:
                                measurements_data = measurements_response.json()
                                parameters = []
                                
                                for measurement in measurements_data.get("results", []):
                                    param = measurement.get("parameter")
                                    if param and param not in parameters:
                                        parameters.append(param)
                                
                                loc_data["parameters"] = parameters
                                loc_data["measurement_count"] = len(measurements_data.get("results", []))
                                
                                # Check if any measurements are from the last 24 hours
                                loc_data["has_recent"] = False
                                for m in measurements_data.get("results", []):
                                    if m.get("date", {}).get("utc"):
                                        utc_date_str = m["date"]["utc"]
                                        try:
                                            utc_date = datetime.fromisoformat(utc_date_str.replace("Z", "+00:00"))
                                            if datetime.utcnow() - utc_date < timedelta(hours=24):
                                                loc_data["has_recent"] = True
                                                break
                                        except Exception as e:
                                            logger.error(f"Error parsing date: {e}")
                                            continue
                            
                        except Exception as e:
                            logger.error(f"Error fetching measurements for location {loc_data['id']}: {e}")
                            loc_data["parameters"] = []
                            loc_data["measurement_count"] = 0
                            loc_data["has_recent"] = False
                        
                        # Create Location object for response
                        try:
                            location = Location(**loc_data)
                            processed_locations.append(location)
                            
                            # Upsert to MongoDB
                            await app.mongodb.locations.update_one(
                                {"id": loc_data["id"]},
                                {"$set": loc_data},
                                upsert=True
                            )
                        except Exception as e:
                            logger.error(f"Error processing location {loc_data.get('id')}: {e}")
                    
                    logger.info(f"Processed and saved {len(processed_locations)} locations")
                    return processed_locations
                else:
                    # Return cache as fallback if API call fails
                    if cached_locations:
                        logger.warning(f"API returned status {response.status_code}, using cache as fallback")
                        return cached_locations
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"OpenAQ API returned status {response.status_code}"
                    )
                    
            except httpx.RequestError as e:
                logger.error(f"HTTP Request error: {e}")
                if cached_locations:
                    # Return stale cache as fallback
                    logger.warning(f"HTTP error: {str(e)}, using cache as fallback")
                    return cached_locations
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Error connecting to OpenAQ API: {str(e)}"
                )
                
    except HTTPException:
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error in get_locations_by_city: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching locations: {str(e)}"
        )

# Endpoint pour les suggestions de villes (autocomplete)
@app.get(
    "/api/cities/suggest",
    response_model=List[str],
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def get_city_suggestions(
    q: str = Query(..., min_length=2, description="Query string for city name")
):
    """
    Retrieve city name suggestions for autocomplete.
    Returns a list of city names matching the query string.
    """
    try:
        # Recherche dans MongoDB avec regex insensible à la casse
        cursor = app.mongodb.locations.aggregate([
            {"$match": {"city": {"$regex": f".*{q}.*", "$options": "i"}}},
            {"$group": {"_id": {"city": "$city"}}},
            {"$project": {"_id": 0, "city": "$_id.city"}},
            {"$match": {"city": {"$ne": None, "$nin": ["", "Unknown", "unknown"]}}},
            {"$sort": {"city": 1}},
            {"$limit": 10}
        ])
        
        cities = await cursor.to_list(length=10)
        result = [city["city"] for city in cities if city["city"]]
        
        # Si on a peu de résultats, compléter avec les localités
        if len(result) < 5:
            cursor = app.mongodb.locations.aggregate([
                {"$match": {"locality": {"$regex": f".*{q}.*", "$options": "i"}}},
                {"$group": {"_id": {"locality": "$locality"}}},
                {"$project": {"_id": 0, "locality": "$_id.locality"}},
                {"$match": {"locality": {"$ne": None, "$nin": ["", "Unknown", "unknown"]}}},
                {"$sort": {"locality": 1}},
                {"$limit": 5}
            ])
            
            localities = await cursor.to_list(length=5)
            locality_results = [loc["locality"] for loc in localities if loc["locality"]]
            
            # Ajouter les localités qui ne sont pas déjà dans les villes
            for locality in locality_results:
                if locality not in result:
                    result.append(locality)
            
        # Si toujours pas assez de résultats, on pourrait faire une requête à OpenAQ
        # mais ce n'est pas forcément nécessaire pour l'autocomplétion
            
        return result[:10]  # Limiter à 10 suggestions
        
    except Exception as e:
        logger.error(f"Error in get_city_suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching city suggestions: {str(e)}"
        )
