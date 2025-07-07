import { useState, useEffect } from 'react';
import {
  IconButton,
  Button,
  Icon,
  Text,
  Box
} from '@chakra-ui/react';
import { FaStar } from 'react-icons/fa';
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
  showLabel?: boolean;
}

const FavoriteButton = ({
  locationId,
  locationName,
  locationData,
  onStatusChange,
  size = 'md',
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
        coordinates: locationData.coordinates || { latitude: 0, longitude: 0 },
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

  const StarIcon = () => (
    <Icon 
      as={FaStar}
      color={isFav ? 'yellow.400' : 'gray.300'}
      transition="all 0.2s"
      transform={isAnimating ? "scale(1.3)" : "scale(1)"}
    />
  );

  const iconSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

  if (showLabel) {
    return (
      <Button
        variant="ghost"
        size={iconSize}
        onClick={handleToggleFavorite}
        aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        _hover={{
          bg: 'gray.50',
          transform: 'translateY(-1px)'
        }}
        transition="all 0.2s"
      >
        <Box display="flex" alignItems="center" gap={2}>
          <StarIcon />
          <Text fontSize={size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'}>
            {isFav ? 'Favori' : 'Ajouter'}
          </Text>
        </Box>
      </Button>
    );
  }

  return (
    <IconButton
      variant="ghost"
      size={iconSize}
      aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={handleToggleFavorite}
      _hover={{
        bg: 'gray.50',
        transform: 'translateY(-1px)'
      }}
      transition="all 0.2s"
    >
      <StarIcon />
    </IconButton>
  );
};

export default FavoriteButton;
