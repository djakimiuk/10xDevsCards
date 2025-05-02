export class MessageChannel {
  constructor() {
    this.port1 = {
      postMessage: () => {},
      onmessage: null,
    };
    this.port2 = {
      postMessage: () => {},
      onmessage: null,
    };
  }
}

export default MessageChannel;
