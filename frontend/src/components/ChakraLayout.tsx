import React, { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Remove SidebarResponsive import
import Navbar from './Navbar';
import type { IconType } from 'react-icons';

// Example icons - you can replace these with actual icons
import { 
  IoHome, 
  IoList, 
  IoHeart, 
  IoStatsChart,
  IoSettings 
} from 'react-icons/io5';

interface Route {
  name: string;
  path: string;
  icon?: IconType;
  component?: React.ComponentType;
  secondary?: boolean;
}

const routes: Route[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: IoHome,
  },
  {
    name: 'Locations',
    path: '/locations',
    icon: IoList,
  },
  {
    name: 'Favorites',
    path: '/favorites',
    icon: IoHeart,
  },
  {
    name: 'Measurements',
    path: '/measurements',
    icon: IoStatsChart,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: IoSettings,
  },
];

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mini] = useState(true); // Always in mini mode
  const [hovered, setHovered] = useState(false);

  // Calculate content area positioning
  const getContentStyles = () => {
    const sidebarWidth = (mini && !hovered) ? 120 : 285;
    const margin = 16; // Base margin from sidebar
    
    return {
      marginLeft: `${sidebarWidth + margin}px`,
      width: `calc(100vw - ${sidebarWidth + margin}px)`,
    };
  };

  const contentStyles = getContentStyles();

  return (
    <Box>
      {/* Main Sidebar - always visible in mini mode */}
      <Sidebar
        routes={routes}
        mini={mini}
        hovered={hovered}
        setHovered={setHovered}
      />
      
      {/* Main Content Area */}
      <Box
        minHeight="100vh"
        height="100%"
        overflow="auto"
        position="relative"
        maxHeight="100%"
        ml={contentStyles.marginLeft}
        w={contentStyles.width}
        transition="all 0.25s cubic-bezier(0.685, 0.0473, 0.346, 1)"
        transitionDuration=".2s, .2s, .35s"
        transitionProperty="margin-left, width"
        transitionTimingFunction="linear, linear, ease"
      >
        {/* Navbar */}
        <Navbar
          mini={mini}
          hovered={hovered}
          brandText="Air Quality Dashboard"
        />

        {/* Page Content */}
        <Box
          position="relative"
          mx="auto"
          p={{ base: '20px', md: '30px' }}
          pe="20px"
          minH="100vh"
          mt={{ base: "90px", md: "100px" }} // Margin top to clear the fixed navbar
        >
          {children || <Outlet />}
        </Box>
      </Box>
    </Box>
  );
}

