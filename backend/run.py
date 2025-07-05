from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create the FastAPI app
app = FastAPI(
    title="WeatherWeS API",
    description="API for air quality monitoring with advanced filtering",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Updated for Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import all routes from main.py
from main import app as main_app

# Copy all routes from main_app to app
for route in main_app.routes:
    app.routes.append(route)

# Import the new routes separately
from api_update import app as api_update_app

# Copy all routes from api_update_app to app
for route in api_update_app.routes:
    # Check if the route already exists to avoid duplicates
    duplicate = False
    for existing_route in app.routes:
        if getattr(existing_route, "path", None) == getattr(route, "path", None):
            if getattr(existing_route, "methods", None) == getattr(route, "methods", None):
                duplicate = True
                break
    
    if not duplicate:
        app.routes.append(route)

# Run the app
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
