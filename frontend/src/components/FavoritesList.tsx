import { useState, useEffect } from 'react'
import type { FavoriteLocation } from '../utils/favoritesService'
import { 
  getFavorites, 
  removeFromFavorites,
  sortFavorites 
} from '../utils/favoritesService'

interface FavoritesListProps {
  onSelectFavorite: (locationId: string, locationName: string) => void
}

function FavoritesList({ onSelectFavorite }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'country' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isEditing, setIsEditing] = useState(false)

  // Charger les favoris depuis le localStorage
  useEffect(() => {
    const loadedFavorites = getFavorites()
    setFavorites(sortFavorites(loadedFavorites, sortBy, sortOrder))
    
    // Configurer un écouteur d'événements pour les changements de localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'weatherwes_favorites') {
        try {
          const newFavorites = e.newValue ? JSON.parse(e.newValue) : []
          if (Array.isArray(newFavorites)) {
            setFavorites(sortFavorites(newFavorites, sortBy, sortOrder))
          }
        } catch (error) {
          console.error('Erreur lors du parsing des favoris:', error)
        }
      }
    }
    
    // Écouter les changements de localStorage
    window.addEventListener('storage', handleStorageChange)
    
    // Rafraîchir les favoris régulièrement pour détecter les changements
    // même si le localStorage est modifié dans un autre composant du même onglet
    const interval = setInterval(() => {
      const refreshedFavorites = getFavorites()
      setFavorites(sortFavorites(refreshedFavorites, sortBy, sortOrder))
    }, 2000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [sortBy, sortOrder])

  // Gérer le changement de tri
  const handleSortChange = (newSortBy: 'name' | 'city' | 'country' | 'date') => {
    if (sortBy === newSortBy) {
      // Si on clique sur le même critère, on inverse l'ordre
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc') // Par défaut, ordre ascendant quand on change de critère
    }
  }

  // Supprimer un favori
  const handleRemoveFavorite = (event: React.MouseEvent, locationId: string) => {
    event.stopPropagation() // Éviter de déclencher onSelectFavorite
    
    if (removeFromFavorites(locationId)) {
      setFavorites(prevFavorites => 
        prevFavorites.filter(fav => fav.id !== locationId)
      )
    }
  }

  // Basculer en mode édition
  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  // Afficher un message si aucun favori
  if (favorites.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-lg mb-4 text-gray-800">Vous n'avez pas encore de stations favorites</p>
        <p className="text-gray-600 mb-6">
          Ajoutez des stations à vos favoris pour y accéder rapidement.
        </p>
        <div className="flex justify-center">
          <svg className="w-16 h-16 text-gray-400 opacity-50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button 
            onClick={() => handleSortChange('name')}
            className={`text-sm py-1.5 px-3 rounded-md transition-colors ${
              sortBy === 'name' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Nom {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            onClick={() => handleSortChange('city')}
            className={`text-sm py-1.5 px-3 rounded-md transition-colors ${
              sortBy === 'city' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Ville {sortBy === 'city' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            onClick={() => handleSortChange('date')}
            className={`text-sm py-1.5 px-3 rounded-md transition-colors ${
              sortBy === 'date' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
        <button 
          onClick={toggleEditMode}
          className="text-sm py-1.5 px-3 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
          aria-label={isEditing ? "Terminer" : "Modifier"}
        >
          {isEditing ? "Terminer" : "Modifier"}
        </button>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {favorites.map((favorite) => (
          <li
            key={favorite.id}
            onClick={() => !isEditing && onSelectFavorite(favorite.id, favorite.name)}
            className={`p-4 rounded-md bg-white border shadow-sm cursor-pointer transition-all ${
              isEditing 
                ? 'border-dashed border-2 border-amber-500' 
                : 'border-gray-200 hover:shadow-md hover:border-primary-300'
            }`}
            tabIndex={0}
            role="button"
            aria-label={`Sélectionner la station ${favorite.name}`}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium mb-1 text-gray-900">{favorite.name}</h3>
              {isEditing && (
                <button 
                  onClick={(e) => handleRemoveFavorite(e, favorite.id)}
                  className="text-error-600 hover:bg-error-50 rounded-full p-1 transition-colors"
                  aria-label="Supprimer des favoris"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {favorite.city || "Localité inconnue"}, {favorite.country}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ({favorite.coordinates.latitude.toFixed(4)}, {favorite.coordinates.longitude.toFixed(4)})
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Ajouté le {new Date(favorite.addedAt).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FavoritesList
