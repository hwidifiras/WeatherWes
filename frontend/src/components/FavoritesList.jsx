import { 
  Box, 
  Text, 
  SimpleGrid, 
  VStack, 
  HStack, 
  Icon, 
  Badge,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavorites, removeFavorite } from '../utils/favoritesService';
import { IoLocation, IoTrash, IoTime } from 'react-icons/io5';

export default function FavoritesList() {
  const [favorites, setFavorites] = useState([]);
  const cardBg = 'white';
  const textColor = 'gray.600';
  const navigate = useNavigate();

  useEffect(() => {
    // Load favorites on component mount
    const loadedFavorites = getFavorites();
    setFavorites(loadedFavorites);
  }, []);

  const handleRemove = (id) => {
    removeFavorite(id);
    setFavorites(getFavorites()); // Refresh the list
  }; 

  const handleLocationClick = (locationId) => {
    navigate(`/measurements/${locationId}`);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (favorites.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Icon as={IoLocation} w={12} h={12} color="gray.400" mb={4} />
        <Text fontSize="xl" fontWeight="bold" mb={2}>No Favorites Yet</Text>
        <Text color={textColor}>
          Your favorite locations will appear here once you add them from the locations page.
        </Text>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6} p={4}>
      {favorites.map(favorite => (
        <Box
          key={favorite.id}
          bg={cardBg}
          p={6}
          rounded="lg"
          shadow="sm"
          borderWidth="1px"
          position="relative"
          transition="all 0.2s"
          _hover={{ shadow: 'md', transform: 'translateY(-2px)', cursor: 'pointer' }}
          onClick={() => handleLocationClick(favorite.id)}
        >
          <VStack align="stretch" gap={4}>
            <HStack justify="space-between">
              <Text 
                fontSize="lg" 
                fontWeight="bold" 
                maxWidth="200px" 
                overflow="hidden" 
                textOverflow="ellipsis" 
                whiteSpace="nowrap"
                onClick={() => handleLocationClick(favorite.id)}
                cursor="pointer"
                _hover={{ textDecoration: 'underline', color: 'blue.500' }}
              >
                {favorite.name}
              </Text>
              <Box 
                as="button" 
                onClick={() => handleRemove(favorite.id)}
                color="red.500"
                _hover={{ color: 'red.600' }}
              >
                <Icon as={IoTrash} w={5} h={5} />
              </Box>
            </HStack>
            
            <HStack gap={2}>
              <Icon as={IoLocation} color="blue.500" />
              <Text color={textColor} fontSize="sm">
                {favorite.city ? `${favorite.city}, ` : ''}{favorite.country}
              </Text>
            </HStack>

            <HStack gap={2}>
              <Icon as={IoTime} color="gray.500" />
              <Text color={textColor} fontSize="sm">
                Added {formatDate(favorite.addedAt)}
              </Text>
            </HStack>

            <HStack gap={2}>
              <Badge colorScheme="blue">
                Lat: {favorite.coordinates.latitude.toFixed(4)}
              </Badge>
              <Badge colorScheme="blue">
                Long: {favorite.coordinates.longitude.toFixed(4)}
              </Badge>
            </HStack>
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  );
}
