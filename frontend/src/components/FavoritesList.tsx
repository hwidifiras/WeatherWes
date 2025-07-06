import { useState, useEffect } from 'react'
import type { FavoriteLocation } from '../utils/favoritesService'
import { 
  getFavorites, 
  removeFromFavorites,
  sortFavorites 
} from '../utils/favoritesService'
import styles from './FavoritesList.module.css'

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
      <div className={styles.emptyState}>
        <svg className={styles.emptyIcon} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
        <p className={styles.emptyTitle}>Vous n'avez pas encore de stations favorites</p>
        <p className={styles.emptyDescription}>
          Ajoutez des stations à vos favoris pour y accéder rapidement.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.sortButtons}>
          <button 
            onClick={() => handleSortChange('name')}
            className={`${styles.sortButton} ${
              sortBy === 'name' 
                ? styles.sortButtonActive
                : styles.sortButtonInactive
            }`}
          >
            Nom {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            onClick={() => handleSortChange('city')}
            className={`${styles.sortButton} ${
              sortBy === 'city' 
                ? styles.sortButtonActive
                : styles.sortButtonInactive
            }`}
          >
            Ville {sortBy === 'city' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            onClick={() => handleSortChange('date')}
            className={`${styles.sortButton} ${
              sortBy === 'date' 
                ? styles.sortButtonActive
                : styles.sortButtonInactive
            }`}
          >
            Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
        <button 
          onClick={toggleEditMode}
          className={styles.editButton}
          aria-label={isEditing ? "Terminer" : "Modifier"}
        >
          {isEditing ? "Terminer" : "Modifier"}
        </button>
      </div>

      <ul className={styles.favoritesGrid}>
        {favorites.map((favorite) => (
          <li
            key={favorite.id}
            onClick={() => !isEditing && onSelectFavorite(favorite.id, favorite.name)}
            className={`${styles.favoriteCard} ${
              isEditing 
                ? styles.favoriteCardEditing
                : styles.favoriteCardNormal
            }`}
            tabIndex={0}
            role="button"
            aria-label={`Sélectionner la station ${favorite.name}`}
          >
            <div className={styles.favoriteCardHeader}>
              <h3 className={styles.favoriteCardTitle}>{favorite.name}</h3>
              {isEditing && (
                <button 
                  onClick={(e) => handleRemoveFavorite(e, favorite.id)}
                  className={styles.removeButton}
                  aria-label="Supprimer des favoris"
                >
                  <svg className={styles.removeIcon} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              )}
            </div>
            <p className={styles.favoriteLocation}>
              {favorite.city || "Localité inconnue"}, {favorite.country}
            </p>
            <p className={styles.favoriteCoordinates}>
              ({favorite.coordinates.latitude.toFixed(4)}, {favorite.coordinates.longitude.toFixed(4)})
            </p>
            <p className={styles.favoriteDate}>
              Ajouté le {new Date(favorite.addedAt).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FavoritesList
