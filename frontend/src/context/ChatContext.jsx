import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import { useAuth } from "./AuthContext";

import useMessages from "../hooks/useMesseage";
import useSocket from "../hooks/useSocket";

import socketService from "../services/socket_service";

import {
  fetchRooms as fetchRoomsAPI,
  createRoom as createRoomAPI,
  createOrGetDM as createOrGetDMAPI,
} from "../services/room_service";

import {
  fetchMessages as fetchMessagesAPI,
  fetchUnreadCounts as fetchUnreadCountsAPI,
  markMessagesSeen,
} from "../services/messeage_service";

import {
  buildChatWebSocketUrl,
  buildNotificationWebSocketUrl,
} from "../utils/websocket";

const ChatContext = createContext();

export const CONNECTION_STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
};

export function ChatProvider({ children }) {

  const { token, user, loading: authLoading } = useAuth();

  const getWebSocketToken = useCallback(() => {
    return token || localStorage.getItem("token");
  }, [token]);

  const [rooms, setRooms] = useState([]);

  const [currentRoom, setCurrentRoom] =
    useState(null);

  const [onlineUsers, setOnlineUsers] =
    useState([]);

  const [typingUsers, setTypingUsers] =
    useState([]);

  const [unreadCounts, setUnreadCounts] =
    useState({});

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [connectionState, setConnectionState] =
    useState(
      CONNECTION_STATES.DISCONNECTED
    );

  const [socketUrl, setSocketUrl] =
    useState(null);

  const typingTimeoutRef = useRef(null);
  const unreadFetchTimerRef = useRef(null);
  const unreadFetchLockRef = useRef(false);

  const {
    messages,
    setMessages,
    addMessage,
    prependMessages,
    updateMessage,
    clearMessages,
  } = useMessages();

  // =========================
  // ROOMS
  // =========================

  const fetchRooms = useCallback(async () => {

    try {

      setLoading(true);

      const data =
        await fetchRoomsAPI();

      const roomList =
        Array.isArray(data.results)
          ? data.results
          : data;

      setRooms(roomList);

    } catch (err) {

      console.error(err);

      setError(
        "Failed to fetch rooms"
      );

    } finally {

      setLoading(false);
    }

  }, []);

  const createRoom = useCallback(
    async (name, isPrivate = false) => {

      try {

        const room =
          await createRoomAPI({
            name,
            is_private: isPrivate,
          });

        setRooms((prev) => [
          ...prev,
          room,
        ]);

        return room;

      } catch (err) {

        console.error(err);

        setError(
          "Failed to create room"
        );

        throw err;
      }
    },
    []
  );

  const createOrGetDM = useCallback(
    async (userId) => {
      try {
        const dmRoom = await createOrGetDMAPI(userId);

        setRooms((prev) => {
          // avoid duplicates in rooms list
          if (prev.find((r) => r.id === dmRoom.id)) {
            return prev;
          }

          return [...prev, dmRoom];
        });

        return dmRoom;
      } catch (err) {
        console.error('Failed to create or get DM', err);
        throw err;
      }
    },
    []
  );

  // =========================
  // MESSAGES
  // =========================

  const fetchMessages = useCallback(
    async (roomId) => {

      if (!roomId) return;

      try {

        setLoading(true);

        const data =
          await fetchMessagesAPI(roomId);

        const msgs =
          Array.isArray(data.messages)
            ? data.messages
            : [];

        if (messages.length === 0) {
          setMessages(msgs);
        } else {
          prependMessages(msgs);
        }

      } catch (err) {

        console.error(err);

        setError(
          "Failed to fetch messages"
        );

      } finally {

        setLoading(false);
      }
    },
    [setMessages, prependMessages, messages.length]
  );

  const fetchUnreadCounts = useCallback(
    async () => {

      try {

        const data =
          await fetchUnreadCountsAPI();

        const unreadMap = {};

        data.forEach((item) => {
          // defensive: ensure non-negative counts and numeric
          const count = Number(item.count) || 0;
          unreadMap[item.room] = Math.max(0, count);
        });

        setUnreadCounts(unreadMap);

      } catch (err) {

        console.error(err);
      }
    },
    []
  );

    // Debounced unread counts refresher to avoid API spam
    const scheduleFetchUnreadCounts = useCallback(() => {
      if (unreadFetchTimerRef.current) return;

      unreadFetchTimerRef.current = setTimeout(async () => {
        unreadFetchTimerRef.current = null;

        if (unreadFetchLockRef.current) return;

        unreadFetchLockRef.current = true;
        try {
          await fetchUnreadCounts();
        } catch (e) {
          console.error('Failed to refresh unread counts', e);
        } finally {
          unreadFetchLockRef.current = false;
        }
      }, 300);
    }, [fetchUnreadCounts]);

    const fetchUnreadCountsImmediate = useCallback(async () => {
      if (unreadFetchLockRef.current) return;

      if (unreadFetchTimerRef.current) {
        clearTimeout(unreadFetchTimerRef.current);
        unreadFetchTimerRef.current = null;
      }

      unreadFetchLockRef.current = true;
      try {
        await fetchUnreadCounts();
      } catch (e) {
        console.error('Failed to refresh unread counts', e);
      } finally {
        unreadFetchLockRef.current = false;
      }
    }, [fetchUnreadCounts]);

  // =========================
  // SOCKET MESSAGE HANDLER
  // =========================

  const handleSocketMessage =
    useCallback(
      (data) => {

        // CHAT MESSAGE

        if (
          data.type ===
          "chat_message"
        ) {

          addMessage({
            message_id:
              data.message_id,
            id: data.message_id,
            message: data.message,
            content: data.message,
            username: data.username,
            status:
              data.status || "sent",
            timestamp:
              data.timestamp,
          });

          // REMOVE TYPING

          setTypingUsers((prev) =>
            prev.filter(
              (u) =>
                u !== data.username
            )
          );

          // Handle unread counts for incoming messages
          try {
            const isFromSelf =
              data.user?.id === user?.id ||
              data.username === user?.username;

            const messageRoomId =
              data.room || data.room_id || data.roomId || null;

            if (!isFromSelf && messageRoomId) {
              if (messageRoomId === currentRoom?.id) {
                // Message is for active room: mark as seen immediately
                markMessagesSeen(messageRoomId).catch(e => 
                  console.error('Failed to mark messages as seen', e)
                );
                // Clear unread count for this room locally
                setUnreadCounts((prev) => ({
                  ...prev,
                  [messageRoomId]: 0,
                }));
              } else {
                // Message is for inactive room: schedule unread refresh
                scheduleFetchUnreadCounts();
              }
            }
          } catch (e) {
            // guard: do not break main flow on any unexpected shape
            console.error('Unread refresh guard error', e);
          }
        }

        // TYPING

        if (
          data.type === "typing"
        ) {

          if (
            data.user === user?.username
          ) {
            return;
          }

          if (data.typing) {

            setTypingUsers((prev) => {

              if (
                prev.includes(data.user)
              ) {
                return prev;
              }

              return [
                ...prev,
                data.user,
              ];
            });

            clearTimeout(
              typingTimeoutRef.current
            );

            typingTimeoutRef.current =
              setTimeout(() => {

                setTypingUsers((prev) =>
                  prev.filter(
                    (u) =>
                      u !== data.user
                  )
                );
              }, 3000);

          } else {

            setTypingUsers((prev) =>
              prev.filter(
                (u) =>
                  u !== data.user
              )
            );
          }
        }

        // (room-scoped online updates ignored - use global presence socket)

        // STATUS UPDATE

        if (
          data.type ===
          "message_status" ||
          data.type ===
          "message_status_updated"
        ) {

          updateMessage(
            data.message_id,
            {
              status: data.status,
            }
          );
        }

        // DM / notification type handlers (some backends send these)
        if (
          data.type === 'dm_message_notification' ||
          data.type === 'dm_message' ||
          data.type === 'message_notification'
        ) {
          const roomId = data.room || data.room_id || data.roomId || null;

          if (roomId) {
            if (roomId === currentRoom?.id) {
              // Message is for active room: mark as seen immediately
              markMessagesSeen(roomId).catch(e => 
                console.error('Failed to mark messages as seen', e)
              );
              // Clear unread count for this room locally
              setUnreadCounts((prev) => ({
                ...prev,
                [roomId]: 0,
              }));
            } else {
              // Message is for inactive room: schedule unread refresh
              scheduleFetchUnreadCounts();
            }
          }
        }
      },
      [
        addMessage,
        updateMessage,
        user,
        currentRoom,
        scheduleFetchUnreadCounts,
      ]
    );

  // =========================
  // SOCKET
  // =========================

  useSocket({
    url: socketUrl,

    onMessage:
      handleSocketMessage,

    onOpen: () => {

      setConnectionState(
        CONNECTION_STATES.CONNECTED
      );
      // ensure unread counts are consistent after reconnect
      try {
        fetchUnreadCountsImmediate();
      } catch (e) {
        console.error('Failed scheduling unread refresh on socket open', e);
      }
    },

    onClose: () => {

      setConnectionState(
        CONNECTION_STATES.DISCONNECTED
      );
    },
  });

  // Notifications / presence socket
  const handleNotificationMessage = useCallback((data) => {

    try {
      if (data.type === 'presence_init') {
        setOnlineUsers(Array.isArray(data.online_users) ? data.online_users : []);
        return;
      }

      if (data.type === 'user_online') {
        setOnlineUsers((prev) => {
          if (prev.includes(data.username)) return prev;
          return [...prev, data.username].sort();
        });
        return;
      }

      if (data.type === 'user_offline') {
        setOnlineUsers((prev) => prev.filter((u) => u !== data.username));
        return;
      }
    } catch (e) {
      console.error('Notification message handler error', e);
    }

  }, []);

  useEffect(() => {

    // only connect notifications socket when auth is initialized and user is available
    const wsToken = getWebSocketToken();

    if (!wsToken || authLoading || !user) {
      socketService.disconnectNotifications();
      return;
    }

    const url = buildNotificationWebSocketUrl({ token: wsToken });

    if (!url) {
      return;
    }

    console.log("[WS:notifications] connect", url);

    socketService.connectNotifications({
      url,
      onMessage: handleNotificationMessage,
      onOpen: () => {},
      onClose: () => {},
    });

    return () => {
      socketService.disconnectNotifications();
    };

  }, [getWebSocketToken, authLoading, user, handleNotificationMessage]);

  const connectSocket = useCallback(
    (roomName) => {

      const normalizedRoomName =
        roomName?.trim();
      const wsToken = getWebSocketToken();

      if (!wsToken || !normalizedRoomName) {

        socketService.disconnect();

        setSocketUrl(null);

        setConnectionState(
          CONNECTION_STATES.DISCONNECTED
        );

        return;
      }

      const url = buildChatWebSocketUrl({
        roomName: normalizedRoomName,
        token: wsToken,
      });

      if (!url) {
        return;
      }

      if (socketUrl === url) {
        return;
      }

      socketService.disconnect();

      setConnectionState(
        CONNECTION_STATES.CONNECTING
      );

      console.log("[WS:room] connect", url);

      setSocketUrl(url);
    },
    [getWebSocketToken, socketUrl]
  );

  const disconnectSocket =
    useCallback(() => {

      socketService.disconnect();

      setSocketUrl(null);

      setConnectionState(
        CONNECTION_STATES.DISCONNECTED
      );
    }, []);

  // =========================
  // SEND MESSAGE
  // =========================

  const sendMessage = useCallback(
    (message) => {

      if (!message?.trim()) {
        console.warn("⚠️ sendMessage called with empty message");
        return false;
      }

      console.log("📤 Attempting to send message:", message);

      const success = socketService.send({
        message,
      });

      if (!success) {
        console.error("❌ Failed to send message - WebSocket not ready");
        throw new Error("WebSocket connection not ready. Please wait for connection to establish.");
      }

      console.log("✅ Message sent to socket");
      return true;
    },
    []
  );

  const sendTypingIndicator =
    useCallback(() => {

      socketService.send({
        type: "typing",
        typing: true,
      });
    }, []);

  // =========================
  // ROOM SWITCH
  // =========================

  const changeRoom = useCallback(
    async (room) => {

      if (!room) return;

      // Before switching: mark current room's messages as seen
      if (currentRoom?.id) {
        await markMessagesSeen(currentRoom.id).catch(e =>
          console.error('Failed to mark current room as seen', e)
        );

        // Refresh unread counts
        await fetchUnreadCountsImmediate();
      }

      disconnectSocket();

      clearMessages();

      setCurrentRoom(room);

      await fetchMessages(room.id);

      connectSocket(room.name);

      await markMessagesSeen(room.id);

      // locally clear the active room unread count immediately
      setUnreadCounts((prev) => ({
        ...prev,
        [room.id]: 0,
      }));

      // refresh global unread counts after marking seen
      try {
        await fetchUnreadCountsImmediate();
      } catch (e) {
        console.error('Failed to refresh unread counts after opening room', e);
      }
    },
    [
      clearMessages,
      disconnectSocket,
      fetchMessages,
      connectSocket,
      currentRoom,
      fetchUnreadCountsImmediate,
    ]
  );

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {

    if (!token || authLoading) return;

    fetchRooms();

    fetchUnreadCounts();

  }, [
    token,
    authLoading,
    fetchRooms,
    fetchUnreadCounts,
  ]);

  // =========================
  // CLEANUP
  // =========================

  useEffect(() => {

    return () => {

      socketService.disconnect();
    };
  }, []);

  // =========================
  // CONTEXT VALUE
  // =========================

  const value = {

    rooms,

    currentRoom,

    messages,

    onlineUsers,

    typingUsers,

    loading,

    error,

    connectionState,

    unreadCounts,

    setCurrentRoom:
      changeRoom,

    fetchRooms,

    fetchMessages,

    fetchUnreadCounts,

    createRoom,
    createOrGetDM,

    connectSocket,

    disconnectSocket,

    sendMessage,

    sendTypingIndicator,

    prependMessages,

    markMessagesSeen,
  };

  return (
    <ChatContext.Provider
      value={value}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {

  const context =
    useContext(ChatContext);

  if (!context) {

    throw new Error(
      "useChat must be used within ChatProvider"
    );
  }

  return context;
}