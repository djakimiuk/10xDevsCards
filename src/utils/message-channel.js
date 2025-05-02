const MessageChannel = {
  port1: {
    postMessage: () => undefined,
    onmessage: null,
  },
  port2: {
    postMessage: () => undefined,
    onmessage: null,
  },
};

export default MessageChannel;
