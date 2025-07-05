/**
 * Utilitaires pour la gestion des identifiants de stations
 */

/**
 * Vérifie si un identifiant de station est valide
 * @param locationId L'identifiant à vérifier
 * @returns boolean
 */
export const isValidLocationId = (locationId: any): boolean => {
  if (locationId === undefined || locationId === null) return false;
  if (typeof locationId === 'string' && locationId.trim() === '') return false;
  
  // Vérifier si c'est un nombre valide ou un code de format valide (comme UKA00472)
  return (
    !isNaN(Number(locationId)) || 
    /^[A-Z]{3}\d{5}$/.test(locationId as string)
  );
};

/**
 * Normalise un identifiant de station pour l'API
 * @param locationId L'identifiant à normaliser
 * @returns string - L'identifiant normalisé ou null si invalide
 */
export const normalizeLocationId = (locationId: string | number): string | null => {
  if (!isValidLocationId(locationId)) return null;
  
  // Si c'est un nombre, s'assurer qu'il est converti en string
  return String(locationId);
};

/**
 * Gère les erreurs liées aux stations
 * @param error L'erreur à traiter
 * @returns Message d'erreur formaté
 */
export const handleLocationError = (error: any): string => {
  // Vérifier si c'est une erreur Axios avec une réponse
  if (error?.response?.data?.detail) {
    const errorDetail = error.response.data.detail;
    
    // Erreurs spécifiques pour l'API OpenAQ
    if (errorDetail.includes("n'existe pas dans l'API OpenAQ") || 
        errorDetail.includes("not found") || 
        errorDetail.includes("not available") ||
        errorDetail.includes("Not Found") ||
        (errorDetail.includes("station") && errorDetail.includes("API OpenAQ"))) {
      return `Cette station n'est pas disponible dans l'API OpenAQ ou n'a pas de mesures récentes.`;
    }
    
    return `Erreur: ${errorDetail}`;
  }
  
  // Codes d'erreur HTTP
  if (error?.response?.status) {
    switch (error.response.status) {
      case 404:
        return 'La station demandée n\'a pas été trouvée ou n\'a pas de données disponibles.';
      case 502:
        return 'L\'API externe (OpenAQ) est temporairement indisponible. Veuillez réessayer plus tard.';
      case 500:
        return 'Une erreur interne s\'est produite sur le serveur. Veuillez contacter l\'administrateur.';
      default:
        return `Erreur HTTP ${error.response.status}: Problème de communication avec le serveur.`;
    }
  }
  
  // Erreurs de réseau
  if (error?.message?.includes('Network Error') || error?.message?.includes('timeout')) {
    return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
  }
  
  // Erreur par défaut
  return 'Une erreur s\'est produite lors de la récupération des données de la station.';
};
