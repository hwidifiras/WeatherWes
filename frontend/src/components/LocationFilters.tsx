import { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Badge,
  Flex,
  useDisclosure,
  Spinner
} from '@chakra-ui/react';
import type { LocationFilter } from '../utils/locationFilterService';
import { countries, parameters } from '../utils/locationFilterService';
import axios from 'axios';

interface LocationFiltersProps {
  onFilterChange: (filters: LocationFilter) => void;
  initialFilters?: LocationFilter;
}

const LocationFilters = ({ onFilterChange, initialFilters = {} }: LocationFiltersProps) => {
  // État pour les filtres
  const [filters, setFilters] = useState<LocationFilter>({
    city: '',
    country: '',
    parameters: [],
    hasRecent: true,
    excludeUnknown: true,
    limit: 50,
    ...initialFilters
  });

  // État pour l'interface utilisateur
  const { open: showAdvancedFilters, onToggle: toggleAdvancedFilters } = useDisclosure();
  const [useCoordinates, setUseCoordinates] = useState(false);
  const [filtersChanged, setFiltersChanged] = useState(false);
  
  // État pour l'autocomplétion de ville
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Chargement des suggestions de villes avec debounce
  useEffect(() => {
    const fetchCitySuggestions = async (searchTerm: string) => {
      if (!searchTerm || searchTerm.length < 2) {
        setCitySuggestions([]);
        return;
      }

      try {
        setIsLoadingSuggestions(true);
        const response = await axios.get(`http://localhost:8000/api/cities/suggest?q=${encodeURIComponent(searchTerm)}`);
        
        if (response.data && Array.isArray(response.data)) {
          setCitySuggestions(response.data.slice(0, 10));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des suggestions:', error);
        setCitySuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    if (suggestionTimeout.current) {
      clearTimeout(suggestionTimeout.current);
    }

    if (filters.city && filters.city.length >= 2) {
      suggestionTimeout.current = setTimeout(() => {
        fetchCitySuggestions(filters.city || '');
      }, 300);
    } else {
      setCitySuggestions([]);
    }

    return () => {
      if (suggestionTimeout.current) {
        clearTimeout(suggestionTimeout.current);
      }
    };
  }, [filters.city]);

  // Gestionnaire de changement de valeur
  const handleFilterChange = <K extends keyof LocationFilter>(
    key: K, 
    value: LocationFilter[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setFiltersChanged(true);
  };

  // Gérer la sélection de paramètres (polluants)
  const handleParameterChange = (parameterId: string, checked: boolean) => {
    const newParameters = checked
      ? [...(filters.parameters || []), parameterId]
      : (filters.parameters || []).filter(id => id !== parameterId);
    
    handleFilterChange('parameters', newParameters);
  };

  // Gérer la sélection de suggestion de ville
  const handleSelectCity = (city: string) => {
    handleFilterChange('city', city);
    setShowSuggestions(false);
  };

  // Toggle les filtres par coordonnées
  const toggleCoordinates = () => {
    setUseCoordinates(prev => {
      if (!prev) {
        // Si on active les coordonnées, initialiser avec la position actuelle
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              handleFilterChange('coordinates', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                radius: 10 // 10km par défaut
              });
            },
            () => {
              // Si l'utilisateur refuse la géolocalisation, utiliser des valeurs par défaut
              handleFilterChange('coordinates', {
                latitude: 48.8566, // Paris
                longitude: 2.3522,
                radius: 10
              });
            }
          );
        }
      } else {
        // Si on désactive les coordonnées, effacer ce filtre
        handleFilterChange('coordinates', undefined);
      }
      return !prev;
    });
  };

  // Soumettre les filtres
  const handleSubmit = () => {
    onFilterChange(filters);
    setFiltersChanged(false);
  };

  // Réinitialiser tous les filtres
  const handleReset = () => {
    const defaultFilters: LocationFilter = {
      city: '',
      country: '',
      parameters: [],
      hasRecent: true,
      excludeUnknown: true,
      limit: 50
    };
    
    setFilters(defaultFilters);
    setUseCoordinates(false);
    onFilterChange(defaultFilters);
    setFiltersChanged(false);
  };

  // Grouper les paramètres par type
  const groupedParameters = parameters.reduce((acc, param) => {
    let group = 'other';
    if (['pm25', 'pm10', 'bc'].includes(param.id)) {
      group = 'particulates';
    } else if (['o3', 'no2', 'so2', 'co', 'no', 'co2', 'nh3', 'ch4'].includes(param.id)) {
      group = 'gases';
    }
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(param);
    return acc;
  }, {} as Record<string, typeof parameters>);

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="sm" border="1px" borderColor="gray.200">
      <VStack gap={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold" color="gray.700">
          Filtres de recherche
        </Text>

        {/* Filtres de base */}
        <HStack gap={4} align="end">
          <Box position="relative" flex="1">
            <Text fontSize="sm" fontWeight="medium" mb={2}>Ville</Text>
            <Box position="relative">
              <Input
                ref={cityInputRef}
                placeholder="Rechercher une ville..."
                value={filters.city || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleFilterChange('city', e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                pr={isLoadingSuggestions ? "40px" : "16px"}
              />
              {isLoadingSuggestions && (
                <Box
                  position="absolute"
                  right="12px"
                  top="50%"
                  transform="translateY(-50%)"
                >
                  <Spinner size="sm" />
                </Box>
              )}
            </Box>
            
            {/* Suggestions de villes */}
            {showSuggestions && citySuggestions.length > 0 && (
              <Box
                position="absolute"
                top="100%"
                left={0}
                right={0}
                bg="white"
                border="1px"
                borderColor="gray.200"
                borderRadius="md"
                boxShadow="lg"
                zIndex={10}
                maxH="200px"
                overflowY="auto"
              >
                {citySuggestions.map((city, index) => (
                  <Box
                    key={index}
                    p={2}
                    cursor="pointer"
                    _hover={{ bg: "gray.50" }}
                    onClick={() => handleSelectCity(city)}
                  >
                    <Text fontSize="sm">{city}</Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Box maxW="200px">
            <Text fontSize="sm" fontWeight="medium" mb={2}>Pays</Text>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: 'white',
                fontSize: '14px'
              }}
              value={filters.country || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('country', e.target.value)}
            >
              <option value="">Tous les pays</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </Box>

          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            disabled={!filtersChanged}
          >
            Rechercher
          </Button>
        </HStack>

        {/* Toggle des filtres avancés */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAdvancedFilters}
        >
          <HStack gap={2}>
            <Text>Filtres avancés</Text>
            <Text>{showAdvancedFilters ? '↑' : '↓'}</Text>
          </HStack>
        </Button>

        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <VStack gap={4} align="stretch" p={4} bg="gray.50" borderRadius="md">
            {/* Options de base */}
            <HStack gap={4} justify="space-between">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={filters.hasRecent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('hasRecent', e.target.checked)}
                />
                <Text fontSize="sm">Données récentes uniquement</Text>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={filters.excludeUnknown}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('excludeUnknown', e.target.checked)}
                />
                <Text fontSize="sm">Exclure les villes inconnues</Text>
              </label>
            </HStack>

            {/* Limite de résultats */}
            <Box maxW="200px">
              <Text fontSize="sm" fontWeight="medium" mb={2}>Nombre de résultats</Text>
              <Input
                type="number"
                min={10}
                max={200}
                value={filters.limit || 50}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('limit', parseInt(e.target.value))}
              />
            </Box>

            {/* Filtres par coordonnées */}
            <VStack align="stretch" gap={2}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={useCoordinates}
                  onChange={toggleCoordinates}
                />
                <Text fontSize="sm">Recherche par position géographique</Text>
              </label>
              
              {useCoordinates && filters.coordinates && (
                <HStack gap={4}>
                  <Box>
                    <Text fontSize="xs" mb={1}>Latitude</Text>
                    <Input
                      type="number"
                      step={0.0001}
                      value={filters.coordinates.latitude}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleFilterChange('coordinates', {
                          ...filters.coordinates!,
                          latitude: parseFloat(e.target.value)
                        })
                      }
                    />
                  </Box>
                  
                  <Box>
                    <Text fontSize="xs" mb={1}>Longitude</Text>
                    <Input
                      type="number"
                      step={0.0001}
                      value={filters.coordinates.longitude}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleFilterChange('coordinates', {
                          ...filters.coordinates!,
                          longitude: parseFloat(e.target.value)
                        })
                      }
                    />
                  </Box>
                  
                  <Box>
                    <Text fontSize="xs" mb={1}>Rayon (km)</Text>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={filters.coordinates.radius}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleFilterChange('coordinates', {
                          ...filters.coordinates!,
                          radius: parseInt(e.target.value)
                        })
                      }
                    />
                  </Box>
                </HStack>
              )}
            </VStack>

            {/* Sélection des polluants */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Polluants mesurés ({(filters.parameters || []).length} sélectionnés)
              </Text>
              
              {Object.entries(groupedParameters).map(([groupName, groupParams]) => (
                <Box key={groupName} mb={3}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1} textTransform="uppercase">
                    {groupName === 'particulates' ? 'Particules' : 
                     groupName === 'gases' ? 'Gaz' : 'Autres'}
                  </Text>
                  <Flex wrap="wrap" gap={2}>
                    {groupParams.map((param) => (
                      <label key={param.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <input
                          type="checkbox"
                          checked={(filters.parameters || []).includes(param.id)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleParameterChange(param.id, e.target.checked)}
                        />
                        <Badge variant="outline" fontSize="xs">
                          {param.name} ({param.id})
                        </Badge>
                      </label>
                    ))}
                  </Flex>
                </Box>
              ))}
            </Box>

            {/* Actions */}
            <HStack justify="space-between">
              <Button size="sm" variant="ghost" onClick={handleReset}>
                Réinitialiser
              </Button>
              
              <Button
                size="sm"
                colorScheme="blue"
                onClick={handleSubmit}
                disabled={!filtersChanged}
              >
                Appliquer les filtres
              </Button>
            </HStack>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default LocationFilters;
