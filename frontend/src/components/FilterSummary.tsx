import type { LocationFilter } from '../utils/locationFilterService';
import { getParametersByIds, getCountryNameByCode } from '../utils/locationFilterService';
import styles from './FilterSummary.module.css';

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
      <div className={styles.noFiltersContainer}>
        <span className={styles.noFiltersText}>
          <svg className={styles.noFiltersIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Affichage de toutes les stations disponibles
        </span>
        <span className={styles.noFiltersBadge}>
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
        <span key="city" className={`${styles.badge} ${styles.badgePrimary}`}>
          <svg className={styles.badgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span className={styles.badgeLabel}>Ville:</span> {filters.city}
        </span>
      );
    }
    
    // Filtre par pays
    if (filters.country) {
      const countryName = getCountryNameByCode(filters.country);
      badges.push(
        <span key="country" className={`${styles.badge} ${styles.badgePrimary}`}>
          <svg className={styles.badgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
          </svg>
          <span className={styles.badgeLabel}>Pays:</span> {countryName || filters.country}
        </span>
      );
    }
  
    // Polluants
    if (filters.parameters && filters.parameters.length > 0) {
      const parameters = getParametersByIds(filters.parameters);
      if (parameters.length <= 2) {
        badges.push(
          <span key="parameters" className={`${styles.badge} ${styles.badgeWarning}`}>
            <svg className={styles.badgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span className={styles.badgeLabel}>Polluants:</span> {parameters.map(p => p.name).join(', ')}
          </span>
        );
      } else {
        badges.push(
          <span key="parameters" className={`${styles.badge} ${styles.badgeWarning}`}>
            <svg className={styles.badgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span className={styles.badgeLabel}>Polluants:</span> {parameters.length} sélectionnés
          </span>
        );
      }
    }

    // Mesures récentes
    if (filters.hasRecent) {
      badges.push(
        <span key="recent" className={`${styles.badge} ${styles.badgeSuccess}`}>
          <svg className={styles.badgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Mesures récentes uniquement
        </span>
      );
    }

    // Exclure les inconnus
    if (filters.excludeUnknown) {
      badges.push(
        <span key="exclude" className={`${styles.badge} ${styles.badgeGray}`}>
          <svg className={styles.badgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Localisations connues uniquement
        </span>
      );
    }

    // Filtre par coordonnées
    if (filters.coordinates) {
      badges.push(
        <span key="coords" className={`${styles.badge} ${styles.badgeInfo}`}>
          <svg className={styles.badgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
          </svg>
          <span className={styles.badgeLabel}>Rayon:</span> {filters.coordinates.radius} km
        </span>
      );
    }

    // Filtre par Bbox
    if (filters.bbox) {
      badges.push(
        <span key="bbox" className={`${styles.badge} ${styles.badgeInfo}`}>
          <svg className={styles.badgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
          </svg>
          Zone géographique définie
        </span>
      );
    }

    // Limite de résultats
    if (filters.limit && filters.limit !== 50) {
      badges.push(
        <span key="limit" className={`${styles.badge} ${styles.badgeGray}`}>
          <svg className={styles.badgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
          </svg>
          <span className={styles.badgeLabel}>Limite:</span> {filters.limit} résultats
        </span>
      );
    }

    return badges;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <svg className={styles.titleIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span className={styles.titleCount}>{totalLocations}</span> station{totalLocations !== 1 ? 's' : ''} trouvée{totalLocations !== 1 ? 's' : ''}
        </h2>
      </div>
      
      <div className={styles.badgeContainer}>
        {renderFilterBadges()}
      </div>
    </div>
  );
};

export default FilterSummary;
