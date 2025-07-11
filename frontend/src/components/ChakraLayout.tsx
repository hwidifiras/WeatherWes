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
        float="right"
        minHeight="100vh"
        height="100%"
        overflow="auto"
        position="relative"
        maxHeight="100%"
        w={{
          base: mini && !hovered ? 'calc(100% - 120px)' : 'calc(100% - 285px)',
        }}
        maxWidth={{
          base: mini && !hovered ? 'calc(100% - 120px)' : 'calc(100% - 285px)',
        }}
        transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)"
        transitionDuration=".2s, .2s, .35s"
        transitionProperty="top, bottom, width"
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

