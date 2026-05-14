import { useEffect } from "react";

import socketService from "../services/socket_service";

const useSocket = ({
  url,
  onMessage,
  onOpen,
  onClose
}) => {

  useEffect(() => {

    if (!url) {
      return () => {
        socketService.disconnect();
      };
    }

    socketService.connect({
      url,
      onMessage,
      onOpen,
      onClose
    });

    return () => {
      socketService.disconnect();
    };

  }, [url]);
};

export default useSocket;