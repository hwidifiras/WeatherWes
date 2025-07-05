import pytest
import sys
import os

if __name__ == "__main__":
    # Définir les variables d'environnement pour les tests
    os.environ["TESTING"] = "True"
    os.environ["DB_NAME"] = "air_quality_test"
    
    # Exécuter avec couverture de code
    args = ["-v", "--cov=.", "--cov-report=term-missing"]
    sys.exit(pytest.main(args))
