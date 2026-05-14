import { useState } from "react";

import {
  uniqueById,
  sortMessages
} from "../utils/helpers";


const useMessages = () => {

  const [messages, setMessages] =
    useState([]);

  const normalizeMessages = (value) =>
    Array.isArray(value) ? value : [];

  const addMessage = (message) => {

    setMessages((prev) => {

      const safePrev = normalizeMessages(prev);

      const updated = [
        ...safePrev,
        message
      ];

      return sortMessages(
        uniqueById(updated)
      );
    });
  };

  const prependMessages = (
    olderMessages
  ) => {

    setMessages((prev) => {

      const safePrev = normalizeMessages(prev);
      const safeOlderMessages = normalizeMessages(olderMessages);

      const updated = [
        ...safeOlderMessages,
        ...safePrev
      ];

      return sortMessages(
        uniqueById(updated)
      );
    });
  };

  const updateMessage = (
    messageId,
    updates
  ) => {

    const statusRank = {
      sent: 1,
      delivered: 2,
      seen: 3,
    };

    setMessages((prev) =>
      normalizeMessages(prev).map((msg) => {

        const currentMessageId =
          msg.message_id ??
          msg.id;

        if (
          currentMessageId ===
          messageId
        ) {

          const next = {
            ...msg,
            ...updates
          };

          // Keep status monotonic so duplicate/reordered socket events
          // do not regress ticks (e.g., seen -> delivered).
          if (
            updates?.status &&
            statusRank[msg.status] &&
            statusRank[updates.status] &&
            statusRank[updates.status] < statusRank[msg.status]
          ) {
            next.status = msg.status;
          }

          return next;
        }

        return msg;
      })
    );
  };

  const clearMessages = () => {

    setMessages([]);
  };

  return {
    messages,
    setMessages,
    addMessage,
    prependMessages,
    updateMessage,
    clearMessages
  };
};

export default useMessages;