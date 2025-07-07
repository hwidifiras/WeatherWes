import { Box, Text } from '@chakra-ui/react';

interface FilterSummaryProps {
  totalLocations?: number;
  filters?: any;
}

const FilterSummary = ({ totalLocations = 0 }: FilterSummaryProps) => {
  return (
    <Box p={4} bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="lg">
      <Text>Filter Summary - {totalLocations} locations</Text>
    </Box>
  );
};

export default FilterSummary;
