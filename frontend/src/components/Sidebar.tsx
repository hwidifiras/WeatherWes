import React from 'react';
import { Box } from '@chakra-ui/react';
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
  const { routes, mini = true, hovered = false, setHovered } = props;
  
  // Transition and styling
  const variantChange = '0.2s linear';
  const shadow = '14px 17px 40px 4px rgba(112, 144, 176, 0.08)';
  const sidebarBg = 'white';
  const sidebarRadius = '30px';
  const sidebarMargins = '0px';

  // Calculate sidebar width based on mini and hover state
  const getSidebarWidth = () => {
    if (mini && hovered) return '285px';
    return '120px';
  };

  const handleMouseEnter = () => {
    if (setHovered) setHovered(true);
  };

  const handleMouseLeave = () => {
    if (setHovered) setHovered(false);
  };

  return (
    <Box
      position="fixed"
      minH="100%"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      zIndex={100}
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

export default Sidebar;

