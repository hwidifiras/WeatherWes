import { Box } from '@chakra-ui/react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  variant: ToastVariant;
  title: string;
  description?: string;
  onClose?: () => void;
}

export const SimpleToast = ({ 
  variant, 
  title, 
  description, 
  onClose 
}: ToastProps) => {
  const bgColor = {
    success: 'green.500',
    error: 'red.500',
    warning: 'orange.500',
    info: 'blue.500'
  }[variant];

  return (
    <Box
      bg={bgColor}
      color="white"
      p={4}
      borderRadius="md"
      boxShadow="lg"
      position="relative"
      maxW="sm"
    >
      <Box fontWeight="bold" mb={description ? 2 : 0}>
        {title}
      </Box>
      {description && (
        <Box fontSize="sm">
          {description}
        </Box>
      )}
      {onClose && (
        <Box
          position="absolute"
          top={2}
          right={2}
          cursor="pointer"
          onClick={onClose}
        >
          ×
        </Box>
      )}
    </Box>
  );
};

export default SimpleToast;
