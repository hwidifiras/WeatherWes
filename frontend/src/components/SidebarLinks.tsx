import { NavLink, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Icon,
  VStack,
} from '@chakra-ui/react';
import type { IconType } from 'react-icons';

interface Route {
  name: string;
  path: string;
  icon?: IconType;
  component?: React.ComponentType;
  secondary?: boolean;
}

interface SidebarLinksProps {
  routes: Route[];
  mini?: boolean;
  hovered?: boolean;
}

export function SidebarLinks({ routes, mini = false, hovered = false }: SidebarLinksProps) {
  const location = useLocation();
  const showLabels = !mini || (mini && hovered);

  const activeRoute = (routeName: string) => {
    return location.pathname.includes(routeName);
  };

  const createLinks = (routes: Route[]) => {
    return routes.map((route, index) => {
      const isActive = activeRoute(route.path);

      return (
        <NavLink key={index} to={route.path} style={{ textDecoration: 'none', width: '100%' }}>
          <Box
            bg={isActive ? 'blue.500' : 'transparent'}
            color={isActive ? 'white' : 'gray.600'}
            borderRadius="lg"
            p="10px"
            mb="4px"
            _hover={{
              bg: isActive ? 'blue.600' : 'gray.100',
              color: isActive ? 'white' : 'gray.800',
            }}
            transition="all 0.2s"
            cursor="pointer"
          >
            <Flex align="center">
              {route.icon && (
                <Icon
                  as={route.icon}
                  width="20px"
                  height="20px"
                  color="inherit"
                  me={showLabels ? "12px" : "0px"}
                />
              )}
              {showLabels && (
                <Text fontSize="sm" fontWeight="normal">
                  {route.name}
                </Text>
              )}
            </Flex>
          </Box>
        </NavLink>
      );
    });
  };

  return (
    <VStack align="stretch" gap="4px">
      {createLinks(routes)}
    </VStack>
  );
}

export default SidebarLinks;

