/**
 * Service de gestion des favoris pour WeatherWeS
 * Permet d'ajouter, supprimer et récupérer les stations favorites depuis le localStorage
 */

// Types pour la gestion des favoris
export interface FavoriteLocation {
  id: string;           // ID de la station
  name: string;         // Nom de la station
  city: string | null;  // Ville 
  country: string;      // Pays
  coordinates: {        // Coordonnées géographiques
    latitude: number;
    longitude: number;
  };
  addedAt: number;      // Date d'ajout aux favoris (timestamp)
}

// Clé utilisée pour le localStorage
const FAVORITES_STORAGE_KEY = 'weatherwes_favorites';

/**
 * Récupère la liste des favoris depuis le localStorage
 * @returns Liste des stations favorites
 */
export const getFavorites = (): FavoriteLocation[] => {
  try {
    const favoritesJson = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!favoritesJson) return [];
    
    const favorites = JSON.parse(favoritesJson);
    if (!Array.isArray(favorites)) return [];
    
    return favorites;
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return [];
  }
};

/**
 * Ajoute une station aux favoris
 * @param location Station à ajouter aux favoris
 * @returns true si l'ajout a réussi, false sinon
 */
export const addToFavorites = (location: FavoriteLocation): boolean => {
  try {
    const favorites = getFavorites();
    
    // Vérifier si la station est déjà dans les favoris
    if (favorites.some(fav => fav.id === location.id)) {
      return false; // La station est déjà dans les favoris
    }
    
    // Ajouter la nouvelle station avec la date courante
    const newFavorite = {
      ...location,
      addedAt: Date.now()
    };
    
    const updatedFavorites = [...favorites, newFavorite];
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    return false;
  }
};

/**
 * Supprime une station des favoris
 * @param locationId ID de la station à supprimer
 * @returns true si la suppression a réussi, false sinon
 */
export const removeFromFavorites = (locationId: string): boolean => {
  try {
    const favorites = getFavorites();
    const updatedFavorites = favorites.filter(fav => fav.id !== locationId);
    
    // Si aucun changement, la station n'était pas dans les favoris
    if (updatedFavorites.length === favorites.length) {
      return false;
    }
    
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression des favoris:', error);
    return false;
  }
};

/**
 * Vérifie si une station est dans les favoris
 * @param locationId ID de la station à vérifier
 * @returns true si la station est dans les favoris, false sinon
 */
export const isFavorite = (locationId: string): boolean => {
  try {
    const favorites = getFavorites();
    return favorites.some(fav => fav.id === locationId);
  } catch (error) {
    console.error('Erreur lors de la vérification des favoris:', error);
    return false;
  }
};

/**
 * Tri les favoris selon différents critères
 * @param favorites Liste des favoris à trier
 * @param sortBy Critère de tri : 'name', 'city', 'country', 'date' (défaut)
 * @param order Ordre de tri : 'asc' (défaut) ou 'desc'
 * @returns Liste triée des favoris
 */
export const sortFavorites = (
  favorites: FavoriteLocation[],
  sortBy: 'name' | 'city' | 'country' | 'date' = 'date',
  order: 'asc' | 'desc' = 'asc'
): FavoriteLocation[] => {
  return [...favorites].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'city':
        const cityA = a.city || '';
        const cityB = b.city || '';
        comparison = cityA.localeCompare(cityB);
        break;
      case 'country':
        comparison = a.country.localeCompare(b.country);
        break;
      case 'date':
      default:
        comparison = a.addedAt - b.addedAt;
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Exporte tous les favoris au format JSON
 * @returns Chaîne JSON contenant les favoris
 */
export const exportFavorites = (): string => {
  return JSON.stringify(getFavorites(), null, 2);
};

/**
 * Importe des favoris depuis une chaîne JSON
 * @param jsonString Chaîne JSON contenant les favoris
 * @returns Nombre de favoris importés ou -1 en cas d'erreur
 */
export const importFavorites = (jsonString: string): number => {
  try {
    const importedFavorites = JSON.parse(jsonString);
    
    if (!Array.isArray(importedFavorites)) {
      throw new Error('Format de données invalide');
    }
    
    localStorage.setItem(FAVORITES_STORAGE_KEY, jsonString);
    return importedFavorites.length;
  } catch (error) {
    console.error('Erreur lors de l\'importation des favoris:', error);
    return -1;
  }
};
