import { Flex, Text } from '@chakra-ui/react';

interface SidebarBrandProps {
  mini?: boolean;
  hovered?: boolean;
}

export function SidebarBrand({ mini = true, hovered = false }: SidebarBrandProps) {
  const showFullLogo = !mini || (mini && hovered);

  return (
    <Flex alignItems="center" flexDirection="column" px="20px">
      <Text
        fontSize={showFullLogo ? '24px' : '20px'}
        fontWeight="bold"
        color="blue.600"
        my="32px"
        textAlign="center"
        transition="all 0.2s"
        opacity={showFullLogo ? 1 : 0.9}
      >
        {showFullLogo ? 'WeatherWeS' : 'WW'}
      </Text>
    </Flex>
  );
}

export default SidebarBrand;

