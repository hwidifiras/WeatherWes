import { useState, useEffect } from 'react'
import axios from 'axios'
import { isValidLocationId, normalizeLocationId, handleLocationError } from '../utils/locationUtils'
import { addToFavorites, isFavorite, removeFromFavorites } from '../utils/favoritesService'

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
      <div className="flex flex-col items-center justify-center p-10 h-80">
        <div className="inline-block w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg text-gray-600">Chargement des mesures...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 rounded-xl bg-error-50 border border-error-300 text-center mx-6 mb-6 shadow-sm">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-xl font-medium mb-3 text-error-600">Erreur lors de la récupération des données</div>
        <div className="mb-5 text-lg text-gray-700">{error}</div>
        <div className="text-sm text-gray-500 mb-6">
          Veuillez réessayer avec une autre station ou contacter le support si le problème persiste.
        </div>
        <div className="flex justify-center gap-5">
          <button 
            onClick={handleRefresh} 
            disabled={loading}
            className="bg-primary-600 text-white hover:bg-primary-700 py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Réessayer
          </button>
          <button 
            onClick={handleDebugStation} 
            className="bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
      <div className="p-4">
        <div className="mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-lg font-medium mb-1 text-gray-900">{location.name}</h3>
          <p className="text-sm text-gray-600">{location.city || location.locality || "Unknown Location"}, {location.country.name}</p>
        </div>
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="mb-4 font-medium text-gray-800">Aucune donnée de mesure n'est disponible pour cette station.</p>
          <p className="mb-1 text-sm text-gray-600">ID de la station: {location.id}</p>
          <p className="mb-4 text-sm text-gray-600">Coordonnées: {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}</p>
          
          <div className="mt-6 p-4 bg-white border border-gray-200 rounded-md text-left shadow-sm">
            <p className="mb-2 font-medium text-gray-800">Cette station pourrait être:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li className="mb-1">Temporairement hors service</li>
              <li className="mb-1">Ne pas avoir transmis de données récentes</li>
              <li className="mb-1">Ne plus être référencée par OpenAQ</li>
            </ul>
            <p className="font-medium mt-4 text-gray-600">Essayez de sélectionner une autre station.</p>
          </div>
          
          <div className="flex justify-center gap-4 mt-6">
            <button 
              onClick={handleRefresh} 
              className="bg-primary-600 text-white hover:bg-primary-700 py-2 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50" 
              disabled={loading}
            >
              Forcer le rafraîchissement
            </button>
            <button 
              onClick={handleDebugStation} 
              className="bg-gray-100 text-gray-800 hover:bg-gray-200 py-2 px-4 rounded-lg transition-colors shadow-sm border border-gray-200"
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
    <div className="p-6">
      <div className="mb-6 pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h3 className="text-xl font-medium mb-2 text-gray-900">{location.name}</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <p className="text-sm text-gray-600">{location.city || location.locality || "Unknown Location"}, {location.country.name}</p>
            <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString()} 
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleToggleFavorite}
          className={`p-2.5 rounded-lg transition-colors flex items-center gap-2 ${
            isFavorited 
              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
              : 'text-gray-500 hover:text-amber-500 hover:bg-amber-50'
          }`}
          aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
          title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <svg className="w-5 h-5" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            {isFavorited 
              ? <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1" strokeWidth="0"/> 
              : <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
            }
          </svg>
          <span>{isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}</span>
        </button>
      </div>

      {isDemoData && (
        <div className="p-3 mb-4 bg-warning-50 text-warning-700 text-sm border border-warning-200 rounded-md flex items-center gap-2">
          <span className="text-xl">⚠️</span> 
          <span>Les données affichées proviennent d'une source de démonstration et peuvent ne pas être à jour.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="inline-flex gap-3 bg-gray-100 rounded-lg p-1">
          <button
            className={`py-2.5 px-5 rounded-md transition-colors ${
              !showSummary 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'bg-transparent text-gray-600 hover:bg-white'
            }`}
            onClick={() => setShowSummary(false)}
          >
            Dernières mesures
          </button>
          <button
            className={`py-2.5 px-5 rounded-md transition-colors ${
              showSummary 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'bg-transparent text-gray-600 hover:bg-white'
            }`}
            onClick={() => setShowSummary(true)}
          >
            Résumé
          </button>
        </div>
        
        {/* Status indicator - utilise apiStatus pour éviter l'erreur "déclaré mais jamais lu" */}
        <div className="ml-auto">
          <span 
            className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full ${
              apiStatus === 'ok' ? 'bg-green-100 text-green-800' : 
              apiStatus === 'no-data' ? 'bg-amber-100 text-amber-800' : 
              'bg-red-100 text-red-800'
            }`}
          >
            <span className={`w-2 h-2 mr-1 rounded-full ${
              apiStatus === 'ok' ? 'bg-green-500' : 
              apiStatus === 'no-data' ? 'bg-amber-500' : 
              'bg-red-500'
            }`}></span>
            {apiStatus === 'ok' ? 'Données disponibles' : 
             apiStatus === 'no-data' ? 'Aucune donnée' : 
             'Erreur'}
          </span>
        </div>
      </div>

      {showSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {measurements_summary?.map((summary) => (
            <div key={summary.parameter} className="p-5 bg-white rounded-xl border border-gray-200 shadow hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-900">{summary.parameter.toUpperCase()}</h4>
                <div className="bg-primary-50 text-primary-700 text-xs rounded-full py-1 px-3">
                  {summary.unit}
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                  <span className="text-gray-600">Moyenne:</span>
                  <span className="font-medium text-gray-900">{summary.avg_value.toFixed(2)} {summary.unit}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-gray-600">Min:</span>
                  <span className="font-medium text-gray-900">{summary.min_value.toFixed(2)} {summary.unit}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                  <span className="text-gray-600">Max:</span>
                  <span className="font-medium text-gray-900">{summary.max_value.toFixed(2)} {summary.unit}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-gray-600">Mesures:</span>
                  <span className="font-medium text-gray-900">{summary.count}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                Dernière mise à jour: {new Date(summary.last_updated).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {measurements?.map((measurement, index) => (
            <div key={index} className="p-5 bg-white rounded-xl border border-gray-200 shadow hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-900">{measurement.parameter.toUpperCase()}</h4>
                <div className="bg-primary-50 text-primary-700 text-xs rounded-full py-1 px-3">
                  {measurement.unit}
                </div>
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-3">
                {measurement.value.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {new Date(measurement.date).toLocaleString()}
              </div>
              {measurement.coordinates && (
                <div className="text-xs bg-gray-50 rounded-lg py-1.5 px-3 mt-3 flex items-center gap-2">
                  <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span className="text-gray-600">
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
        <div className="fixed bottom-4 right-4 bg-primary-600 text-white p-4 rounded-lg shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  )
}

export default MeasurementList
