import { useState, useEffect, useRef } from 'react';
import type { LocationFilter } from '../utils/locationFilterService';
import { countries, parameters } from '../utils/locationFilterService';
import axios from 'axios';
import styles from './LocationFilters.module.css';

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
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Filtrer les stations</h2>
        <div className={styles.headerActions}>
          <button 
            onClick={handleReset}
            className={styles.resetButton}
            aria-label="Réinitialiser les filtres"
          >
            <svg className={styles.resetIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Réinitialiser
          </button>
        </div>
      </div>
      
      <div className={styles.form}>
        <div className={styles.formGrid}>
          {/* Filtre par ville */}
          <div className={styles.inputGroup}>
            <label htmlFor="city" className={styles.label}>
              Ville
            </label>
            <div className={styles.inputContainer} ref={cityInputRef}>
              <input
                type="text"
                id="city"
                name="city"
                value={filters.city || ''}
                onChange={handleInputChange}
                onFocus={() => filters.city && filters.city.length >= 2 && setShowSuggestions(true)}
                placeholder="Paris, Berlin, New York..."
                className={styles.input}
              />
              {isLoadingSuggestions && (
                <div className={styles.loadingSpinner}>
                  <div className={styles.spinner}></div>
                </div>
              )}
              
              {/* Liste de suggestions */}
              {showSuggestions && citySuggestions.length > 0 && (
                <ul className={styles.suggestionsList}>
                  {citySuggestions.map((city, index) => (
                    <li
                      key={index}
                      onClick={() => handleSelectCity(city)}
                      className={styles.suggestionItem}
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
            <label htmlFor="country" className={styles.label}>
              Pays
            </label>
            <select
              id="country"
              name="country"
              value={filters.country || ''}
              onChange={handleInputChange}
              className={styles.select}
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
        
        <div className={styles.checkboxGroup}>
          {/* Options de filtre basiques */}
          <div className={styles.checkboxItem}>
            <input
              type="checkbox"
              id="excludeUnknown"
              name="excludeUnknown"
              checked={filters.excludeUnknown}
              onChange={handleInputChange}
              className={styles.checkboxInput}
            />
            <label htmlFor="excludeUnknown" className={styles.checkboxLabel}>
              Exclure les localisations inconnues
            </label>
          </div>
          
          <div className={styles.checkboxItem}>
            <input
              type="checkbox"
              id="hasRecent"
              name="hasRecent"
              checked={filters.hasRecent}
              onChange={handleInputChange}
              className={styles.checkboxInput}
            />
            <label htmlFor="hasRecent" className={styles.checkboxLabel}>
              Avec mesures récentes uniquement
            </label>
          </div>
        </div>
        
        {/* Bouton pour afficher/masquer les filtres avancés */}
        <button
          type="button"
          onClick={toggleAdvancedFilters}
          className={styles.collapsibleButton}
        >
          <svg className={styles.collapsibleIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showAdvancedFilters ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}></path>
          </svg>
          {showAdvancedFilters ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'}
        </button>
        
        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <div className={styles.advancedFilters}>
            {/* Filtre par polluants */}
            <div className={styles.filtersSection}>
              <h3 className={styles.filtersTitle}>Polluants mesurés</h3>
              <div className={styles.checkboxGroup}>
                {Object.entries(groupedParameters).map(([group, groupParams]) => (
                  <div key={group} className={styles.filterGroup}>
                    <h4 className={styles.filterGroupTitle}>{getGroupLabel(group)}</h4>
                    <div className={styles.parameterGrid}>
                      {groupParams.map(param => (
                        <div key={param.id} className={styles.parameterItem}>
                          <input
                            type="checkbox"
                            id={`param-${param.id}`}
                            checked={(filters.parameters || []).includes(param.id)}
                            onChange={(e) => handleParameterChange(param.id, e.target.checked)}
                            className={styles.parameterCheckbox}
                          />
                          <label htmlFor={`param-${param.id}`} className={styles.checkboxLabel}>
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
            <div className={styles.checkboxGroup}>
              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id="useCoordinates"
                  checked={useCoordinates}
                  onChange={toggleCoordinates}
                  className={styles.checkboxInput}
                />
                <label htmlFor="useCoordinates" className={styles.checkboxLabel}>
                  Filtrer par proximité géographique
                </label>
              </div>
              
              {useCoordinates && filters.coordinates && (
                <div className={styles.coordinatesSection}>
                  <div>
                    <label htmlFor="latitude" className={styles.label}>
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
                      className={styles.input}
                      step="0.001"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="longitude" className={styles.label}>
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
                      className={styles.input}
                      step="0.001"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="radius" className={styles.label}>
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
                      className={styles.input}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Filtre par limite de résultats */}
            <div>
              <label htmlFor="limit" className={styles.label}>
                Nombre maximum de résultats
              </label>
              <select
                id="limit"
                name="limit"
                value={filters.limit}
                onChange={handleInputChange}
                className={styles.select}
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
        <div className={styles.actionButtons}>
          <button
            type="button"
            onClick={handleSubmit}
            className={`${styles.button} ${styles.primaryButton}`}
            disabled={!filtersChanged}
          >
            <svg className={styles.w5h5} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
