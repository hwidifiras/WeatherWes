import { Box, Text } from '@chakra-ui/react';

interface ChartData {
  name: string;
  value: number;
}

interface SimpleChartProps {
  data: ChartData[];
  title?: string;
  height?: string;
  color?: string;
}

export default function SimpleChart({ 
  data, 
  title = "Chart", 
  height = "200px",
  color = "blue.500" 
}: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <Box>
      {title && (
        <Text fontSize="lg" fontWeight="semibold" mb="4">
          {title}
        </Text>
      )}
      <Box height={height} position="relative" bg="gray.50" borderRadius="md" p="4">
        <Box 
          display="flex" 
          alignItems="flex-end" 
          height="100%" 
          gap="2"
          justifyContent="space-around"
        >
          {data.map((item, index) => (
            <Box key={index} display="flex" flexDirection="column" alignItems="center">
              <Box
                bg={color}
                width="20px"
                height={`${(item.value / maxValue) * 80}%`}
                borderRadius="sm"
                mb="2"
                transition="all 0.3s"
                _hover={{
                  transform: 'scaleY(1.1)',
                  opacity: 0.8,
                }}
              />
              <Text 
                fontSize="xs" 
                textAlign="center" 
                maxW="60px"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {item.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {item.value}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

