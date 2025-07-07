import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Text,
  Spinner,
  Icon
} from '@chakra-ui/react'
import { FaMapMarkerAlt, FaClock, FaChartBar, FaExclamationTriangle } from 'react-icons/fa'
import axios from 'axios'
import { isFavorite } from '../utils/favoritesService'
import type { LocationFilter } from '../utils/locationFilterService'
import { buildQueryParams } from '../utils/locationFilterService'
import LocationFilters from './LocationFilters'
import FilterSummary from './FilterSummary'
import FavoriteButton from './FavoriteButton'

interface Coordinates {
  latitude: number
  longitude: number
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
  lastUpdated: string | null
  parameters: string[] | null
  measurement_count: number
}

interface LocationListProps {
  onSelectLocation: (locationId: string, locationName: string) => void
}

function LocationList({ onSelectLocation }: LocationListProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [filters, setFilters] = useState<LocationFilter>({
    city: '',
    excludeUnknown: true,
    hasRecent: true,
    limit: 50
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Référence pour l'observateur d'intersection (lazy loading)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fonction memoïsée pour récupérer les emplacements avec les filtres
  const fetchLocations = useCallback(async (currentFilters: LocationFilter, currentPage: number = 1) => {
    try {
      setLoading(true)
      setError('')
      
      // Construire l'URL avec les paramètres de filtrage
      const paginatedFilters = { ...currentFilters, page: currentPage };
      const queryParams = buildQueryParams(paginatedFilters)
      const url = `http://localhost:8000/api/locations${queryParams}`
      
      console.log('Fetching locations with URL:', url)
      
      // Fallback to legacy city-based endpoint if api/locations fails
      let response;
      try {
        response = await axios.get<Location[]>(url)
      } catch (err) {
        console.warn('New API endpoint failed, falling back to legacy endpoint')
        // Fallback to legacy endpoint if city is specified
        if (currentFilters.city) {
          response = await axios.get<Location[]>(`http://localhost:8000/api/cities/${encodeURIComponent(currentFilters.city)}/locations`)
        } else {
          throw err
        }
      }
      
      // Traiter les résultats
      if (response.data) {
        const fetchedLocations = response.data
        
        if (currentPage === 1) {
          setLocations(fetchedLocations)
          setFilteredLocations(fetchedLocations)
        } else {
          // Ajouter les nouveaux résultats aux existants (pour la pagination)
          setLocations(prev => [...prev, ...fetchedLocations])
          setFilteredLocations(prev => [...prev, ...fetchedLocations])
        }
        
        // Vérifier s'il y a plus de résultats à charger
        setHasMoreResults(fetchedLocations.length >= (currentFilters.limit || 50))
        
        // Charger les statuts de favoris
        const favoriteStatuses: Record<string, boolean> = {};
        fetchedLocations.forEach(location => {
          const locationId = location.id.toString();
          favoriteStatuses[locationId] = isFavorite(locationId);
        });
      } else {
        // Pas de données ou format incorrect
        setFilteredLocations([]);
        setError("Aucune donnée disponible ou format incorrect");
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError("Impossible de charger les emplacements. Veuillez réessayer plus tard.");
      setFilteredLocations([]);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, []);
  
  // Charger les emplacements initiaux
  useEffect(() => {
    fetchLocations(filters, 1);
  }, [fetchLocations]);
  
  // Configurer l'observateur d'intersection pour le chargement paresseux
  useEffect(() => {
    // Si observateur déjà créé, le déconnecter
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Créer un nouvel observateur
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && hasMoreResults) {
        handleLoadMore();
      }
    }, { threshold: 0.5 });
    
    // Observer l'élément de chargement s'il existe
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreRef, loading, hasMoreResults]);
  
  // Gérer le changement de filtres - maintenant déclenché par le bouton "Charger" dans LocationFilters
  const handleFilterChange = useCallback((newFilters: LocationFilter) => {
    // Réinitialiser la pagination
    setPage(1);
    setFilters(newFilters);
    // Récupérer immédiatement les données avec les nouveaux filtres
    fetchLocations(newFilters, 1);
  }, [fetchLocations]);
  
  // Charger plus de résultats (pagination)
  const handleLoadMore = () => {
    if (loading) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLocations(filters, nextPage);
  };

  // Formatter une date relative
  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return 'Inconnue';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 60) {
        return `Il y a ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
      } else if (diffMins < 1440) {
        const diffHours = Math.floor(diffMins / 60);
        return `Il y a ${diffHours} heure${diffHours !== 1 ? 's' : ''}`;
      } else {
        const diffDays = Math.floor(diffMins / 1440);
        return `Il y a ${diffDays} jour${diffDays !== 1 ? 's' : ''}`;
      }
    } catch (e) {
      return 'Date invalide';
    }
  };

  return (
    <Box p={4}>
      <Box mb={6}>
        <LocationFilters onFilterChange={handleFilterChange} initialFilters={filters} />
      </Box>
      
      {filteredLocations.length > 0 && (
        <Box mb={4}>
          <FilterSummary totalLocations={locations.length} />
        </Box>
      )}
      
      {loading && isInitialLoad ? (
        <Box>
          {[...Array(3)].map((_, i) => (
            <Box key={i} p={4} borderWidth={1} borderRadius="lg" bg="white" mb={4}>
              <Box display="flex" flexDirection="column" gap={3}>
                <Box h="20px" bg="gray.200" borderRadius="md" />
                <Box h="16px" bg="gray.200" borderRadius="md" w="80%" />
                <Box display="flex" gap={4}>
                  <Box h="16px" bg="gray.200" borderRadius="md" w="80px" />
                  <Box h="16px" bg="gray.200" borderRadius="md" w="120px" />
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      ) : error ? (
        <Box p={4} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg">
          <Box display="flex" alignItems="center" gap={2}>
            <Icon as={FaExclamationTriangle} color="red.500" />
            <Box>
              <Text fontWeight="bold" color="red.700">Erreur de chargement</Text>
              <Text color="red.600">{error}</Text>
            </Box>
          </Box>
        </Box>
      ) : filteredLocations.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Icon as={FaMapMarkerAlt} w={16} h={16} color="gray.300" mb={4} />
          <Text fontSize="lg" fontWeight="semibold" color="gray.600" mb={2}>
            Aucune station trouvée
          </Text>
          <Text color="gray.500">
            Essayez de modifier vos critères de filtrage pour trouver des stations.
          </Text>
        </Box>
      ) : (
        <Box>
          {filteredLocations.map((location) => (
            <Box
              key={location.id}
              p={4}
              borderWidth={1}
              borderRadius="lg"
              bg="white"
              shadow="sm"
              mb={4}
              _hover={{
                shadow: 'md',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s'
              }}
              cursor="pointer"
              onClick={() => onSelectLocation(location.id.toString(), location.name)}
            >
              <Box display="flex" justifyContent="space-between" alignItems="start" gap={4}>
                <Box flex={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                      {location.name}
                    </Text>
                    <FavoriteButton
                      locationId={location.id.toString()}
                      locationName={location.name}
                      locationData={{
                        city: location.city,
                        country: location.country.name,
                        coordinates: location.coordinates
                      }}
                      onStatusChange={() => {
                        // Favorite status change handled internally by FavoriteButton
                      }}
                    />
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={2} color="gray.600" mb={2}>
                    <Icon as={FaMapMarkerAlt} w={4} h={4} />
                    {location.city ? (
                      <Text fontSize="sm">
                        {location.city}, {location.country.name}
                      </Text>
                    ) : (
                      <Text fontSize="sm" color="gray.400">
                        {location.country.name || 'Localisation inconnue'}
                      </Text>
                    )}
                  </Box>
                  
                  <Box display="flex" gap={4} fontSize="sm" color="gray.500">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Icon as={FaClock} w={3} h={3} />
                      <Text title={location.lastUpdated || 'Date inconnue'}>
                        {location.lastUpdated ? formatRelativeDate(location.lastUpdated) : 'Jamais mis à jour'}
                      </Text>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <Icon as={FaChartBar} w={3} h={3} />
                      <Text>{location.parameters?.length || 0} polluants mesurés</Text>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Indicateur de chargement pour pagination */}
      {!isInitialLoad && loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <Spinner size="md" color="blue.500" mr={3} />
          <Text color="gray.600">Chargement...</Text>
        </Box>
      )}

      {/* Élément pour observer l'intersection (load more) */}
      {hasMoreResults && !loading && filteredLocations.length > 0 && (
        <Box ref={loadMoreRef} py={4}>
          <Box h="20px" />
        </Box>
      )}
    </Box>
  );
}

export default LocationList;
