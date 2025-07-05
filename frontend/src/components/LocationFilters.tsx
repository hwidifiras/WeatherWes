import { useState, useEffect, useRef } from 'react';
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
          setCitySuggestions(response.data.slice(0, 10)); // Limit to 10 suggestions
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

  // Gérer le changement de champ de saisie générique
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      handleFilterChange(name as keyof LocationFilter, checked as any);
    } else {
      handleFilterChange(name as keyof LocationFilter, value as any);
    }
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

  // Toggle les filtres avancés
  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(prev => !prev);
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

  // Toggle le filtre par bbox (bounding box) - Fonctionnalité à implémenter ultérieurement
  /* Removed unused function toggleBbox */

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
    setShowAdvancedFilters(false);
    onFilterChange(defaultFilters);
    setFiltersChanged(false);
  };

  // Grouper les paramètres par type
  const groupedParameters = parameters.reduce((acc, param) => {
    // Déterminer le groupe en fonction de l'ID du paramètre
    let group = 'other';
    if (['pm25', 'pm10', 'bc'].includes(param.id)) {
      group = 'particulates';
    } else if (['o3', 'no2', 'so2', 'co', 'no', 'co2', 'nh3', 'ch4'].includes(param.id)) {
      group = 'gases';
    }
    
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(param);
    return acc;
  }, {} as Record<string, typeof parameters>);

  // Conversion du groupe en nom lisible
  const getGroupLabel = (group: string): string => {
    switch (group) {
      case 'gases': return 'Gaz';
      case 'particulates': return 'Particules';
      case 'other': return 'Autres';
      default: return group.charAt(0).toUpperCase() + group.slice(1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Filtrer les stations</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset}
            className="text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 py-1.5 px-3 rounded-md text-sm flex items-center transition-colors"
            aria-label="Réinitialiser les filtres"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Réinitialiser
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtre par ville */}
          <div className="relative">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <div className="relative" ref={cityInputRef}>
              <input
                type="text"
                id="city"
                name="city"
                value={filters.city || ''}
                onChange={handleInputChange}
                onFocus={() => filters.city && filters.city.length >= 2 && setShowSuggestions(true)}
                placeholder="Paris, Berlin, New York..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {isLoadingSuggestions && (
                <div className="absolute right-3 top-2">
                  <div className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                </div>
              )}
              
              {/* Liste de suggestions */}
              {showSuggestions && citySuggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {citySuggestions.map((city, index) => (
                    <li
                      key={index}
                      onClick={() => handleSelectCity(city)}
                      className="cursor-pointer text-gray-900 relative select-none py-2 px-4 hover:bg-gray-100"
                    >
                      {city}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Filtre par pays */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Pays
            </label>
            <select
              id="country"
              name="country"
              value={filters.country || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Tous les pays</option>
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 space-y-3">
          {/* Options de filtre basiques */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="excludeUnknown"
              name="excludeUnknown"
              checked={filters.excludeUnknown}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="excludeUnknown" className="ml-2 block text-sm text-gray-700">
              Exclure les localisations inconnues
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasRecent"
              name="hasRecent"
              checked={filters.hasRecent}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="hasRecent" className="ml-2 block text-sm text-gray-700">
              Avec mesures récentes uniquement
            </label>
          </div>
        </div>
        
        {/* Bouton pour afficher/masquer les filtres avancés */}
        <button
          type="button"
          onClick={toggleAdvancedFilters}
          className="mt-4 flex items-center text-sm text-primary-700 hover:text-primary-900 focus:outline-none"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showAdvancedFilters ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}></path>
          </svg>
          {showAdvancedFilters ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'}
        </button>
        
        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Filtre par polluants */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Polluants mesurés</h3>
              <div className="space-y-3">
                {Object.entries(groupedParameters).map(([group, groupParams]) => (
                  <div key={group} className="ml-2">
                    <h4 className="text-sm font-medium text-gray-600 mb-1">{getGroupLabel(group)}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 ml-2">
                      {groupParams.map(param => (
                        <div key={param.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`param-${param.id}`}
                            checked={(filters.parameters || []).includes(param.id)}
                            onChange={(e) => handleParameterChange(param.id, e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`param-${param.id}`} className="ml-2 block text-sm text-gray-700">
                            {param.name} {param.description ? `(${param.description})` : ''}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Filtre par coordonnées */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useCoordinates"
                  checked={useCoordinates}
                  onChange={toggleCoordinates}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="useCoordinates" className="ml-2 block text-sm font-medium text-gray-700">
                  Filtrer par proximité géographique
                </label>
              </div>
              
              {useCoordinates && filters.coordinates && (
                <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <label htmlFor="latitude" className="block text-xs font-medium text-gray-700">
                      Latitude
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      value={filters.coordinates.latitude}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        handleFilterChange('coordinates', {
                          ...filters.coordinates!,
                          latitude: isNaN(value) ? 0 : value
                        });
                      }}
                      className="mt-1 block w-full py-1 px-2 text-sm border border-gray-300 rounded-md"
                      step="0.001"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="longitude" className="block text-xs font-medium text-gray-700">
                      Longitude
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      value={filters.coordinates.longitude}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        handleFilterChange('coordinates', {
                          ...filters.coordinates!,
                          longitude: isNaN(value) ? 0 : value
                        });
                      }}
                      className="mt-1 block w-full py-1 px-2 text-sm border border-gray-300 rounded-md"
                      step="0.001"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="radius" className="block text-xs font-medium text-gray-700">
                      Rayon (km)
                    </label>
                    <input
                      type="number"
                      id="radius"
                      value={filters.coordinates.radius}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        handleFilterChange('coordinates', {
                          ...filters.coordinates!,
                          radius: isNaN(value) ? 1 : Math.max(1, value)
                        });
                      }}
                      min="1"
                      max="500"
                      className="mt-1 block w-full py-1 px-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Filtre par limite de résultats */}
            <div>
              <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre maximum de résultats
              </label>
              <select
                id="limit"
                name="limit"
                value={filters.limit}
                onChange={handleInputChange}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value={10}>10 stations</option>
                <option value={25}>25 stations</option>
                <option value={50}>50 stations</option>
                <option value={100}>100 stations</option>
                <option value={250}>250 stations</option>
                <option value={500}>500 stations</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Bouton pour appliquer les filtres */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            disabled={!filtersChanged}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Charger
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationFilters;
