import { ChakraProvider, createSystem, defaultConfig, Box, Text } from '@chakra-ui/react';

const system = createSystem(defaultConfig);

function TestApp() {
  return (
    <ChakraProvider value={system}>
      <Box p={8}>
        <Text fontSize="2xl" color="blue.500">
          Hello Chakra UI!
        </Text>
        <Text mt={4}>
          If you can see this text, Chakra UI is working properly.
        </Text>
      </Box>
    </ChakraProvider>
  );
}

export default TestApp;
