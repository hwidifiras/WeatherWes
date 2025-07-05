# backend/tests/test_utils.py
import pytest
import asyncio
from datetime import datetime, timedelta
from utils import check_openaq_api_params, generate_demo_measurements, save_debug_info
import json
import os
import httpx
from unittest.mock import patch, mock_open

@pytest.mark.asyncio
async def test_generate_demo_measurements():
    """Test que la génération de mesures de démo fonctionne"""
    location_name = "Demo Station"
    location_id = "12345"
    
    # Générer des mesures de démo
    measurements = generate_demo_measurements(location_name, location_id)
    
    # Vérifications
    assert len(measurements) > 0
    assert all(m["location"] == location_name for m in measurements)
    assert all(m["location_id"] == location_id for m in measurements)
    assert all(m["is_demo"] is True for m in measurements)
    
    # Vérifier qu'il y a des données pour les dernières 24 heures
    parameters = set(m["parameter"] for m in measurements)
    assert len(parameters) > 0
    
    # Vérifier que les plages de valeurs sont respectées
    pm25_values = [m["value"] for m in measurements if m["parameter"] == "pm25"]
    if pm25_values:
        assert all(5 <= v <= 40*1.5 for v in pm25_values)  # 1.5 est le facteur maximum

@pytest.mark.asyncio
async def test_save_debug_info(tmp_path):
    """Test que la sauvegarde des données de debug fonctionne"""
    # Créer un fichier temporaire
    filepath = tmp_path / "test_debug.json"
    
    # Données de test
    test_data = {"test": "data", "nested": {"value": 123}}
    
    # Sauvegarder les données
    result = await save_debug_info(test_data, str(filepath))
    
    # Vérifier que la sauvegarde a réussi
    assert result is True
    assert filepath.exists()
    
    # Vérifier le contenu du fichier
    with open(filepath, 'r', encoding='utf-8') as f:
        saved_data = json.load(f)
    
    assert saved_data == test_data

@pytest.mark.asyncio
async def test_check_openaq_api_params():
    """Test que la vérification des paramètres OpenAQ fonctionne"""
    with patch("httpx.AsyncClient") as mock_client:
        # Configurer le mock pour simuler les réponses API
        mock_response = mock_client.return_value.__aenter__.return_value.get.return_value
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": [{"id": "test_id", "name": "Test Station"}]
        }
        mock_response.url = "https://api.openaq.org/v3/test"
        
        # Appeler la fonction
        result = await check_openaq_api_params("https://api.openaq.org/v3", "test_id")
        
        # Vérifier la structure de la réponse
        assert "station_info" in result
        assert "results" in result
        assert "recommended_param" in result
        assert "timestamp" in result
        assert "test_id" in result
        assert "summary" in result
