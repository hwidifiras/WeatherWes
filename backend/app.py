from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from main import app as main_app
from api_update import app as api_update_app
import importlib
import inspect

# Create a new FastAPI app that will combine both APIs
app = FastAPI(
    title="WeatherWeS Combined API",
    description="Combined API for air quality monitoring with advanced filtering",
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

# Import all routes from main app
for route in main_app.routes:
    app.routes.append(route)

# Import all routes from api_update app
for route in api_update_app.routes:
    # Skip routes that are already in the app (to avoid duplicates)
    if not any(r.path == route.path and r.methods == route.methods for r in app.routes):
        app.routes.append(route)

# Import and include all event handlers from both apps
for app_module in [main_app, api_update_app]:
    for attr_name in dir(app_module):
        if attr_name.startswith("on_"):
            event_handler = getattr(app_module, attr_name)
            if callable(event_handler) and hasattr(event_handler, "event_type"):
                app.add_event_handler(event_handler.event_type, event_handler)

# Run the app with Uvicorn if executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
