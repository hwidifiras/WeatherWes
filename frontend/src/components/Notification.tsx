import { Box } from '@chakra-ui/react';
import { IoCheckmarkCircle, IoCloseCircle, IoWarning, IoInformationCircle, IoClose } from 'react-icons/io5';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  title: string;
  description?: string;
  onClose: () => void;
}

const getNotificationConfig = (type: NotificationType) => {
  const configs = {
    success: {
      bgColor: 'green.500',
      icon: IoCheckmarkCircle,
      color: 'white'
    },
    error: {
      bgColor: 'red.500',
      icon: IoCloseCircle,
      color: 'white'
    },
    warning: {
      bgColor: 'orange.500',
      icon: IoWarning,
      color: 'white'
    },
    info: {
      bgColor: 'blue.500',
      icon: IoInformationCircle,
      color: 'white'
    }
  };
  return configs[type];
};

export const Notification = ({ type, title, description, onClose }: NotificationProps) => {
  const config = getNotificationConfig(type);
  const IconComponent = config.icon;

  return (
    <Box
      bg={config.bgColor}
      color={config.color}
      p={4}
      borderRadius="md"
      mb={4}
      display="flex"
      alignItems="flex-start"
      gap={3}
      position="relative"
      boxShadow="lg"
    >
      <IconComponent size={20} />
      <Box flex="1">
        <Box fontWeight="bold" mb={description ? 1 : 0}>
          {title}
        </Box>
        {description && (
          <Box fontSize="sm" opacity={0.9}>
            {description}
          </Box>
        )}
      </Box>
      <Box
        cursor="pointer"
        onClick={onClose}
        p={1}
        borderRadius="sm"
        _hover={{ bg: 'blackAlpha.200' }}
      >
        <IoClose size={16} />
      </Box>
    </Box>
  );
};
