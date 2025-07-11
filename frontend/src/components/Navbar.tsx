import {
  Box,
  Flex,
  Text,
} from '@chakra-ui/react';

interface NavbarProps {
  brandText?: string;
  secondary?: boolean;
  mini?: boolean;
  hovered?: boolean;
  routes?: Array<{ name: string; path: string }>;
}

export default function Navbar({
  brandText = "WeatherWeS",
  secondary = false,
  mini = true,
  hovered = false,
}: NavbarProps) {
  // Calculate navbar left margin and width based on sidebar state
  const getNavbarStyles = () => {
    const sidebarWidth = (mini && !hovered) ? 120 : 285;
    const margin = 16; // Base margin from sidebar
    
    return {
      left: `${sidebarWidth + margin + 12}px`, // Sidebar width + margin + additional padding
      width: `calc(100vw - ${sidebarWidth + margin + 24}px)`, // Full width minus sidebar and margins
    };
  };

  const navbarStyles = getNavbarStyles();

  return (
    <Box
      position="fixed"
      boxShadow="0 2px 4px rgba(0,0,0,0.1)"
      bg="white"
      borderColor="transparent"
      filter="none"
      backdropFilter="blur(20px)"
      zIndex={1000}
      backgroundPosition="center"
      backgroundSize="cover"
      borderRadius="16px"
      borderWidth="1.5px"
      borderStyle="solid"
      transitionDelay="0s, 0s, 0s, 0s"
      transitionDuration=" 0.25s, 0.25s, 0.25s, 0s"
      transition-property="box-shadow, background-color, filter, border, left, width"
      transitionTimingFunction="linear, linear, linear, linear"
      alignItems={{ xl: 'center' }}
      display={secondary ? 'block' : 'flex'}
      minH="75px"
      justifyContent={{ xl: 'center' }}
      lineHeight="25.6px"
      mx="0" // Remove auto margin
      mt="0px"
      pb="8px"
      left={navbarStyles.left} // Use left instead of right
      px={{
        base: '15px',
        md: '20px',
      }}
      ps={{
        xl: '12px',
      }}
      pt="8px"
      top={{ base: '12px', md: '16px', xl: '18px' }}
      w={navbarStyles.width}
    >
      <Flex
        w="100%"
        flexDirection={{
          base: 'column',
          md: 'row',
        }}
        alignItems={{ xl: 'center' }}
        mb="gap-0"
      >
        <Box mb={{ base: '8px', md: '0px' }}>
          <Text
            color="gray.500"
            fontSize="sm"
            mb="5px"
          >
            Pages / {brandText}
          </Text>
          <Text
            color="navy.700"
            fontSize="34px"
            fontWeight="700"
            lineHeight="100%"
          >
            {brandText}
          </Text>
        </Box>
        
        <Box ms="auto" w={{ base: "unset", md: "unset", xl: "unset" }}>
          {/* Navigation links can be added here */}
        </Box>
      </Flex>
    </Box>
  );
}

