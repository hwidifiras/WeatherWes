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
  const variantChange = '0.25s linear';
  const shadow = '14px 17px 40px 4px rgba(112, 144, 176, 0.08)';
  const sidebarBg = 'white';
  const sidebarRadius = '30px';
  const sidebarMargins = '0px';

  // Calculate sidebar width based on mini and hover state
  const getSidebarWidth = () => {
    if (mini) {
      return hovered ? '285px' : '120px';
    }
    return '285px';
  };

  const handleMouseEnter = () => {
    if (mini && setHovered) {
      setHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (mini && setHovered) {
      setHovered(false);
    }
  };

  return (
    <Box
      position="fixed"
      minH="100vh"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      zIndex={1001} // Higher than navbar
      top={0}
      left={0}
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
        minH="calc(100vh - 32px)"
        overflowX="hidden"
        overflowY="auto"
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

