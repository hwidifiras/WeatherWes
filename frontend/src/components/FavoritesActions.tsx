import { Box, Button } from '@chakra-ui/react';

interface FavoritesActionsProps {
  onImportComplete?: () => void;
}

const FavoritesActions = ({ onImportComplete }: FavoritesActionsProps) => {
  return (
    <Box p={4} display="flex" gap={4}>
      <Button colorScheme="blue" variant="outline">Export</Button>
      <Button colorScheme="green" variant="outline" onClick={onImportComplete}>Import</Button>
    </Box>
  );
};

export default FavoritesActions;
