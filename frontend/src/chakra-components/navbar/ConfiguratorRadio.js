// Chakra Imports
import {
  Button,
  Flex,
  useColorModeValue,
  Radio,
  useRadio,
} from '@chakra-ui/react';
// Assets
export default function ConfiguratorRadio(props) {
  const borderButton = useColorModeValue('secondaryGray.100', 'whiteAlpha.200');
  const activeShadow = useColorModeValue(
    '0px 18px 40px rgba(112, 144, 176, 0.22)',
    'none',
  );
  const Bg = useColorModeValue('white', 'navy.700');
  const activeBg = useColorModeValue('#F7F9FF', 'whiteAlpha.100');
  //eslint-disable-next-line
  const { getInputProps, getCheckboxProps } = useRadio(props);
  const input = getInputProps();
  return (
    <Button
      h="max-content"
      py="16px"
      border="1px solid"
      display={'flex'}
      flexDirection="column"
      bg={props.active === true ? Bg : 'transparent'}
      boxShadow={props.active === true ? activeShadow : 'none'}
      _hover={{ background: Bg, boxShadow: activeShadow }}
      _focus={{ background: Bg, boxShadow: activeShadow }}
      _active={{ background: activeBg, boxShadow: activeShadow }}
      borderColor={borderButton}
      onClick={props.onClick}
      as="label"
      px={{ base: '10px', md: 'none' }}
    >
      <input {...input} />
      <Flex w="100%" justifyContent={'space-between'} mb="10px">
        {props.label}
        <Radio colorScheme="brand" isChecked={props.active} />
      </Flex>
      {props.children}
    </Button>
  );
}
