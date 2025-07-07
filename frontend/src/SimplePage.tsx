import { Box, Text } from '@chakra-ui/react';
import ErrorBoundary from './components/ErrorBoundary';

function SimplePage() {
  return (
    <ErrorBoundary>
      <Box p="8" bg="gray.50" minH="100vh">
        <Text fontSize="3xl" fontWeight="bold" mb="4" color="blue.600">
          WeatherWeS Dashboard
        </Text>
        <Text fontSize="lg" color="gray.700">
          Welcome to the Weather Web Service! The Chakra UI components are working.
        </Text>
        
        <Box mt="8" p="6" bg="white" borderRadius="lg" boxShadow="md">
          <Text fontSize="xl" fontWeight="semibold" mb="4">
            System Status
          </Text>
          <Text color="green.600">✅ React is working</Text>
          <Text color="green.600">✅ Chakra UI is working</Text>
          <Text color="green.600">✅ Components are rendering</Text>
        </Box>
      </Box>
    </ErrorBoundary>
  );
}

export default SimplePage;
