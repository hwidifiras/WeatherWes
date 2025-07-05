# Frontend Testing

This document describes how to run and write tests for the frontend React application.

## Setting Up the Test Environment

The frontend uses:
- Jest for test running and assertions
- React Testing Library for component testing
- MSW (Mock Service Worker) for API mocking

## Running the Tests

To run the frontend tests:

```bash
cd frontend
npm test
```

To run tests with coverage:

```bash
npm test -- --coverage
```

## Test Structure

### Component Tests

Component tests are located in `src/components/__tests__/` directory, with filenames matching the component they test (e.g., `LocationList.test.tsx`).

Example component test:

```tsx
import { render, screen } from '@testing-library/react';
import LocationList from '../LocationList';

describe('LocationList', () => {
  test('renders loading state correctly', () => {
    render(<LocationList isLoading={true} locations={[]} onSelectLocation={jest.fn()} />);
    expect(screen.getByText(/loading locations/i)).toBeInTheDocument();
  });

  test('renders empty state correctly', () => {
    render(<LocationList isLoading={false} locations={[]} onSelectLocation={jest.fn()} />);
    expect(screen.getByText(/no locations found/i)).toBeInTheDocument();
  });

  test('renders location list correctly', () => {
    const mockLocations = [
      { id: '1', name: 'Test Station 1', city: 'Test City 1', country: { name: 'Test Country' } },
      { id: '2', name: 'Test Station 2', city: 'Test City 2', country: { name: 'Test Country' } }
    ];
    
    render(<LocationList isLoading={false} locations={mockLocations} onSelectLocation={jest.fn()} />);
    
    expect(screen.getByText('Test Station 1')).toBeInTheDocument();
    expect(screen.getByText('Test Station 2')).toBeInTheDocument();
  });
});
```

### API Mocking

We use MSW (Mock Service Worker) to mock API calls. Setup is in `src/mocks/`:

```tsx
// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('http://localhost:8000/api/locations/:city', (req, res, ctx) => {
    const city = req.params.city;
    return res(
      ctx.json([
        {
          id: '123',
          name: 'Test Station',
          city: city,
          country: { name: 'Test Country', code: 'TC' },
          coordinates: { latitude: 0, longitude: 0 }
        }
      ])
    );
  }),

  rest.get('http://localhost:8000/api/measurements/:locationId', (req, res, ctx) => {
    return res(
      ctx.json({
        location: {
          id: req.params.locationId,
          name: 'Test Station',
          city: 'Test City',
          country: { name: 'Test Country', code: 'TC' }
        },
        measurements: [
          {
            parameter: 'pm25',
            value: 15.0,
            unit: 'µg/m³',
            date: new Date().toISOString()
          }
        ]
      })
    );
  })
];
```

## Writing New Tests

1. Create a test file in `src/components/__tests__/` for component tests
2. Import the necessary testing utilities and components
3. Write test cases using the describe/test syntax
4. Use React Testing Library queries to find elements
5. Add assertions to verify component behavior
