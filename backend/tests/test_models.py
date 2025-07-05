# backend/tests/test_models.py
import pytest
from datetime import datetime
from models import Location, Measurement, Coordinates, Country

def test_location_model():
    """Test que le modèle Location fonctionne correctement"""
    # Créer un objet Location
    location = Location(
        id=1234,
        name="Test Station",
        city="Test City",
        country=Country(id=1, code="TST", name="Test Country"),
        coordinates=Coordinates(latitude=50.0, longitude=10.0),
        last_fetched=datetime.utcnow(),
        is_active=True
    )
    
    # Vérifier les propriétés
    assert location.id == 1234
    assert location.name == "Test Station"
    assert location.display_city == "Test City"
    assert location.country.code == "TST"
    assert location.coordinates.latitude == 50.0
    assert location.is_active is True
    assert location.is_demo_data is False  # valeur par défaut

def test_measurement_model():
    """Test que le modèle Measurement fonctionne correctement"""
    now = datetime.utcnow()
    
    # Créer un objet Measurement
    measurement = Measurement(
        location="Test Station",
        location_id=1234,
        parameter="pm25",
        value=15.0,
        unit="µg/m³",
        date=now,
        is_demo=False
    )
    
    # Vérifier les propriétés
    assert measurement.location == "Test Station"
    assert measurement.location_id == 1234
    assert measurement.parameter == "pm25"
    assert measurement.value == 15.0
    assert measurement.unit == "µg/m³"
    assert measurement.date == now
    assert measurement.is_demo is False
