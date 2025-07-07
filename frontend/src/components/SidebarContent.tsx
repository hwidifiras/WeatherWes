import {
  Box,
  Flex,
  VStack,
  Text,
} from '@chakra-ui/react';
import SidebarBrand from './SidebarBrand';
import SidebarLinks from './SidebarLinks';
import type { IconType } from 'react-icons';

interface Route {
  name: string;
  path: string;
  icon?: IconType;
  component?: React.ComponentType;
  secondary?: boolean;
}

interface SidebarContentProps {
  routes: Route[];
  mini?: boolean;
  hovered?: boolean;
}

function SidebarContent({ routes, mini = false, hovered = false }: SidebarContentProps) {
  const showUserSection = !mini || (mini && hovered);

  return (
    <Flex direction="column" height="100%" pt="25px" borderRadius="30px">
      <SidebarBrand mini={mini} hovered={hovered} />
      
      <VStack gap="8px" mb="auto" mt="8px">
        <Box
          ps={!mini || (mini && hovered) ? '20px' : '16px'}
          pe={{ md: '16px', '2xl': '1px' }}
          ms={mini && !hovered ? '-16px' : 'unset'}
          w="100%"
        >
          <SidebarLinks mini={mini} hovered={hovered} routes={routes} />
        </Box>
      </VStack>

      {/* User section at bottom */}
      <Flex 
        mt="auto" 
        mb="32px" 
        justifyContent="center" 
        alignItems="center"
        px="20px"
        direction={showUserSection ? 'row' : 'column'}
      >
        <Box
          h="48px"
          w="48px"
          bg="blue.500"
          color="white"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontWeight="bold"
          me={showUserSection ? '12px' : '0px'}
          mb={showUserSection ? '0px' : '8px'}
        >
          WU
        </Box>
        {showUserSection && (
          <Box>
            <Text color="gray.700" fontSize="md" fontWeight="700">
              Weather User
            </Text>
            <Text color="gray.500" fontSize="sm" fontWeight="400">
              Air Quality Monitor
            </Text>
          </Box>
        )}
      </Flex>
    </Flex>
  );
}

export default SidebarContent;

