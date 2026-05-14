import { useState, useCallback } from 'react';

import { useChat } from '../../context/ChatContext';
import {
  CONNECTION_STATES,
} from '../../context/ChatContext';

import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

export default function Chat() {

  const {
    currentRoom,
    setCurrentRoom,
    createRoom,
    connectionState,
  } = useChat();

  const [error, setError] =
    useState(null);

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(true);

  const handleCreateRoom =
    useCallback(
      async (
        roomName,
        isPrivate
      ) => {

        try {

          const newRoom =
            await createRoom(
              roomName,
              isPrivate
            );

          setCurrentRoom(
            newRoom
          );

          return newRoom;

        } catch (err) {

          console.error(err);

          setError(
            'Failed to create room. Please try again.'
          );

          throw err;
        }
      },
      [
        createRoom,
        setCurrentRoom,
      ]
    );

  const handleSelectRoom =
    useCallback(
      (room) => {

        setCurrentRoom(room);

        setSidebarOpen(false);
      },
      [setCurrentRoom]
    );

  const getConnectionStatusMessage =
    () => {

      switch (
        connectionState
      ) {

        case CONNECTION_STATES.CONNECTING:
          return 'Connecting...';

        case CONNECTION_STATES.ERROR:
          return 'Connection error';

        case CONNECTION_STATES.CONNECTED:
          return null;

        default:
          return null;
      }
    };

  const connectionStatus =
    getConnectionStatusMessage();

  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-transparent text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(59,130,246,0.24),transparent_30%),radial-gradient(circle_at_85%_12%,rgba(6,182,212,0.14),transparent_30%),radial-gradient(circle_at_40%_100%,rgba(30,41,59,0.35),transparent_34%)]" />

      <div
        className={`
          absolute md:relative z-40 h-full w-full border-r border-slate-700/60 bg-slate-900/75 shadow-[0_28px_70px_rgba(2,6,23,0.5)] backdrop-blur-xl transition-transform duration-300 transform md:w-[23rem]
          ${
            sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'
          }
        `}
      >
        <Sidebar
          onCreateRoom={
            handleCreateRoom
          }
          onSelectRoom={
            handleSelectRoom
          }
        />
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden bg-transparent">

        <div className="md:hidden flex items-center justify-between border-b border-slate-700/60 bg-slate-900/80 px-4 py-3 backdrop-blur-xl">

          <button
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
            className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-700/80"
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-6 w-6 text-slate-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1 className="text-sm font-semibold tracking-[0.08em] text-slate-100">
            {
              currentRoom?.name ||
              'Select a room'
            }
          </h1>

          <div className="w-10" />
        </div>

        {sidebarOpen && (
          <div
            className="md:hidden absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm"
            onClick={() =>
              setSidebarOpen(false)
            }
          />
        )}

        {connectionStatus && (
          <div className="flex items-center justify-center gap-2 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2">

            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></div>

              <div
                className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"
                style={{
                  animationDelay:
                    '0.1s',
                }}
              />

              <div
                className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"
                style={{
                  animationDelay:
                    '0.2s',
                }}
              />
            </div>

            <span className="text-xs font-medium text-amber-100">
              {
                connectionStatus
              }
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 border-b border-rose-500/40 bg-rose-500/10 px-4 py-3">

            <div className="flex-shrink-0 text-rose-300">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-rose-100">
                {error}
              </p>
            </div>

            <button
              onClick={() =>
                setError(null)
              }
              className="text-rose-300 transition hover:text-rose-100"
              aria-label="Close error"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {currentRoom ? (

          <ChatWindow
            room={currentRoom}
          />

        ) : (

          <div className="flex flex-1 items-center justify-center px-6 py-10">

            <div className="max-w-xl animate-in-fade rounded-[2rem] border border-slate-700/70 bg-slate-900/65 p-8 text-center shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur-xl md:p-12">

              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-700/35">

                <svg
                  className="h-9 w-9 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Team messaging workspace
              </p>

              <h2 className="mb-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
                Welcome to SyncRoom
              </h2>

              <p className="mx-auto max-w-lg text-sm leading-6 text-slate-300 md:text-base">
                Select a room from the sidebar or create a new one to start chatting!
              </p>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}