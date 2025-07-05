from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime


class Coordinates(BaseModel):
    latitude: float
    longitude: float


class Country(BaseModel):
    id: int
    code: str
    name: str

class Location(BaseModel):
    id: int
    name: str
    city: Optional[str] = None
    locality: Optional[str] = None
    country: Country
    coordinates: Coordinates
    lastUpdated: Optional[datetime] = None
    parameters: Optional[List[Dict[str, Any]]] = None
    last_fetched: datetime = Field(default_factory=datetime.utcnow)
    measurement_count: int = 0
    is_active: bool = True
    is_demo_data: bool = False  # Indique si les mesures sont des données réelles ou de démo

    @property
    def display_city(self) -> str:
        """Returns the city or locality, preferring city if both exist"""
        return self.city or self.locality or "Unknown Location"


class MeasurementSummary(BaseModel):
    parameter: str
    min_value: float
    max_value: float
    avg_value: float
    count: int
    unit: str
    last_updated: datetime


class Measurement(BaseModel):
    location: str
    location_id: Union[int, str]  # Support both numeric and code IDs
    parameter: str  # e.g., "pm25", "co", "no2"
    value: float
    unit: str
    date: datetime
    coordinates: Optional[Coordinates] = None
    country: Optional[Country] = None
    city: Optional[str] = None
    last_fetched: datetime = Field(default_factory=datetime.utcnow)
    is_demo: bool = False  # Indique si c'est une mesure réelle ou générée


class LocationResponse(BaseModel):
    location: Location
    measurements: Optional[List[Measurement]] = None
    measurements_summary: Optional[List[MeasurementSummary]] = None


class ErrorResponse(BaseModel):
    detail: str
    status_code: int = 400


class PaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[BaseModel]
