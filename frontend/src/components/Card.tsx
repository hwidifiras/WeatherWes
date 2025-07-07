import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface CardProps {
  variant?: string;
  children: ReactNode;
  bg?: string;
  p?: string | number;
  borderRadius?: string;
  boxShadow?: string;
  border?: string;
  borderColor?: string;
}

function Card(props: CardProps) {
  const { children, ...rest } = props;

  return (
    <Box
      bg="white"
      p="6"
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      {...rest}
    >
      {children}
    </Box>
  );
}

export default Card;

