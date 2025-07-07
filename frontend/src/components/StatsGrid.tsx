import { Box, Text, VStack, HStack, Icon } from '@chakra-ui/react';
import type { IconType } from 'react-icons';

interface StatItem {
  label: string;
  value: string | number;
  icon?: IconType;
  color?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface StatsGridProps {
  stats: StatItem[];
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <Box>
      <VStack gap="4" align="stretch">
        {stats.map((stat, index) => (
          <Box
            key={index}
            bg="white"
            p="6"
            borderRadius="lg"
            boxShadow="sm"
            border="1px solid"
            borderColor="gray.200"
            _hover={{
              boxShadow: 'md',
              transform: 'translateY(-2px)',
            }}
            transition="all 0.2s"
          >
            <HStack justify="space-between" align="center">
              <VStack align="start" gap="1">
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  {stat.label}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color={stat.color || "gray.900"}>
                  {stat.value}
                </Text>
                {stat.change && (
                  <Text 
                    fontSize="sm" 
                    color={
                      stat.trend === 'up' ? 'green.500' : 
                      stat.trend === 'down' ? 'red.500' : 
                      'gray.500'
                    }
                  >
                    {stat.change}
                  </Text>
                )}
              </VStack>
              
              {stat.icon && (
                <Box
                  p="3"
                  borderRadius="full"
                  bg={stat.color ? `${stat.color.split('.')[0]}.100` : 'blue.100'}
                >
                  <Icon 
                    as={stat.icon} 
                    w="6" 
                    h="6" 
                    color={stat.color || 'blue.500'}
                  />
                </Box>
              )}
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

