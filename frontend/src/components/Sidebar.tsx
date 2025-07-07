import React from 'react';
import {
  Box,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { IoMenuOutline } from 'react-icons/io5';
import SidebarContent from './SidebarContent';
import { SimpleScrollbars } from './scrollbar/Scrollbar';
import type { IconType } from 'react-icons';

interface Route {
  name: string;
  path: string;
  icon?: IconType;
  component?: React.ComponentType;
  secondary?: boolean;
}

interface SidebarProps {
  routes: Route[];
  mini?: boolean;
  hovered?: boolean;
  setHovered?: (hovered: boolean) => void;
}

function Sidebar(props: SidebarProps) {
  const { routes, mini = false, hovered = false, setHovered } = props;
  
  // Transition and styling
  const variantChange = '0.2s linear';
  const shadow = '14px 17px 40px 4px rgba(112, 144, 176, 0.08)';
  const sidebarBg = 'white';
  const sidebarRadius = '30px';
  const sidebarMargins = '0px';

  // Calculate sidebar width based on mini and hover state
  const getSidebarWidth = () => {
    if (!mini) return '285px';
    if (mini && hovered) return '285px';
    return '120px';
  };

  const handleMouseEnter = () => {
    if (setHovered) setHovered(true);
  };

  const handleMouseLeave = () => {
    if (setHovered) setHovered(false);
  };

  // Desktop sidebar
  return (
    <Box
      display={{ base: 'none', xl: 'block' }}
      position="fixed"
      minH="100%"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        bg={sidebarBg}
        transition={variantChange}
        w={getSidebarWidth()}
        ms={{ base: '16px' }}
        my={{ base: '16px' }}
        h="calc(100vh - 32px)"
        m={sidebarMargins}
        borderRadius={sidebarRadius}
        minH="100%"
        overflowX="hidden"
        boxShadow={shadow}
      >
        <SimpleScrollbars>
          <SidebarContent mini={mini} hovered={hovered} routes={routes} />
        </SimpleScrollbars>
      </Box>
    </Box>
  );
}

// Responsive sidebar for mobile - simplified for now
export function SidebarResponsive(props: { routes: Route[] }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { routes } = props;

  return (
    <Flex display={{ base: 'flex', xl: 'none' }} alignItems="center">
      <Flex w="max-content" h="max-content" onClick={() => setIsOpen(!isOpen)}>
        <Icon
          as={IoMenuOutline}
          color="gray.400"
          my="auto"
          w="20px"
          h="20px"
          me="10px"
          _hover={{ cursor: 'pointer' }}
        />
      </Flex>
      
      {isOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          w="285px"
          h="100vh"
          bg="white"
          boxShadow="lg"
          zIndex="overlay"
          onClick={() => setIsOpen(false)}
        >
          <Box p="4" onClick={(e) => e.stopPropagation()}>
            <SidebarContent mini={false} routes={routes} />
          </Box>
        </Box>
      )}
    </Flex>
  );
}

export default Sidebar;

