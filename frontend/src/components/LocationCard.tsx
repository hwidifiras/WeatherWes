import { Box, Text } from '@chakra-ui/react';
import type { Location } from '../types';

interface LocationCardProps {
  location: Location;
  onClick?: () => void;
}

export default function LocationCard({ location, onClick }: LocationCardProps) {
  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      onClick={onClick}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        shadow: 'lg',
        transform: 'translateY(-2px)',
      }}
    >
      <Text fontSize="xl" fontWeight="semibold" mb={2}>
        {location.name}
      </Text>
      <Text color="gray.600" mb={2}>
        {location.city}, {location.country.name}
      </Text>
      {location.parameters && location.parameters.length > 0 && (
        <Text fontSize="sm" color="gray.500">
          Parameters: {location.parameters.map(p => typeof p === 'string' ? p : p.parameter || 'Unknown').join(', ')}
        </Text>
      )}
      {location.measurement_count !== undefined && (
        <Text fontSize="sm" color="gray.500" mt={2}>
          {location.measurement_count} measurements
        </Text>
      )}
    </Box>
  );
}
