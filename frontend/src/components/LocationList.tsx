import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { addToFavorites, isFavorite, removeFromFavorites } from '../utils/favoritesService'
import type { LocationFilter } from '../utils/locationFilterService'
import { buildQueryParams } from '../utils/locationFilterService'
import LocationFilters from './LocationFilters'
import FilterSummary from './FilterSummary'

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
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
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
        
        setFavoriteStatus(prev => ({ ...prev, ...favoriteStatuses }));
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

  // Gérer les favoris
  const handleToggleFavorite = (location: Location) => {
    const locationId = location.id.toString();
    const isCurrentlyFavorite = favoriteStatus[locationId] || false;
    let success = false;
    
    if (isCurrentlyFavorite) {
      success = removeFromFavorites(locationId);
      if (success) {
        setToastMessage(`${location.name} retiré des favoris`);
      }
    } else {
      const favoriteLocation = {
        id: locationId,
        name: location.name,
        city: location.city,
        country: location.country.name,
        coordinates: location.coordinates,
        addedAt: Date.now()
      };
      
      success = addToFavorites(favoriteLocation);
      if (success) {
        setToastMessage(`${location.name} ajouté aux favoris`);
      }
    }
    
    if (success) {
      // Mettre à jour le statut local
      setFavoriteStatus(prev => ({
        ...prev,
        [locationId]: !isCurrentlyFavorite
      }));
      
      // Afficher le toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
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
    <div className="w-full h-full flex flex-col">
      <div className="px-4 pb-6 sm:px-6">
        <LocationFilters onFilterChange={handleFilterChange} initialFilters={filters} />
      </div>
      
      {filteredLocations.length > 0 && (
        <div className="px-4 pb-5 sm:px-6">
          <FilterSummary filters={filters} totalLocations={locations.length} />
        </div>
      )}
      
      {loading && isInitialLoad ? (
        <div className="mx-4 mb-6 space-y-4 sm:mx-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-36 bg-surface-hover rounded-lg shadow-sm overflow-hidden">
                <div className="h-8 w-2/3 bg-gray-200 mx-4 my-4 rounded"></div>
                <div className="h-5 w-1/3 bg-gray-200 mx-4 mb-3 rounded"></div>
                <div className="flex justify-between px-4">
                  <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
                  <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mx-4 mb-6 sm:mx-6 p-5 bg-error-100 border border-error text-error-600 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="font-medium">Erreur de chargement</h3>
          </div>
          <p>{error}</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="mx-4 mb-6 sm:mx-6 p-10 bg-gray-100/30 border border-gray-200 rounded-lg text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
          </svg>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune station trouvée</h3>
          <p className="text-gray-600">Essayez de modifier vos critères de filtrage pour trouver des stations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mx-4 mb-6 sm:mx-6">
          {filteredLocations.map((location) => (
            <div
              key={location.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-all overflow-hidden"
            >
              <div 
                className="p-5 cursor-pointer"
                onClick={() => onSelectLocation(location.id.toString(), location.name)}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <h3 className="text-lg font-medium text-gray-900 line-clamp-2">{location.name}</h3>
                  <button 
                    className="ml-2 flex-shrink-0 text-gray-500 hover:text-amber-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(location);
                    }}
                    aria-label={favoriteStatus[location.id.toString()] ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <svg className="w-5 h-5" fill={favoriteStatus[location.id.toString()] ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-1.5 text-gray-600 text-sm">
                    <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {location.city ? (
                      <>
                        <span>{location.city}, {location.country.name}</span>
                      </>
                    ) : location.country ? (
                      <span>{location.country.name}</span>
                    ) : (
                      <span className="text-gray-400 italic">Localisation inconnue</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-between mt-auto">
                  <div className="flex items-center text-sm text-gray-600 mr-4">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <span title={location.lastUpdated || 'Date inconnue'}>
                      {location.lastUpdated ? formatRelativeDate(location.lastUpdated) : 'Jamais mis à jour'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <span>{location.parameters?.length || 0} polluants mesurés</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indicateur de chargement pour pagination */}
      {!isInitialLoad && loading && (
        <div className="flex justify-center items-center p-6">
          <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Chargement...</span>
        </div>
      )}

      {/* Élément pour observer l'intersection (load more) */}
      {hasMoreResults && !loading && filteredLocations.length > 0 && (
        <div ref={loadMoreRef} className="h-10 flex justify-center items-center p-6">
          <div className="w-8 h-8 border-2 border-primary-600 border-opacity-20 rounded-full"></div>
        </div>
      )}
      
      {/* Toast notification */}
      <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-lg shadow-lg py-3 px-5 text-white z-50 transition-opacity duration-300 ${showToast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {toastMessage}
      </div>
    </div>
  );
}

export default LocationList;
