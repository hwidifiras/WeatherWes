# Air Quality Monitoring Application

This is a full-stack application that displays air quality data from various monitoring locations using the OpenAQ API. The application consists of a FastAPI backend and a React frontend.

## Project Structure

```
.
├── backend/
│   ├── main.py
│   ├── models.py
│   └── config.py
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── LocationList.tsx
    │   │   └── MeasurementList.tsx
    │   ├── App.tsx
    │   └── App.css
    └── package.json
```

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- MongoDB (running locally on default port 27017)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install fastapi uvicorn motor pydantic httpx python-dotenv pydantic-settings
   ```

4. Create a `.env` file in the backend directory:
   ```
   MONGODB_URL=mongodb://localhost:27017
   DB_NAME=air_quality_db
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

The backend will be running at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be running at http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Enter a city name in the search box to find monitoring locations
3. Click on a location to view its latest air quality measurements
4. The measurements will be displayed in cards showing the parameter, value, and timestamp

## API Endpoints

- `GET /api/locations/{city}`: Get monitoring locations for a specific city
- `GET /api/measurements/{location_id}`: Get latest measurements for a specific location

## Technologies Used

- Backend:
  - FastAPI
  - Motor (async MongoDB driver)
  - Pydantic
  - HTTPX

- Frontend:
  - React
  - TypeScript
  - Axios
  - CSS Grid/Flexbox

## Data Storage

The application uses MongoDB to store:
- Location information
- Air quality measurements

Data is automatically saved when fetched from the OpenAQ API.

## Testing

The application includes comprehensive unit and integration tests:

### Running Backend Tests

1. Make sure you have the testing dependencies installed:
   ```bash
   pip install pytest pytest-asyncio httpx pytest-mock pytest-cov mongomock
   ```

2. Run the tests from the backend directory:
   ```bash
   cd backend
   python run_tests.py
   ```

### Backend Tests Coverage

The backend tests cover:

- Data models validation
  - Location model validation 
  - Measurement model validation
  
- API endpoints functionality
  - GET / (root endpoint)
  - GET /api/locations/{city}
  - GET /api/measurements/{location_id}
  
- Utility functions
  - generate_demo_measurements
  - save_debug_info
  - check_openaq_api_params

### Test Architecture

The backend tests use:

- pytest and pytest-asyncio for async testing
- mongomock for MongoDB mocking
- httpx.AsyncClient for testing FastAPI endpoints
- pytest-cov for coverage reports

### Adding More Tests

To add more tests:
1. Create a new test file in the `backend/tests` directory
2. Import the required modules and fixtures
3. Write test functions with the `@pytest.mark.asyncio` decorator for async tests
4. Run the tests with `python run_tests.py`
