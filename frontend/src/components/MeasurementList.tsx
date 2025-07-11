import { useState, useEffect } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  Spinner,
  Grid,
  GridItem
} from '@chakra-ui/react'
import { FaChartLine, FaMapMarkerAlt, FaClock, FaThermometerHalf, FaWind, FaSmog } from 'react-icons/fa'
import axios from 'axios'

interface Coordinates {
  latitude: number
  longitude: number
}

interface Measurement {
  location: string
  parameter: string
  value: number
  unit: string
  date: string
  coordinates?: Coordinates
  is_demo?: boolean
}

interface MeasurementSummary {
  parameter: string
  min_value: number
  max_value: number
  avg_value: number
  count: number
  unit: string
  last_updated: string
}

interface Country {
  id: number
  code: string
  name: string
}

interface Location {
  id: number
  name: string
  city: string | null
  locality: string | null
  country: Country
  coordinates: Coordinates
  is_demo_data?: boolean
}

interface LocationResponse {
  location: Location
  measurements: Measurement[]
  summary: MeasurementSummary[]
}

interface MeasurementListProps {
  locationId?: string;
}

const MeasurementList = ({ locationId }: MeasurementListProps) => {
  const [locationData, setLocationData] = useState<LocationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (locationId) {
      fetchMeasurements(locationId);
    }
  }, [locationId]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchMeasurements = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get<LocationResponse>(`${API_BASE_URL}/api/measurements/${id}`);
      setLocationData(response.data);
    } catch (err: any) {
      console.error('Error fetching measurements:', err);
      if (err.code === 'ECONNREFUSED') {
        setError('Le serveur n\'est pas accessible. Veuillez vérifier que le backend est en cours d\'exécution.');
      } else if (err.response?.status === 404) {
        setError('Emplacement non trouvé.');
      } else {
        setError('Impossible de charger les mesures. Veuillez réessayer plus tard.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR');
    } catch (e) {
      return dateString;
    }
  };

  const getParameterIcon = (parameter: string) => {
    const paramLower = parameter.toLowerCase();
    if (paramLower.includes('temp')) return FaThermometerHalf;
    if (paramLower.includes('wind') || paramLower.includes('vent')) return FaWind;
    if (paramLower.includes('pm') || paramLower.includes('no') || paramLower.includes('co')) return FaSmog;
    return FaChartLine;
  };

  const getParameterColor = (parameter: string) => {
    const paramLower = parameter.toLowerCase();
    if (paramLower.includes('pm2.5')) return 'red';
    if (paramLower.includes('pm10')) return 'orange';
    if (paramLower.includes('no2')) return 'purple';
    if (paramLower.includes('o3')) return 'blue';
    if (paramLower.includes('co')) return 'gray';
    return 'green';
  };

  if (!locationId) {
    return (
      <Box p={4} textAlign="center">
        <Icon as={FaMapMarkerAlt} w={12} h={12} color="gray.300" mb={4} />
        <Text fontSize="lg" color="gray.500">
          Sélectionnez une station pour voir ses mesures
        </Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="lg" color="blue.500" mb={4} />
        <Text color="gray.600">Chargement des mesures...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Box p={4} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg">
          <HStack>
            <Icon as={FaChartLine} color="red.500" />
            <Text color="red.700">{error}</Text>
          </HStack>
        </Box>
      </Box>
    );
  }

  if (!locationData) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.500">Aucune donnée disponible</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      {/* Informations sur la station */}
      <Box mb={6} p={4} bg="white" borderRadius="lg" shadow="sm" borderWidth={1}>
        <VStack align="start" gap={2}>
          <HStack justify="space-between" w="full">
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              {locationData.location.name}
            </Text>
            {locationData.location.is_demo_data && (
              <Badge colorScheme="orange">Données de démonstration</Badge>
            )}
          </HStack>
          
          <HStack gap={2} color="gray.600">
            <Icon as={FaMapMarkerAlt} />
            <Text fontSize="sm">
              {locationData.location.city 
                ? `${locationData.location.city}, ${locationData.location.country.name}`
                : locationData.location.country.name
              }
            </Text>
          </HStack>

          <HStack gap={2} color="gray.500" fontSize="sm">
            <Text>
              Coordonnées: {locationData.location.coordinates.latitude.toFixed(4)}, {locationData.location.coordinates.longitude.toFixed(4)}
            </Text>
          </HStack>
        </VStack>
      </Box>

      {/* Résumé des mesures */}
      {locationData.summary && locationData.summary.length > 0 && (
        <Box mb={6}>
          <Text fontSize="lg" fontWeight="semibold" mb={4}>Résumé des mesures</Text>
          <Grid templateColumns={{ 
            base: "1fr",                    // Mobile: 1 card per row
            md: "repeat(2, 1fr)",           // Tablet: 2 cards per row
            lg: "repeat(3, 1fr)"            // Desktop: 3 cards per row
          }} gap={4}>
            {locationData.summary.map((summary, index) => (
              <GridItem key={index}>
                <Box p={4} bg="white" borderRadius="lg" shadow="sm" borderWidth={1}>
                  <VStack align="start" gap={2}>
                    <HStack mb={2}>
                      <Icon 
                        as={getParameterIcon(summary.parameter)} 
                        color={`${getParameterColor(summary.parameter)}.500`}
                      />
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">
                        {summary.parameter}
                      </Text>
                    </HStack>
                    <Text fontSize="lg" fontWeight="bold" color={`${getParameterColor(summary.parameter)}.600`}>
                      {summary.avg_value.toFixed(1)} {summary.unit}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Min: {summary.min_value} | Max: {summary.max_value}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {summary.count} mesures
                    </Text>
                  </VStack>
                </Box>
              </GridItem>
            ))}
          </Grid>
        </Box>
      )}

      {/* Liste des mesures */}
      {locationData.measurements && locationData.measurements.length > 0 ? (
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={4}>Mesures récentes</Text>
          <VStack gap={2} align="stretch">
            {locationData.measurements.slice(0, 50).map((measurement, index) => (
              <Box 
                key={index} 
                p={3} 
                bg="white" 
                borderRadius="md" 
                borderWidth={1} 
                _hover={{ bg: 'gray.50' }}
              >
                <Grid templateColumns="1fr 100px 80px 200px" gap={4} alignItems="center">
                  <HStack>
                    <Icon 
                      as={getParameterIcon(measurement.parameter)} 
                      color={`${getParameterColor(measurement.parameter)}.500`}
                      w={4} h={4}
                    />
                    <Text fontWeight="medium">{measurement.parameter}</Text>
                    {measurement.is_demo && (
                      <Badge size="sm" colorScheme="orange">Demo</Badge>
                    )}
                  </HStack>
                  
                  <Text fontWeight="bold" textAlign="right">
                    {measurement.value}
                  </Text>
                  
                  <Badge variant="outline" colorScheme={getParameterColor(measurement.parameter)}>
                    {measurement.unit}
                  </Badge>
                  
                  <HStack color="gray.600" fontSize="sm">
                    <Icon as={FaClock} w={3} h={3} />
                    <Text>{formatDate(measurement.date)}</Text>
                  </HStack>
                </Grid>
              </Box>
            ))}
          </VStack>
          
          {locationData.measurements.length > 50 && (
            <Text fontSize="sm" color="gray.500" mt={4} textAlign="center">
              Affichage de 50 mesures sur {locationData.measurements.length} disponibles
            </Text>
          )}
        </Box>
      ) : (
        <Box textAlign="center" py={8}>
          <Icon as={FaChartLine} w={12} h={12} color="gray.300" mb={4} />
          <Text fontSize="lg" color="gray.500" mb={2}>
            Aucune mesure disponible
          </Text>
          <Text fontSize="sm" color="gray.400">
            Cette station n'a pas encore de données de mesure.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default MeasurementList;
