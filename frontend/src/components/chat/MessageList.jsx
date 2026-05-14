import {
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
} from 'react';

import {
  useChat,
} from '../../context/ChatContext';

import MessageStatus
  from './MessageStatus';

import {
  formatTime,
} from '../../utils/formater';

const MessageItem = memo(
  ({
    msg,
    isOwn,
    currentUser,
    room,
  }) => {

    const displayUsername =
      String(
        msg.username ||
        msg.user?.username ||
        'Anonymous'
      );

    const avatarInitial =
      displayUsername
        .charAt(0)
        .toUpperCase();

    return (
      <div
        className={`group animate-in-fade flex gap-3 ${
          isOwn
            ? 'justify-end'
            : ''
        }`}
      >

        {!isOwn ? (

          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-blue-900/35">

            <span className="text-xs font-semibold text-white">

              {avatarInitial}
            </span>
          </div>

        ) : (

          <div className="w-8 flex-shrink-0" />
        )}

        <div
          className={`flex max-w-full flex-col ${
            isOwn
              ? 'items-end'
              : 'items-start'
          }`}
        >

          {!isOwn && (

            <p className="mb-1 text-xs font-semibold tracking-wide text-slate-300">

              {displayUsername}
            </p>
          )}

          <div
            className={`max-w-[min(32rem,80vw)] break-words rounded-2xl px-4 py-3 shadow-sm transition-transform duration-200 group-hover:translate-y-[-1px] ${
              isOwn
                ? `rounded-br-md bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-blue-900/40 ${
                    msg.isOptimistic
                      ? 'opacity-75'
                      : ''
                  }`
                : 'rounded-bl-md border border-slate-700 bg-slate-800/85 text-slate-100'
            }`}
          >

            <p className="text-sm leading-6 whitespace-pre-wrap">

              {
                msg.message ||
                msg.content
              }
            </p>
          </div>

          <div className="mt-1 flex items-center gap-2">

            <p
              className={`text-xs opacity-75 transition-opacity group-hover:opacity-100 ${
                isOwn
                  ? 'text-right text-slate-300'
                  : 'text-left text-slate-400'
              }`}
            >

              {formatTime(
                msg.timestamp
              )}

              {isOwn &&
                msg.isOptimistic && (

                <span className="ml-1 text-xs text-amber-400">

                  sending...
                </span>
              )}
            </p>

            {isOwn &&
              msg.status &&
              room?.is_private && (

              <MessageStatus
                status={
                  msg.status
                }
              />
            )}
          </div>
        </div>

        {isOwn && (

          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-700 text-xs font-semibold text-slate-200">

            {(
              currentUser?.username?.charAt(
                0
              ) || 'Y'
            ).toUpperCase()}
          </div>
        )}
      </div>
    );
  }
);

MessageItem.displayName =
  'MessageItem';

export default function MessageList({
  messages,
  currentUser,
  room,
}) {

  const safeMessages = Array.isArray(messages)
    ? messages
    : [];

  const {
    hasMoreMessages,
    loadMoreMessages,
    currentRoom,
  } = useChat();

  const messagesEndRef =
    useRef(null);

  const scrollContainerRef =
    useRef(null);

  const [
    isLoadingMore,
    setIsLoadingMore,
  ] = useState(false);

  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: 'smooth',
      });

  }, [
    room?.id,
    safeMessages.length,
  ]);

  const handleScroll =
    useCallback(async () => {

      const container =
        scrollContainerRef.current;

      if (!container) {
        return;
      }

      if (
        container.scrollTop <
          50 &&
        hasMoreMessages &&
        !isLoadingMore &&
        currentRoom
      ) {

        try {

          setIsLoadingMore(
            true
          );

          await loadMoreMessages(
            currentRoom.id
          );

        } catch (err) {

          console.error(err);

        } finally {

          setIsLoadingMore(
            false
          );
        }
      }

    }, [
      hasMoreMessages,
      isLoadingMore,
      currentRoom,
      loadMoreMessages,
    ]);

  useEffect(() => {

    const container =
      scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.addEventListener(
      'scroll',
      handleScroll
    );

    return () => {

      container.removeEventListener(
        'scroll',
        handleScroll
      );
    };

  }, [handleScroll]);

  const formatDate = (
    timestamp
  ) => {

    if (!timestamp) {
      return '';
    }

    try {

      const date =
        new Date(
          timestamp
        );

      const today =
        new Date();

      const yesterday =
        new Date(today);

      yesterday.setDate(
        yesterday.getDate() - 1
      );

      if (
        date.toDateString() ===
        today.toDateString()
      ) {

        return 'Today';
      }

      if (
        date.toDateString() ===
        yesterday.toDateString()
      ) {

        return 'Yesterday';
      }

      return date.toLocaleDateString(
        [],
        {
          month: 'short',
          day: 'numeric',
        }
      );

    } catch {

      return '';
    }
  };

  const groupedMessages =
    safeMessages.reduce(
      (
        acc,
        message,
        index
      ) => {

        const currentDate =
          formatDate(
            message.timestamp
          );

        const lastDate =
          index > 0
            ? formatDate(
                safeMessages[
                  index - 1
                ].timestamp
              )
            : null;

        if (
          currentDate !==
          lastDate
        ) {

          acc.push({
            type: 'date',
            date: currentDate,
          });
        }

        acc.push({
          type: 'message',
          message,
        });

        return acc;

      },
      []
    );

  const isOwnMessage =
    useCallback(
      (msg) => {

        return (
          msg.username ===
            currentUser?.username ||

          msg.user?.username ===
            currentUser?.username
        );
      },
      [currentUser]
    );

  return (
    <div
      ref={
        scrollContainerRef
      }
      className="flex flex-1 flex-col overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.5),rgba(15,23,42,0.75))]"
    >

      {isLoadingMore && (

        <div className="flex justify-center py-4">

          <div className="flex gap-2 rounded-full border border-slate-700 bg-slate-800/90 px-4 py-2 shadow-sm">

            <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-300"></div>

            <div className="delay-100 h-2 w-2 animate-bounce rounded-full bg-cyan-300"></div>

            <div className="delay-200 h-2 w-2 animate-bounce rounded-full bg-cyan-300"></div>
          </div>
        </div>
      )}

      {safeMessages.length ===
      0 ? (

        <div className="flex flex-1 items-center justify-center px-4 text-center">

          <div className="max-w-sm animate-in-fade rounded-[2rem] border border-slate-700/80 bg-slate-900/65 px-8 py-10 shadow-[0_18px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 shadow-inner">

              <svg
                className="h-8 w-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>

            <h3 className="mb-2 text-lg font-semibold text-slate-100">

              No messages yet
            </h3>

            <p className="text-sm leading-6 text-slate-400">

              Start the conversation by sending the first message!
            </p>
          </div>
        </div>

      ) : (

        <div className="flex flex-col gap-4 px-4 py-5 md:px-6 md:py-6">

          {groupedMessages.map(
            (
              item,
              index
            ) => {

              if (
                item.type ===
                'date'
              ) {

                return (

                  <div
                    key={`date-${index}`}
                    className="flex justify-center"
                  >

                    <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300 shadow-sm">

                      {item.date}
                    </span>
                  </div>
                );
              }

              const msg =
                item.message;

              const isOwn =
                isOwnMessage(
                  msg
                );

              return (

                <MessageItem
                  key={
                    msg.message_id ||
                    msg.id ||
                    index
                  }
                  msg={msg}
                  isOwn={isOwn}
                  currentUser={
                    currentUser
                  }
                  room={room}
                />
              );
            }
          )}

        </div>
      )}

      <div
        ref={
          messagesEndRef
        }
      />
    </div>
  );
}