import { Box, Text, Icon } from '@chakra-ui/react';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

interface ErrorAlertProps {
  title: string;
  description: string;
  status?: 'error' | 'info';
}

export default function ErrorAlert({ title, description, status = 'error' }: ErrorAlertProps) {
  const bgColor = status === 'error' ? 'red.50' : 'blue.50';
  const iconColor = status === 'error' ? 'red.500' : 'blue.500';
  const IconComponent = status === 'error' ? FaExclamationTriangle : FaInfoCircle;

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      p={6}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      minHeight="200px"
      mt={4}
    >
      <Icon as={IconComponent} boxSize="40px" color={iconColor} mb={4} />
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        {title}
      </Text>
      <Text maxWidth="sm" color="gray.600">
        {description}
      </Text>
    </Box>
  );
}
