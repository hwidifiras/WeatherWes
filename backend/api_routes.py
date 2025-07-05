from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
import logging
from datetime import datetime, timedelta
from models import Location, ErrorResponse
from main import app, is_cache_valid
import httpx

# Configure logging
logger = logging.getLogger(__name__)

# Calculate distance between two points using Haversine formula
def calculate_distance(lat1, lon1, lat2, lon2):
    # Earth radius in kilometers
    from math import radians, sin, cos, sqrt, atan2
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
            return cached_locations

        # If we need to fetch from OpenAQ API, we'll still use the city-based approach
        # since that's what the OpenAQ API supports best
        if city:
            try:
                # Access the function directly from the main module to avoid circular imports
                from main import get_locations
                
                # Get the existing implementation to handle the OpenAQ API call
                return await get_locations(city, force_refresh)
            except Exception as e:
                logger.error(f"Failed to call get_locations: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error calling legacy location endpoint: {str(e)}"
                )
            
        # If no city specified but cache is empty or invalid, return empty list
        return []
        
    except Exception as e:
        logger.error(f"Error in get_filtered_locations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching filtered locations: {str(e)}"
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
        
        return result[:10]  # Limiter à 10 suggestions
        
    except Exception as e:
        logger.error(f"Error in get_city_suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching city suggestions: {str(e)}"
        )
