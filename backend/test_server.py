"""
Serveur de test pour l'API WeatherWeS
Ce script permet de démarrer un serveur de test pour l'API
sans connexion à MongoDB réelle.
"""
import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mongomock

# Import de l'application principale
from main import app

# Configuration pour le test
os.environ["TESTING"] = "True"
os.environ["DB_NAME"] = "air_quality_test"

# Initialisation de MongoDB mockée
client = mongomock.MongoClient()
db = client["air_quality_test"]

# Remplacer le client MongoDB dans l'app
app.mongodb_client = client
app.mongodb = db

# Ajouter des données de test si nécessaire
# ...

if __name__ == "__main__":
    print("Starting test server on http://localhost:8000")
    uvicorn.run("test_server:app", host="0.0.0.0", port=8000, reload=True)
