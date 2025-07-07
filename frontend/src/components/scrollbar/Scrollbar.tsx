import React from 'react';
import { Box } from '@chakra-ui/react';

// Simple scrollbar renderers for Chakra UI
export const renderThumb = ({ style, ...props }: any) => {
  const thumbStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    ...style,
  };
  return <div style={thumbStyle} {...props} />;
};

export const renderTrack = ({ style, ...props }: any) => {
  const trackStyle = {
    position: 'absolute',
    width: '6px',
    right: '2px',
    bottom: '2px',
    top: '2px',
    borderRadius: '3px',
    ...style,
  };
  return <div style={trackStyle} {...props} />;
};

export const renderView = ({ style, ...props }: any) => {
  const viewStyle = {
    padding: '0 20px',
    ...style,
  };
  return <div style={viewStyle} {...props} />;
};

export const renderViewMini = ({ style, ...props }: any) => {
  const viewStyle = {
    padding: '0 10px',
    ...style,
  };
  return <div style={viewStyle} {...props} />;
};

// Simple scrollbar component that uses native scrolling with custom styling
interface SimpleScrollbarsProps {
  autoHide?: boolean;
  renderTrackVertical?: (props: any) => React.ReactElement;
  renderThumbVertical?: (props: any) => React.ReactElement;
  renderView?: (props: any) => React.ReactElement;
  children: React.ReactNode;
}

export function SimpleScrollbars({ 
  children, 
  renderView = ({ children }: any) => <div>{children}</div> 
}: SimpleScrollbarsProps) {
  return (
    <Box
      overflowY="auto"
      overflowX="hidden"
      h="100%"
      css={{
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '6px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      {renderView({ children })}
    </Box>
  );
}
