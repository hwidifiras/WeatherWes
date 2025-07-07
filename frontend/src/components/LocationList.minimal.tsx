import { Box, Text, Button, VStack } from '@chakra-ui/react';

interface LocationListProps {
  onSelectLocation?: (locationId: string, locationName: string) => void;
}

const LocationList = ({ onSelectLocation }: LocationListProps) => {
  return (
    <Box p={4}>
      <VStack gap={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold">Location List</Text>
        <Text>This component has been simplified to remove CSS module dependencies.</Text>
        <Button colorScheme="blue" onClick={() => onSelectLocation?.('test', 'Test Location')}>
          Select Test Location
        </Button>
      </VStack>
    </Box>
  );
};

export default LocationList;
