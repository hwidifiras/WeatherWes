// Chakra Imports
import { Button, Icon, useColorMode } from '@chakra-ui/react';
// Custom Icons
import { IoMdMoon, IoMdSunny } from 'react-icons/io';

export default function FixedPlugin(props) {
  const { ...rest } = props;
  const { colorMode, toggleColorMode } = useColorMode();
  let bgButton = 'linear(to-b, brand.400, brand.600)';

  return (
    <Button
      {...rest}
      h="60px"
      w="60px"
      bgGradient={bgButton}
      zIndex="99"
      position="fixed"
      variant="no-effects"
      left={document.documentElement.dir === 'rtl' ? '35px' : ''}
      right={document.documentElement.dir === 'rtl' ? '' : '35px'}
      bottom="30px"
      borderRadius="50px"
      onClick={toggleColorMode}
      display="flex"
      p="0px"
      alignItems="center"
      justifyContent="center"
    >
      <Icon
        h="24px"
        w="24px"
        color="white"
        as={colorMode === 'light' ? IoMdMoon : IoMdSunny}
      />
    </Button>
  );
}
