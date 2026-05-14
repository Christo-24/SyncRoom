import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {
  useChat,
  CONNECTION_STATES,
} from '../../context/ChatContext';

import {
  useAuth,
} from '../../context/AuthContext';

import MessageList from './MessageList';
import ParticipantModal from '../participants/participantModel';

import {
  Send,
  Users,
  Sparkles,
  Shield,
  ChevronRight,
  SmilePlus,
} from 'lucide-react';

const QUICK_EMOJIS = [
  '😊',
  '😂',
  '😢',
  '😍',
  '🎉',
  '👍',
  '❤️',
  '🔥',
  '💯',
  '🚀',
];

export default function ChatWindow({
  room,
}) {

  const {
    messages,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    connectionState,
  } = useChat();

  const { user } =
    useAuth();

  const [
    messageText,
    setMessageText,
  ] = useState('');

  const [
    isTyping,
    setIsTyping,
  ] = useState(false);

  const [
    isSending,
    setIsSending,
  ] = useState(false);

  const [
    showParticipants,
    setShowParticipants,
  ] = useState(false);

  const [
    showEmojiPicker,
    setShowEmojiPicker,
  ] = useState(false);

  const [
    sendError,
    setSendError,
  ] = useState(null);

  const typingTimeoutRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  const messageInputRef =
    useRef(null);

  const emojiPickerRef =
    useRef(null);

  const participants =
    room?.participants_list ||
    [];

  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: 'smooth',
      });

  }, [messages]);

  useEffect(() => {

    messageInputRef.current
      ?.focus();

  }, [room?.id]);

  useEffect(() => {

    return () => {

      if (
        typingTimeoutRef.current
      ) {

        clearTimeout(
          typingTimeoutRef.current
        );
      }
    };

  }, []);

  useEffect(() => {

    const handleClickOutside =
      (event) => {

        if (
          emojiPickerRef.current &&
          !emojiPickerRef.current.contains(
            event.target
          )
        ) {

          setShowEmojiPicker(
            false
          );
        }
      };

    if (showEmojiPicker) {

      document.addEventListener(
        'mousedown',
        handleClickOutside
      );

      return () =>
        document.removeEventListener(
          'mousedown',
          handleClickOutside
        );
    }

  }, [showEmojiPicker]);

  const addEmoji =
    useCallback((emoji) => {

      setMessageText(
        (prev) => prev + emoji
      );

      messageInputRef.current
        ?.focus();

    }, []);

  const handleInputChange =
    useCallback(
      (e) => {

        setSendError(null);

        setMessageText(
          e.target.value
        );

        if (!isTyping) {

          setIsTyping(true);

          sendTypingIndicator();
        }

        clearTimeout(
          typingTimeoutRef.current
        );

        typingTimeoutRef.current =
          setTimeout(() => {

            setIsTyping(false);

          }, 2000);
      },
      [
        isTyping,
        sendTypingIndicator,
      ]
    );

  const handleSendMessage =
    useCallback(
      async (e) => {

        e.preventDefault();

        setSendError(null);

        const trimmedText =
          messageText.trim();

        if (
          !trimmedText ||
          !room ||
          isSending ||
          connectionState !==
            CONNECTION_STATES.CONNECTED
        ) {

          return;
        }

        if (
          trimmedText.length >
          5000
        ) {

          setSendError(
            'Message is too long (max 5000 characters)'
          );

          return;
        }

        try {

          setIsSending(true);

          sendMessage(
            trimmedText
          );

          setMessageText('');

          setIsTyping(false);

          messageInputRef.current
            ?.focus();

        } catch (err) {

          console.error(err);

          setSendError(
            err.message ||
            'Failed to send message'
          );

        } finally {

          setIsSending(false);
        }
      },
      [
        messageText,
        room,
        isSending,
        sendMessage,
        connectionState,
      ]
    );

  if (!room) {

    return null;
  }

  let displayName =
    room.name;

  let dmOtherUsername =
    null;

  if (room.is_private) {

    const roomParticipantsData =
      room.participants_list ||
      [];

    const otherUser =
      roomParticipantsData.find(
        (participant) =>
          participant.username !==
          user?.username
      );

    dmOtherUsername =
      otherUser?.username ||
      null;

    displayName =
      otherUser
        ? `DM: ${otherUser.username}`
        : 'DM: Unknown';
  }

  const dmInitial = (
    dmOtherUsername?.charAt(
      0
    ) || '?'
  ).toUpperCase();

  const isDMOnline =
    dmOtherUsername
      ? onlineUsers.includes(
          dmOtherUsername
        )
      : false;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-transparent">

      <div className="relative">
        <div className="hidden items-center justify-between border-b border-slate-700/60 bg-slate-900/70 px-5 py-4 backdrop-blur-xl md:flex">
          <div className="flex min-w-0 flex-1 items-start gap-3">

            {room.is_private ? (

              <div className="relative mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-700 text-slate-100 shadow-lg shadow-slate-950/40">

                <span className="text-sm font-semibold">
                  {dmInitial}
                </span>

                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-slate-900 ${
                    isDMOnline
                      ? 'bg-emerald-400'
                      : 'bg-slate-500'
                  }`}
                />
              </div>

            ) : (

              <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-900/35">

                <Sparkles className="h-5 w-5" />
              </div>
            )}

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <h2 className="truncate text-lg font-semibold tracking-tight text-slate-100">
                  {displayName}
                </h2>

                {!room.is_private && (

                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">

                    <Shield className="h-3.5 w-3.5" />

                    Public
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">

                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <p>
                  {room.is_private
                    ? (
                        isDMOnline
                          ? 'Online'
                          : 'Offline'
                      )
                    : `${onlineUsers.length} online`}
                </p>
              </div>
            </div>
          </div>

          {!room.is_private && (

            <button
              onClick={() =>
                setShowParticipants(
                  !showParticipants
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-700/90"
              aria-label="Show participants"
            >

              <Users className="h-5 w-5 text-slate-300" />

              <span>
                {participants.length}
              </span>

              <ChevronRight
                className={`h-4 w-4 transition ${
                  showParticipants
                    ? 'rotate-90'
                    : ''
                }`}
              />
            </button>
          )}
        </div>

        {/* overlay panel mounts here so it can be anchored under header */}
        {!room.is_private && (
          <ParticipantModal room={room} expanded={showParticipants} onClose={() => setShowParticipants(false)} />
        )}
      </div>

      <div className="flex-1 overflow-hidden md:px-0">

        

        <div className="flex h-full flex-1 flex-col overflow-hidden">

          <MessageList
            messages={messages}
            currentUser={user}
            room={room}
          />

          <div
            ref={messagesEndRef}
          />
        </div>
      </div>

      {typingUsers.length >
        0 && (

        <div className="border-t border-slate-700/60 bg-slate-900/70 px-5 py-3 text-xs text-slate-300 backdrop-blur-xl">

          <div className="flex items-center gap-2">

            <span className="font-medium tracking-wide">

              {typingUsers.join(
                ', '
              )}{' '}

              {typingUsers.length ===
              1
                ? 'is'
                : 'are'}{' '}

              typing
            </span>

            <div className="flex gap-1">

              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300"></div>

              <div className="delay-100 h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300"></div>

              <div className="delay-200 h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300"></div>
            </div>
          </div>
        </div>
      )}

      {sendError && (

        <div className="border-t border-rose-500/40 bg-rose-500/10 px-4 py-2">

          <p className="text-xs text-rose-100 font-medium">
            {sendError}
          </p>
        </div>
      )}

      <form
        onSubmit={
          handleSendMessage
        }
        className="border-t border-slate-700/60 bg-slate-900/75 p-4 backdrop-blur-xl"
      >

        <div className="flex gap-3 rounded-3xl border border-slate-700 bg-slate-800/90 p-3 shadow-[0_12px_30px_rgba(2,6,23,0.45)]">

          <input
            ref={messageInputRef}
            type="text"
            value={messageText}
            onChange={
              handleInputChange
            }
            placeholder="Type a message..."
            disabled={
              isSending ||
              connectionState !==
                CONNECTION_STATES.CONNECTED
            }
            className="flex-1 border-0 bg-transparent py-2 shadow-none focus:ring-0 text-slate-100 placeholder-slate-400 disabled:opacity-50"
            aria-label="Message input"
            maxLength="5000"
            autoFocus
          />

          <div className="relative">

            <button
              type="button"
              onClick={() =>
                setShowEmojiPicker(
                  !showEmojiPicker
                )
              }
              className="inline-flex items-center justify-center rounded-full p-2 text-slate-300 transition hover:bg-slate-700 hover:text-slate-100"
              aria-label="Open emoji picker"
            >

              <SmilePlus className="h-5 w-5" />
            </button>

            {showEmojiPicker && (

              <div
                ref={emojiPickerRef}
                className="absolute bottom-12 right-0 z-50 grid grid-cols-6 sm:grid-cols-6 md:grid-cols-8 gap-2 rounded-2xl border border-slate-600 bg-slate-800 p-3 shadow-lg max-h-60 w-56 sm:w-72 overflow-auto"
              >

                {QUICK_EMOJIS.map((emoji) => (

                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      addEmoji(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="flex items-center justify-center rounded-lg p-2 text-xl transition transform duration-150 hover:scale-110 hover:bg-slate-700/60"
                  >

                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">

            <span className="text-xs text-slate-400">

              {
                messageText.length
              }
              /5000
            </span>

            <button
              type="submit"
              disabled={
                !messageText.trim() ||
                isSending ||
                connectionState !==
                  CONNECTION_STATES.CONNECTED
              }
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 font-medium text-white transition hover:-translate-y-0.5 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 disabled:brightness-75"
              aria-label="Send message"
            >

              <Send className="h-4 w-4" />

              <span className="hidden sm:inline">

                {isSending
                  ? 'Sending...'
                  : 'Send'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}