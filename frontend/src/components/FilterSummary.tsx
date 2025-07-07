import { Box, Text, Badge, Icon, HStack, Wrap, WrapItem } from '@chakra-ui/react';
import { FaMapMarkerAlt, FaGlobe, FaFlask, FaClock, FaEyeSlash, FaInfoCircle } from 'react-icons/fa';
import type { LocationFilter } from '../utils/locationFilterService';
import { getParametersByIds, getCountryNameByCode } from '../utils/locationFilterService';

interface FilterSummaryProps {
  totalLocations?: number;
  filters?: LocationFilter;
}

const FilterSummary = ({ filters, totalLocations = 0 }: FilterSummaryProps) => {
  if (!filters) {
    return (
      <Box p={4} bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="lg">
        <HStack gap={2}>
          <Icon as={FaInfoCircle} color="blue.500" />
          <Text color="blue.700" fontWeight="medium">
            Affichage de toutes les stations disponibles
          </Text>
          <Badge colorScheme="blue" ml={2}>
            {totalLocations} stations
          </Badge>
        </HStack>
      </Box>
    );
  }

  // Vérifier si des filtres sont appliqués
  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof LocationFilter];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return true;
    if (key === 'excludeUnknown' || key === 'hasRecent') return value === true;
    if (key === 'city' || key === 'country') return !!value && value !== '';
    return false;
  });

  if (!hasActiveFilters) {
    return (
      <Box p={4} bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="lg">
        <HStack gap={2}>
          <Icon as={FaInfoCircle} color="blue.500" />
          <Text color="blue.700" fontWeight="medium">
            Affichage de toutes les stations disponibles
          </Text>
          <Badge colorScheme="blue" ml={2}>
            {totalLocations} stations
          </Badge>
        </HStack>
      </Box>
    );
  }

  // Créer des badges pour chaque filtre actif
  const renderFilterBadges = () => {
    const badges = [];
    
    // Filtre par ville
    if (filters.city) {
      badges.push(
        <WrapItem key="city">
          <Badge colorScheme="green" display="flex" alignItems="center" gap={1}>
            <Icon as={FaMapMarkerAlt} w={3} h={3} />
            <Text>Ville: {filters.city}</Text>
          </Badge>
        </WrapItem>
      );
    }
    
    // Filtre par pays
    if (filters.country) {
      const countryName = getCountryNameByCode(filters.country) || filters.country;
      badges.push(
        <WrapItem key="country">
          <Badge colorScheme="purple" display="flex" alignItems="center" gap={1}>
            <Icon as={FaGlobe} w={3} h={3} />
            <Text>Pays: {countryName}</Text>
          </Badge>
        </WrapItem>
      );
    }
    
    // Filtre par paramètres
    if (filters.parameters && filters.parameters.length > 0) {
      try {
        const parameterNames = getParametersByIds(filters.parameters);
        const parameterText = parameterNames.map(p => p.name).join(', ');
        badges.push(
          <WrapItem key="parameters">
            <Badge colorScheme="orange" display="flex" alignItems="center" gap={1}>
              <Icon as={FaFlask} w={3} h={3} />
              <Text>Polluants: {parameterText}</Text>
            </Badge>
          </WrapItem>
        );
      } catch (error) {
        badges.push(
          <WrapItem key="parameters">
            <Badge colorScheme="orange" display="flex" alignItems="center" gap={1}>
              <Icon as={FaFlask} w={3} h={3} />
              <Text>Polluants: {filters.parameters.length} sélectionnés</Text>
            </Badge>
          </WrapItem>
        );
      }
    }
    
    // Filtre données récentes
    if (filters.hasRecent) {
      badges.push(
        <WrapItem key="hasRecent">
          <Badge colorScheme="blue" display="flex" alignItems="center" gap={1}>
            <Icon as={FaClock} w={3} h={3} />
            <Text>Données récentes</Text>
          </Badge>
        </WrapItem>
      );
    }
    
    // Filtre exclure données inconnues
    if (filters.excludeUnknown) {
      badges.push(
        <WrapItem key="excludeUnknown">
          <Badge colorScheme="gray" display="flex" alignItems="center" gap={1}>
            <Icon as={FaEyeSlash} w={3} h={3} />
            <Text>Exclure inconnues</Text>
          </Badge>
        </WrapItem>
      );
    }
    
    // Filtre coordonnées
    if (filters.coordinates) {
      badges.push(
        <WrapItem key="coordinates">
          <Badge colorScheme="teal" display="flex" alignItems="center" gap={1}>
            <Icon as={FaMapMarkerAlt} w={3} h={3} />
            <Text>Zone géographique</Text>
          </Badge>
        </WrapItem>
      );
    }
    
    return badges;
  };

  return (
    <Box p={4} bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="lg">
      <HStack justify="space-between" align="start" mb={3}>
        <Text fontWeight="semibold" color="gray.700">
          Filtres appliqués
        </Text>
        <Badge colorScheme="blue">
          {totalLocations} résultat{totalLocations !== 1 ? 's' : ''}
        </Badge>
      </HStack>
      
      <Wrap gap={2}>
        {renderFilterBadges()}
      </Wrap>
    </Box>
  );
};

export default FilterSummary;

