import { useState, useEffect } from 'react';
import { isFavorite, addToFavorites, removeFromFavorites } from '../utils/favoritesService';

interface FavoriteButtonProps {
  locationId: string;
  locationName: string;
  locationData: {
    city?: string | null;
    country?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  onStatusChange?: (isFavorite: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const FavoriteButton = ({
  locationId,
  locationName,
  locationData,
  onStatusChange,
  size = 'md',
  className = '',
  showLabel = false
}: FavoriteButtonProps) => {
  const [isFav, setIsFav] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check initial favorite status
  useEffect(() => {
    setIsFav(isFavorite(locationId));
  }, [locationId]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    let success = false;
    
    if (isFav) {
      success = removeFromFavorites(locationId);
    } else {
      const favoriteData = {
        id: locationId,
        name: locationName,
        city: locationData.city || null,
        country: locationData.country || 'Unknown',
        coordinates: locationData.coordinates,
        addedAt: Date.now()
      };
      
      success = addToFavorites(favoriteData);
    }
    
    if (success) {
      // Animate star
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 700);
      
      // Update state and notify parent
      setIsFav(!isFav);
      if (onStatusChange) {
        onStatusChange(!isFav);
      }
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  // Animation classes
  const animationClass = isAnimating ? 'animate-bounce' : '';

  return (
    <button 
      className={`flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-opacity-50 ${className}`} 
      onClick={handleToggleFavorite}
      aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
      title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <svg 
        className={`${sizeClasses[size]} ${animationClass} transition-colors ${isFav ? 'text-amber-500' : 'text-gray-600'}`} 
        fill={isFav ? 'currentColor' : 'none'}
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={isFav ? "1.5" : "2"} 
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        ></path>
      </svg>
      
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;