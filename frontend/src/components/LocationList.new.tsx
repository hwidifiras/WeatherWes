import { useEffect } from 'react';
import {
  Box,
  Text,
  Spinner,
  Grid,
} from '@chakra-ui/react';
import LocationCard from './LocationCard';
import ErrorAlert from './ErrorAlert';
import LocationFilters from './LocationFilters';
import { useLocations } from '../hooks/useApi';
import type { LocationFilter } from '../types';

interface LocationListProps {
  onSelectLocation?: (locationId: number, locationName: string) => void;
}

export default function LocationList({ onSelectLocation }: LocationListProps) {
  const { data: locations, loading, error, searchLocations } = useLocations();

  const handleFilterChange = async (filters: LocationFilter) => {
    try {
      await searchLocations(filters);
    } catch (error) {
      // Error is already handled by the hook
      console.error('Failed to fetch locations:', error);
    }
  };

  useEffect(() => {
    handleFilterChange({
      limit: 50,
      excludeUnknown: true,
      hasRecent: true,
    });
  }, []);

  return (
    <Box>
      <LocationFilters onFilterChange={handleFilterChange} />

      {loading && (
        <Box textAlign="center" py={8}>
          <Spinner size="xl" color="blue.500" />
          <Text mt={4} color="gray.600">Loading locations...</Text>
        </Box>
      )}

      {error && (
        <ErrorAlert
          status="error"
          title="Error Loading Locations"
          description={error}
        />
      )}

      {!loading && !error && locations && locations.length > 0 && (
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          }}
          gap={6}
          mt={6}
        >
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onClick={() => onSelectLocation?.(location.id, location.name || location.city || 'Unknown Location')}
            />
          ))}
        </Grid>
      )}

      {!loading && !error && (!locations || locations.length === 0) && (
        <ErrorAlert
          status="info"
          title="No Locations Found"
          description="Try adjusting your filters or search for a different city."
        />
      )}
    </Box>
  );
}
