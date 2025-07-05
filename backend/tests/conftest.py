# backend/tests/conftest.py
import pytest
import pytest_asyncio
import asyncio
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient
import mongomock
from typing import AsyncGenerator, Dict, Any

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from config import settings

# Mock pour MongoDB
@pytest_asyncio.fixture
async def mock_mongodb():
    """Fixture pour simuler MongoDB avec mongomock"""
    client = mongomock.MongoClient()
    db = client[settings.DB_NAME]
    
    # Pas besoin de créer les index avec mongomock, ça ne les supporte pas correctement
    
    # Remplacer le client MongoDB dans l'app
    app.mongodb_client = client
    app.mongodb = db
    
    return db

# Client de test pour les appels API
@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator:
    """Client asynchrone pour tester l'API"""
    # Pour la version récente de httpx, nous devons créer un transport personnalisé pour FastAPI
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

# Données de test pour les stations
@pytest.fixture
def sample_location() -> Dict[str, Any]:
    return {
        "id": 12345,
        "name": "Test Station",
        "city": "Test City",
        "locality": None,
        "country": {
            "id": 1,
            "code": "TST",
            "name": "Test Country"
        },
        "coordinates": {
            "latitude": 50.0,
            "longitude": 10.0
        },
        "parameters": [{"parameter": "pm25"}, {"parameter": "no2"}],
        "is_active": True,
        "is_demo_data": False
    }

# Données de test pour les mesures
@pytest.fixture
def sample_measurements() -> Dict[str, Any]:
    from datetime import datetime
    return [
        {
            "location": "Test Station",
            "location_id": 12345,
            "parameter": "pm25",
            "value": 15.0,
            "unit": "µg/m³",
            "date": datetime.utcnow().isoformat(),
            "coordinates": {"latitude": 50.0, "longitude": 10.0},
            "country": {"id": 1, "code": "TST", "name": "Test Country"},
            "city": "Test City",
            "is_demo": False
        }
    ]
