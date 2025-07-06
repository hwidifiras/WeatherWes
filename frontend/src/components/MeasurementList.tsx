import { useState, useEffect } from 'react'
import axios from 'axios'
import { isValidLocationId, normalizeLocationId, handleLocationError } from '../utils/locationUtils'
import { addToFavorites, isFavorite, removeFromFavorites } from '../utils/favoritesService'
import styles from './MeasurementList.module.css'

// Interfaces types (inchangés)
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
  is_demo?: boolean // Indiquer si c'est une mesure de démo
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
  is_demo_data?: boolean // Indiquer si les données de la station sont des démos
}

interface LocationResponse {
  location: Location
  measurements: Measurement[]
  measurements_summary: MeasurementSummary[]
}

interface MeasurementListProps {
  locationId: string
}

function MeasurementList({ locationId }: MeasurementListProps) {
  const [data, setData] = useState<LocationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [apiStatus, setApiStatus] = useState<'ok' | 'error' | 'no-data'>('ok')
  const [isDemoData, setIsDemoData] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    // Vérifier si la station est déjà dans les favoris
    if (locationId) {
      setIsFavorited(isFavorite(locationId));
    }
    
    const fetchMeasurements = async () => {
      try {
        // Vérifier si l'ID est valide avant d'envoyer la requête
        if (!isValidLocationId(locationId)) {
          setError('Identifiant de station invalide')
          console.error('Invalid location ID:', locationId)
          setLoading(false)
          setApiStatus('error')
          return
        }

        const normalizedId = normalizeLocationId(locationId)
        console.log(`Fetching measurements for normalized ID: ${normalizedId}`)
        
        setLoading(true)
        setError('')
        setApiStatus('ok')
        
        try {
          const response = await axios.get<LocationResponse>(
            `http://localhost:8000/api/measurements/${normalizedId}`
          )
          
          setData(response.data)
          
          // Log pour vérifier les données reçues
          console.log('Measurements data:', response.data)
          
          // Vérifier si des mesures sont des démos
          const hasDemoData = 
            response.data.location?.is_demo_data || 
            response.data.measurements?.some(m => m.is_demo === true);
          
          setIsDemoData(hasDemoData);
          
          // Vérifier si des mesures ont été retournées
          if (response.data.measurements && response.data.measurements.length === 0) {
            console.warn('No measurements found for this location')
            setApiStatus('no-data')
          }
        } catch (err: any) {
          // Gérer spécifiquement les erreurs 404
          if (err?.response?.status === 404) {
            console.log('Station not found error:', err.response.data)
            setApiStatus('no-data')
            
            // Garder la référence à la station même si pas de mesures
            // Pour permettre l'affichage des informations de base
            try {
              // Récupérer au moins les infos de base sur la station
              const stationResponse = await axios.get<Location[]>
                (`http://localhost:8000/api/locations/${locationId}`
              )
              
              if (stationResponse.data && Array.isArray(stationResponse.data) && stationResponse.data.length > 0) {
                const station = stationResponse.data.find((loc: Location) => 
                  String(loc.id) === String(normalizedId) || loc.name.includes(String(normalizedId))
                )
                
                if (station) {
                  setData({
                    location: station,
                    measurements: [],
                    measurements_summary: []
                  })
                  
                  // Message d'erreur plus spécifique
                  setError('Aucune mesure disponible pour cette station')
                  return
                }
              }
            } catch (stationError) {
              console.error('Failed to fetch station details:', stationError)
            }
          }
          
          // Utiliser notre utilitaire pour générer un message d'erreur convivial
          const errorMessage = handleLocationError(err)
          setError(errorMessage)
          setApiStatus('error')
          
          // Log détaillé pour le débogage
          console.error('Error fetching measurements:', {
            locationId,
            error: err,
            response: err?.response?.data,
            status: err?.response?.status
          })
        }
      } catch (generalError: any) {
        setError('Erreur inattendue lors du chargement des mesures')
        setApiStatus('error')
        console.error('General error:', generalError)
      } finally {
        setLoading(false)
      }
    }

    if (locationId) {
      fetchMeasurements()
    }
  }, [locationId])

  const handleRefresh = () => {
    if (locationId) {
      setLoading(true)
      fetch(`http://localhost:8000/api/measurements/${locationId}?force_refresh=true`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.json()
        })
        .then(data => {
          setData(data)
          setApiStatus(data.measurements && data.measurements.length > 0 ? 'ok' : 'no-data')
          setError('')
        })
        .catch(err => {
          setError(`Erreur de rafraîchissement: ${err.message}`)
          setApiStatus('error')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  const handleDebugStation = () => {
    if (locationId) {
      window.open(`http://localhost:8000/api/debug/openaq/${locationId}`, '_blank')
    }
  }
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Chargement des mesures...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <div className={styles.errorTitle}>Erreur lors de la récupération des données</div>
        <div className={styles.errorMessage}>{error}</div>
        <div className={styles.errorDescription}>
          Veuillez réessayer avec une autre station ou contacter le support si le problème persiste.
        </div>
        <div className={styles.errorActions}>
          <button 
            onClick={handleRefresh} 
            disabled={loading}
            className={styles.errorButton}
          >
            <svg className={styles.errorButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Réessayer
          </button>
          <button 
            onClick={handleDebugStation} 
            className={styles.errorButtonSecondary}
          >
            <svg className={styles.errorButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"></path>
            </svg>
            Diagnostiquer l'API
          </button>
        </div>
      </div>
    );
  }
  
  if (!data) return null

  const { location, measurements, measurements_summary } = data
  
  // Vérifier si nous avons des mesures à afficher
  const hasMeasurements = measurements && measurements.length > 0
  const hasSummaries = measurements_summary && measurements_summary.length > 0
  
  // Si aucune mesure n'est disponible, afficher un message convivial
  if (!hasMeasurements && !hasSummaries) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.locationTitle}>{location.name}</h3>
          <p className={styles.locationSubtitle}>{location.city || location.locality || "Unknown Location"}, {location.country.name}</p>
        </div>
        <div className={styles.noDataContainer}>
          <p className={styles.noDataTitle}>Aucune donnée de mesure n'est disponible pour cette station.</p>
          <p className={styles.noDataInfo}>ID de la station: {location.id}</p>
          <p className={styles.noDataInfo}>Coordonnées: {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}</p>
          
          <div className={styles.noDataDetails}>
            <p className={styles.noDataDetailsTitle}>Cette station pourrait être:</p>
            <ul className={styles.noDataList}>
              <li className={styles.noDataListItem}>Temporairement hors service</li>
              <li className={styles.noDataListItem}>Ne pas avoir transmis de données récentes</li>
              <li className={styles.noDataListItem}>Ne plus être référencée par OpenAQ</li>
            </ul>
            <p className={styles.noDataAdvice}>Essayez de sélectionner une autre station.</p>
          </div>
          
          <div className={styles.noDataActions}>
            <button 
              onClick={handleRefresh} 
              className={styles.errorButton} 
              disabled={loading}
            >
              Forcer le rafraîchissement
            </button>
            <button 
              onClick={handleDebugStation} 
              className={styles.errorButtonSecondary}
            >
              Diagnostiquer l'API
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fonction pour gérer l'ajout/suppression des favoris
  const handleToggleFavorite = () => {
    if (!data?.location) return;
    
    const location = data.location;
    const locationId = String(location.id);
    
    if (isFavorited) {
      // Supprimer des favoris
      const success = removeFromFavorites(locationId);
      if (success) {
        setIsFavorited(false);
        setToastMessage(`${location.name} retiré des favoris`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } else {
      // Ajouter aux favoris
      const favoriteLocation = {
        id: locationId,
        name: location.name,
        city: location.city,
        country: location.country.name,
        coordinates: location.coordinates,
        addedAt: Date.now()
      };
      
      const success = addToFavorites(favoriteLocation);
      if (success) {
        setIsFavorited(true);
        setToastMessage(`${location.name} ajouté aux favoris`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.locationHeader}>
        <div className={styles.locationInfo}>
          <h3 className={styles.locationName}>{location.name}</h3>
          <div className={styles.locationDetails}>
            <p>{location.city || location.locality || "Unknown Location"}, {location.country.name}</p>
            <span className={styles.dateBadge}>
              {new Date().toLocaleDateString()} 
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleToggleFavorite}
          className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : styles.notFavorited}`}
          aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
          title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <svg className={styles.favoriteIcon} fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            {isFavorited 
              ? <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1" strokeWidth="0"/> 
              : <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
            }
          </svg>
          <span>{isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}</span>
        </button>
      </div>

      {isDemoData && (
        <div className={styles.warningMessage}>
          <span className={styles.warningIcon}>⚠️</span> 
          <span>Les données affichées proviennent d'une source de démonstration et peuvent ne pas être à jour.</span>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${!showSummary ? styles.active : styles.inactive}`}
            onClick={() => setShowSummary(false)}
          >
            Dernières mesures
          </button>
          <button
            className={`${styles.tabButton} ${showSummary ? styles.active : styles.inactive}`}
            onClick={() => setShowSummary(true)}
          >
            Résumé
          </button>
        </div>
        
        {/* Status indicator - utilise apiStatus pour éviter l'erreur "déclaré mais jamais lu" */}
        <div className={styles.statusIndicator}>
          <span 
            className={`${styles.statusBadge} ${
              apiStatus === 'ok' ? styles.ok : 
              apiStatus === 'no-data' ? styles.noData : 
              styles.error
            }`}
          >
            <span className={`${styles.statusDot} ${
              apiStatus === 'ok' ? styles.ok : 
              apiStatus === 'no-data' ? styles.noData : 
              styles.error
            }`}></span>
            {apiStatus === 'ok' ? 'Données disponibles' : 
             apiStatus === 'no-data' ? 'Aucune donnée' : 
             'Erreur'}
          </span>
        </div>
      </div>

      {showSummary ? (
        <div className={styles.summaryGrid}>
          {measurements_summary?.map((summary) => (
            <div key={summary.parameter} className={styles.card}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>{summary.parameter.toUpperCase()}</h4>
                <div className={styles.cardUnit}>
                  {summary.unit}
                </div>
              </div>
              <div className={styles.summaryStats}>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Moyenne:</span>
                  <span className={styles.statValue}>{summary.avg_value.toFixed(2)} {summary.unit}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Min:</span>
                  <span className={styles.statValue}>{summary.min_value.toFixed(2)} {summary.unit}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Max:</span>
                  <span className={styles.statValue}>{summary.max_value.toFixed(2)} {summary.unit}</span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Mesures:</span>
                  <span className={styles.statValue}>{summary.count}</span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                Dernière mise à jour: {new Date(summary.last_updated).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.measurementsGrid}>
          {measurements?.map((measurement, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.cardHeader}>
                <h4 className={styles.cardTitle}>{measurement.parameter.toUpperCase()}</h4>
                <div className={styles.cardUnit}>
                  {measurement.unit}
                </div>
              </div>
              <div className={styles.cardValue}>
                {measurement.value.toFixed(2)}
              </div>
              <div className={styles.cardDate}>
                {new Date(measurement.date).toLocaleString()}
              </div>
              {measurement.coordinates && (
                <div className={styles.cardCoordinates}>
                  <svg className={styles.coordinatesIcon} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span className={styles.coordinatesText}>
                    {measurement.coordinates.latitude.toFixed(4)}, {measurement.coordinates.longitude.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast de confirmation */}
      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  )
}

export default MeasurementList
