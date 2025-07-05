import type { LocationFilter } from '../utils/locationFilterService';
import { getParametersByIds, getCountryNameByCode } from '../utils/locationFilterService';

interface FilterSummaryProps {
  filters: LocationFilter;
  totalLocations: number;
}

const FilterSummary = ({ filters, totalLocations }: FilterSummaryProps) => {
  // Vérifier si des filtres sont appliqués
  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof LocationFilter];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return true;
    if (key === 'excludeUnknown' || key === 'hasRecent') return value === true;
    if (key === 'city' || key === 'country') return !!value && value !== '';
    return false;
  });

  if (!hasActiveFilters) {
    return (
      <div className="my-4 p-4 rounded-lg bg-white shadow-md border border-gray-200 text-sm flex items-center justify-between">
        <span className="font-medium text-gray-900 flex items-center">
          <svg className="w-4 h-4 mr-2 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Affichage de toutes les stations disponibles
        </span>
        <span className="bg-primary-50 text-primary-700 font-medium px-3 py-1 rounded-full text-xs">
          {totalLocations} stations
        </span>
      </div>
    );
  }

  // Créer des badges pour chaque filtre actif
  const renderFilterBadges = () => {
    const badges = [];
    
    // Filtre par ville
    if (filters.city) {
      badges.push(
        <span key="city" className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium shadow-sm">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span className="font-semibold mr-1">Ville:</span> {filters.city}
        </span>
      );
    }
    
    // Filtre par pays
    if (filters.country) {
      const countryName = getCountryNameByCode(filters.country);
      badges.push(
        <span key="country" className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium shadow-sm">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
          </svg>
          <span className="font-semibold mr-1">Pays:</span> {countryName || filters.country}
        </span>
      );
    }
  
    // Polluants
    if (filters.parameters && filters.parameters.length > 0) {
      const parameters = getParametersByIds(filters.parameters);
      if (parameters.length <= 2) {
        badges.push(
          <span key="parameters" className="inline-flex items-center px-3 py-1.5 rounded-full bg-warning-100 text-warning-700 text-sm font-medium shadow-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span className="font-semibold mr-1">Polluants:</span> {parameters.map(p => p.name).join(', ')}
          </span>
        );
      } else {
        badges.push(
          <span key="parameters" className="inline-flex items-center px-3 py-1.5 rounded-full bg-warning-100 text-warning-700 text-sm font-medium shadow-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span className="font-semibold mr-1">Polluants:</span> {parameters.length} sélectionnés
          </span>
        );
      }
    }

    // Mesures récentes
    if (filters.hasRecent) {
      badges.push(
        <span key="recent" className="inline-flex items-center px-3 py-1.5 rounded-full bg-success-100 text-success-700 text-sm font-medium shadow-sm">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Mesures récentes uniquement
        </span>
      );
    }

    // Exclure les inconnus
    if (filters.excludeUnknown) {
      badges.push(
        <span key="exclude" className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-sm font-medium shadow-sm">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Localisations connues uniquement
        </span>
      );
    }

    // Filtre par coordonnées
    if (filters.coordinates) {
      badges.push(
        <span key="coords" className="inline-flex items-center px-3 py-1.5 rounded-full bg-info-100 text-info-700 text-sm font-medium shadow-sm">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
          </svg>
          <span className="font-semibold mr-1">Rayon:</span> {filters.coordinates.radius} km
        </span>
      );
    }

    // Filtre par Bbox
    if (filters.bbox) {
      badges.push(
        <span key="bbox" className="inline-flex items-center px-3 py-1.5 rounded-full bg-info-100 text-info-700 text-sm font-medium shadow-sm">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
          </svg>
          Zone géographique définie
        </span>
      );
    }

    // Limite de résultats
    if (filters.limit && filters.limit !== 50) {
      badges.push(
        <span key="limit" className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium shadow-sm">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
          </svg>
          <span className="font-semibold mr-1">Limite:</span> {filters.limit} résultats
        </span>
      );
    }

    return badges;
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg mb-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-900 flex items-center">
          <svg className="w-4 h-4 mr-2 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span className="text-success-600 font-semibold">{totalLocations}</span> station{totalLocations !== 1 ? 's' : ''} trouvée{totalLocations !== 1 ? 's' : ''}
        </h2>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {renderFilterBadges()}
      </div>
    </div>
  );
};

export default FilterSummary;
