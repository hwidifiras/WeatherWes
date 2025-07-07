import { Box, Flex } from '@chakra-ui/react';

export const renderTrack = ({ style, ...props }) => {
  const trackStyle = {
    position: 'absolute',
    maxWidth: '100%',
    width: 6,
    transition: 'opacity 200ms ease 0s',
    opacity: 0,
    background: 'transparent',
    bottom: 2,
    top: 2,
    borderRadius: 3,
    right: 0,
  };
  return <div style={{ ...style, ...trackStyle }} {...props} />;
};
export const renderThumb = ({ style, ...props }) => {
  const thumbStyle = {
    borderRadius: 15,
    background: 'rgba(222, 222, 222, .1)',
  };
  return <div style={{ ...style, ...thumbStyle }} {...props} />;
};
export const renderView = ({ style, ...props }) => {
  const viewStyle = {
    marginBottom: -22,
    maxWidth: '100%',
  };
  return (
    <Flex
      direction="column"
      align="center"
      me={{ base: '0px !important', lg: '-16px !important' }}
      style={{ ...style, ...viewStyle }}
      {...props}
    />
  );
};
export const renderViewMini = ({ style, ...props }) => {
  const viewStyle = {
    marginBottom: -22,
    maxWidth: '100%',
  };
  return (
    <Flex
      direction="column"
      align="center"
      w="100%"
      me={{ base: '0px !important', lg: '0px !important' }}
      style={{ ...style, ...viewStyle }}
      {...props}
      overflow="hidden !important"
    />
  );
};

export const kanbanRenderTrack = ({ style, ...props }) => {
  const trackStyle = {
    width: 6,
    transition: 'opacity 200ms ease 0s',
    opacity: 0,
    bottom: 2,
    top: 2,
    borderRadius: 3,
    right: 0,
  };
  return <div style={{ ...style, ...trackStyle }} {...props} />;
};
export const kanbanRenderThumb = ({ style, ...props }) => {
  const thumbStyle = {
    borderRadius: 15,
    background: 'rgba(222, 222, 222, .1)',
  };
  return <div style={{ ...style, ...thumbStyle }} {...props} />;
};
export const kanbanRenderView = ({ style, ...props }) => {
  const viewStyle = {
    position: 'relative',
    marginRight: -15,
  };
  return <div style={{ ...style, ...viewStyle }} {...props} />;
};

export const storiesRenderTrack = ({ style, ...props }) => {
  const trackStyle = {
    width: 6,
    transition: 'opacity 200ms ease 0s',
    opacity: 0,
    bottom: 2,
    top: 2,
    borderRadius: 3,
    right: 0,
  };
  return <div style={{ ...style, ...trackStyle }} {...props} />;
};
export const storiesRenderThumb = ({ style, ...props }) => {
  const thumbStyle = {
    borderRadius: 15,
    background: 'rgba(222, 222, 222, .1)',
  };
  return <div style={{ ...style, ...thumbStyle }} {...props} />;
};
export const storiesRenderView = ({ style, ...props }) => {
  const viewStyle = {
    position: 'relative',
    marginRight: -15,
  };
  return <div style={{ ...style, ...viewStyle }} {...props} />;
};

export const messagesRenderTrack = ({ style, ...props }) => {
  const trackStyle = {
    position: 'absolute',
    maxWidth: '100%',
    width: 6,
    transition: 'opacity 200ms ease 0s',
    opacity: 0,
    background: 'transparent',
    bottom: 2,
    top: 2,
    borderRadius: 3,
    right: 0,
  };
  return <div style={{ ...style, ...trackStyle }} {...props} />;
};
export const messagesRenderThumb = ({ style, ...props }) => {
  const thumbStyle = {
    borderRadius: 15,
    background: 'rgba(222, 222, 222, .1)',
  };
  return <div style={{ ...style, ...thumbStyle }} {...props} />;
};
export const messagesRenderView = ({ style, ...props }) => {
  const viewStyle = {
    marginBottom: -22,
    maxWidth: '100%',
  };
  return <Box style={{ ...style, ...viewStyle }} {...props} />;
};
