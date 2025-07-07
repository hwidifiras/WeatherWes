import { Box, VStack, Text, Grid, ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import ChakraLayout from './components/ChakraLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Create the system for Chakra UI v3
const system = createSystem(defaultConfig);

// Import existing components
import LocationList from './components/LocationList';
import FavoritesList from './components/NewFavoritesList';
import MeasurementList from './components/MeasurementList';
import FilterSummary from './components/FilterSummary';

// Import new Chakra components
import Card from './components/Card';
import StatsGrid from './components/StatsGrid';
import SimpleChart from './components/SimpleChart';

// Icons
import { IoLocation, IoHeart, IoStatsChart, IoThermometer } from 'react-icons/io5';

// Dashboard component
function Dashboard() {
  const navigate = useNavigate();
  
  const handleSelectLocation = (locationId: string, locationName: string) => {
    console.log('Selected location:', locationId, locationName);
    navigate(`/measurements/${locationId}`);
  };

  const mockFilters = {
    country: '',
    city: '',
    parameter: '',
  };

  // Mock statistics data
  const statsData = [
    {
      label: 'Total Locations',
      value: '24',
      icon: IoLocation,
      color: 'blue.500',
      change: '+12%',
      trend: 'up' as const,
    },
    {
      label: 'Favorite Locations',
      value: '8',
      icon: IoHeart,
      color: 'red.500',
      change: '+2',
      trend: 'up' as const,
    },
    {
      label: 'Latest Measurements',
      value: '156',
      icon: IoStatsChart,
      color: 'green.500',
      change: '+45',
      trend: 'up' as const,
    },
    {
      label: 'Air Quality Index',
      value: '42',
      icon: IoThermometer,
      color: 'yellow.500',
      change: '-5%',
      trend: 'down' as const,
    },
  ];

  // Mock chart data
  const chartData = [
    { name: 'PM2.5', value: 45 },
    { name: 'PM10', value: 32 },
    { name: 'NO2', value: 28 },
    { name: 'O3', value: 56 },
    { name: 'CO', value: 12 },
    { name: 'SO2', value: 8 },
  ];

  return (
    <VStack gap="6" align="stretch">
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb="6">
          Air Quality Dashboard
        </Text>
        
        <Grid 
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
          gap="6"
          mb="8"
        >
          {statsData.map((stat, index) => (
            <Card key={index}>
              <StatsGrid stats={[stat]} />
            </Card>
          ))}
        </Grid>
      </Box>

      <Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap="6">
        <Card>
          <SimpleChart 
            data={chartData} 
            title="Air Quality Parameters" 
            height="300px"
            color="blue.500"
          />
        </Card>
        
        <Card>
          <FilterSummary filters={mockFilters} totalLocations={24} />
        </Card>
      </Grid>

      <Card>
        <Text fontSize="lg" fontWeight="semibold" mb="4">
          Recent Locations
        </Text>
        <LocationList onSelectLocation={handleSelectLocation} />
      </Card>
    </VStack>
  );
}

// Favorites page
function FavoritesPage() {
  return (
    <VStack gap="6" align="stretch">
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb="6">
          Favorite Locations
        </Text>
      </Box>
      
      <Card>
        <FavoritesList />
      </Card>
    </VStack>
  );
}

// Measurements page  
function MeasurementsPage() {
  const { locationId } = useParams();
  
  return (
    <VStack gap="6" align="stretch">
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb="6">
          Air Quality Measurements
        </Text>
      </Box>
      
      <Card>
        <MeasurementList locationId={locationId} />
      </Card>
    </VStack>
  );
}

// Locations page
function LocationsPage() {
  const navigate = useNavigate();
  
  const handleSelectLocation = (locationId: string, locationName: string) => {
    console.log('Selected location:', locationId, locationName);
    navigate(`/measurements/${locationId}`);
  };

  return (
    <VStack gap="6" align="stretch">
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb="6">
          All Locations
        </Text>
      </Box>
      
      <Card>
        <LocationList onSelectLocation={handleSelectLocation} />
      </Card>
    </VStack>
  );
}

// Settings page
function SettingsPage() {
  return (
    <VStack gap="6" align="stretch">
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb="6">
          Settings
        </Text>
      </Box>
      
      <Card>
        <Text mb="4">Application Settings</Text>
        <Text color="gray.600">
          Configuration options and preferences will be available here.
        </Text>
      </Card>
    </VStack>
  );
}

function SimpleChakraApp() {
  return (
    <ErrorBoundary>
      <ChakraProvider value={system}>
        <Router>
          <ChakraLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/measurements/:locationId?" element={<MeasurementsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </ChakraLayout>
        </Router>
      </ChakraProvider>
    </ErrorBoundary>
  );
}

export default SimpleChakraApp;
