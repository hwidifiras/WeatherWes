"""
Patches et mock pour les tests unitaires.
Ce fichier contient des fonctions qui peuvent remplacer 
des méthodes dans l'application pendant les tests.
"""
from typing import Dict, Any, List
import json
from datetime import datetime
from bson import ObjectId

# Fonction de remplacement qui ne nécessite pas d'await
def mock_db_find_one(collection, query: Dict) -> Dict:
    """Version synchrone de find_one pour les tests."""
    # Dans un vrai environnement, cette fonction serait asynchrone
    # Mais pour les tests, on la rend synchrone
    results = []
    for doc in collection.find(query):
        results.append(doc)
    
    if results:
        return results[0]
    return None

def mock_db_find(collection, query: Dict) -> List[Dict]:
    """Version synchrone de find pour les tests."""
    results = []
    for doc in collection.find(query):
        results.append(doc)
    return results

class MockCursor:
    """Mock pour remplacer un curseur MongoDB asynchrone."""
    def __init__(self, docs):
        self.docs = docs
    
    async def to_list(self, length=None):
        """Mock pour to_list."""
        if length is None or length >= len(self.docs):
            return self.docs
        return self.docs[:length]

# Fonction pour convertir les documents MongoDB en JSON sérialisable
def json_serialize(obj):
    """Convertit un objet MongoDB en JSON sérialisable."""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type non sérialisable: {type(obj)}")
