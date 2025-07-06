import { useState, useEffect } from 'react'
import { getFavorites } from '../utils/favoritesService'
import styles from './FavoriteCounter.module.css'

interface FavoriteCounterProps {
  className?: string;
}

/**
 * Composant affichant le nombre de favoris
 * Utilisé dans la navigation par onglets
 */
function FavoriteCounter({ className = '' }: FavoriteCounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Charger le nombre de favoris au montage du composant
    const favorites = getFavorites()
    setCount(favorites.length)

    // Écouter les changements de favoris via le localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'weatherwes_favorites') {
        try {
          const newFavorites = e.newValue ? JSON.parse(e.newValue) : []
          setCount(Array.isArray(newFavorites) ? newFavorites.length : 0)
        } catch (error) {
          console.error('Erreur lors du parsing des favoris:', error)
        }
      }
    }

    // Rafraîchir régulièrement (tous les 2 secondes) pour détecter les changements
    // même si le localStorage est modifié dans un autre composant du même onglet
    const interval = setInterval(() => {
      const favorites = getFavorites()
      setCount(favorites.length)
    }, 2000)

    // S'abonner aux événements de localStorage
    window.addEventListener('storage', handleStorageChange)
    
    // S'abonner aux événements personnalisés de mise à jour des favoris
    const handleCustomEvent = () => {
      const favorites = getFavorites()
      setCount(favorites.length)
    }
    
    document.addEventListener('favorites-updated', handleCustomEvent)
    
    // Nettoyer les abonnements à la destruction du composant
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('favorites-updated', handleCustomEvent)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className={`${styles.container} ${className}`} title={`${count} favoris`}>
      <svg className={`${styles.icon} ${count > 0 ? styles.iconActive : ''}`} fill={count > 0 ? "#f59e0b" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
      </svg>
      {count > 0 && (
        <span className={styles.badge}>
          {count}
        </span>
      )}
    </div>
  )
}

export default FavoriteCounter
