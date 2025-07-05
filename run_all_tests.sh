#!/bin/bash
echo "Running WeatherWeS Tests"

echo
echo "=== Running Backend Tests ==="
cd backend
python run_tests.py
cd ..

echo
echo "=== Running Frontend Tests ==="
cd frontend
npm test -- --watchAll=false
cd ..

echo
echo "Tests completed!"
