import React from 'react';
import {
  Box,
  Text,
  Button,
  VStack
} from '@chakra-ui/react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={8} textAlign="center" maxW="lg" mx="auto" mt={16}>
          <Box 
            bg="red.50" 
            border="1px solid" 
            borderColor="red.200" 
            borderRadius="lg" 
            p={6}
            mb={6}
          >
            <Text fontSize="lg" fontWeight="bold" color="red.700" mb={2}>
              Quelque chose s'est mal passé
            </Text>
            <Text color="red.600">
              Une erreur inattendue s'est produite. Veuillez réessayer.
            </Text>
          </Box>
          
          <VStack gap={4}>
            {this.state.error && (
              <Box w="full">
                <Text cursor="pointer" fontSize="sm" color="gray.600" mb={2} fontWeight="medium">
                  Détails de l'erreur
                </Text>
                <Text fontSize="xs" color="gray.500" p={3} bg="gray.50" borderRadius="md" whiteSpace="pre-wrap">
                  {this.state.error.toString()}
                </Text>
              </Box>
            )}
            
            <Button 
              colorScheme="blue"
              onClick={() => this.setState({ hasError: false })}
            >
              Réessayer
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

