import {
  useState,
  useMemo,
  useCallback,
  memo,
} from 'react';

import {
  useChat,
} from '../../context/ChatContext';

import {
  useAuth,
} from '../../context/AuthContext';

import DMUserList from './DMUserList';

import {
  Plus,
  Search,
  Settings,
  LogOut,
  Lock,
  Globe,
  Hash,
} from 'lucide-react';

function RoomButton({
  room,
  active,
  unreadCount,
  onClick,
}) {

  return (
    <button
      onClick={onClick}
      className={`group animate-in-fade flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition duration-200 ${
        active
          ? 'border-blue-400/40 bg-blue-500/15 text-blue-100 shadow-lg shadow-blue-900/25'
          : 'border-slate-800 bg-slate-800/50 text-slate-200 hover:border-slate-600 hover:bg-slate-800/80 hover:shadow-md hover:shadow-slate-950/30'
      }`}
    >

      <div className="flex min-w-0 items-center gap-3">

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            active
              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
              : 'bg-slate-700 text-slate-300'
          }`}
        >

          <Hash className="h-4 w-4 flex-shrink-0" />
        </div>

        <div className="min-w-0">

          <span className="block truncate text-sm font-semibold">

            {room.name}
          </span>

          <span className="block text-xs text-slate-400">

            Public space
          </span>
        </div>
      </div>

      {unreadCount > 0 && (

        <span className="ml-3 inline-flex shrink-0 items-center justify-center rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg shadow-rose-900/40">

          {unreadCount}
        </span>
      )}
    </button>
  );
}

const MemoizedRoomButton =
  memo(RoomButton);

function DMButton({
  room,
  active,
  unreadCount,
  displayName,
  isOnline,
  onClick,
}) {

  const initial = (
    displayName?.charAt(
      0
    ) || '?'
  ).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`group animate-in-fade flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition duration-200 ${
        active
          ? 'border-blue-400/40 bg-blue-500/15 text-blue-100 shadow-lg shadow-blue-900/25'
          : 'border-slate-800 bg-slate-800/50 text-slate-200 hover:border-slate-600 hover:bg-slate-800/80 hover:shadow-md hover:shadow-slate-950/30'
      }`}
    >

      <div className="flex min-w-0 items-center gap-3">

        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-slate-100">

          <span className="text-xs font-semibold">

            {initial}
          </span>

          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-slate-900 ${
              isOnline
                ? 'bg-emerald-400'
                : 'bg-slate-500'
            }`}
          />
        </div>

        <div className="min-w-0">

          <span className="block truncate text-sm font-semibold">

            {displayName}
          </span>

          <span className="block text-xs text-slate-400">

            {isOnline
              ? 'Online now'
              : 'Offline'}
          </span>
        </div>
      </div>

      {unreadCount > 0 && (

        <span className="ml-3 inline-flex shrink-0 items-center justify-center rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg shadow-rose-900/40">

          {unreadCount}
        </span>
      )}
    </button>
  );
}

const MemoizedDMButton =
  memo(DMButton);

export default function Sidebar({
  onCreateRoom,
  onSelectRoom,
}) {

  const {
    rooms,
    currentRoom,
    unreadCounts,
    onlineUsers,
  } = useChat();

  const {
    logout,
    user,
  } = useAuth();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    showCreateRoom,
    setShowCreateRoom,
  ] = useState(false);

  const [
    showUserMenu,
    setShowUserMenu,
  ] = useState(false);

  const getDMDisplayName =
    useCallback(
      (room) => {

        if (
          !room.is_private
        ) {

          return room.name;
        }

        const participants =
          room.participants_list ||
          [];

        const otherUser =
          participants.find(
            (
              participant
            ) =>
              participant.username !==
              user?.username
          );

        return (
          otherUser?.username ||
          'Unknown'
        );
      },
      [user]
    );

  const publicRooms =
    useMemo(
      () =>
        rooms.filter(
          (room) =>
            !room.is_private
        ),
      [rooms]
    );

  const dmRooms = useMemo(
    () =>
      rooms.filter(
        (room) =>
          room.is_private
      ),
    [rooms]
  );

  const filteredPublicRooms =
    useMemo(() => {

      if (!searchQuery) {
        return publicRooms;
      }

      return publicRooms.filter(
        (room) =>
          room.name
            ?.toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            )
      );

    }, [
      publicRooms,
      searchQuery,
    ]);

  const filteredDMRooms =
    useMemo(() => {

      if (!searchQuery) {
        return dmRooms;
      }

      return dmRooms.filter(
        (room) =>
          getDMDisplayName(
            room
          )
            ?.toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            )
      );

    }, [
      dmRooms,
      searchQuery,
      getDMDisplayName,
    ]);

  const handleSelectRoom =
    useCallback(
      (room) => {

        onSelectRoom(room);

        setSearchQuery('');

      },
      [onSelectRoom]
    );

  const isDMOnline =
    useCallback(
      (room) => {

        if (
          !room?.is_private
        ) {

          return false;
        }

        const otherUser =
          (
            room.participants_list ||
            []
          ).find(
            (
              participant
            ) =>
              participant.username !==
              user?.username
          );

        return Boolean(
          otherUser?.username &&
          onlineUsers?.includes(
            otherUser.username
          )
        );

      },
      [
        onlineUsers,
        user,
      ]
    );

  const isRoomActive =
    useCallback(
      (room) =>
        currentRoom?.id ===
        room.id,
      [currentRoom]
    );

  return (
    <div className="flex h-full flex-col bg-slate-900/80 text-slate-100">

      <div className="border-b border-slate-700/70 p-4 lg:p-5">

        <div className="relative mb-5 flex items-start justify-between gap-3">

          <div>

            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">

              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              Live
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-50">

              SyncRoom
            </h1>

            <p className="mt-1 text-sm text-slate-400">

              Rooms, DMs, and live presence
            </p>
          </div>

          <button
            onClick={() =>
              setShowUserMenu(
                !showUserMenu
              )
            }
            className="relative rounded-xl border border-slate-700 bg-slate-800/85 p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-700/85"
            aria-label="User menu"
          >

            <Settings className="h-5 w-5 text-slate-300" />
          </button>

          {showUserMenu && (

            <div className="animate-pop absolute right-0 top-14 z-50 w-56 rounded-2xl border border-slate-700/80 bg-slate-900 p-3 shadow-[0_20px_50px_rgba(2,6,23,0.5)] backdrop-blur-xl">

              <div className="border-b border-slate-700 pb-3">

                <p className="text-sm font-semibold text-slate-100">

                  {user?.username}
                </p>

                <p className="truncate text-xs text-slate-400">

                  {user?.email}
                </p>
              </div>

              <button
                onClick={() => {

                  logout();

                  setShowUserMenu(
                    false
                  );
                }}
                className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10"
              >

                <LogOut className="h-4 w-4" />

                <span>
                  Logout
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="relative">

          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

          <input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            className="input-field w-full py-3 pl-11 text-sm"
            aria-label="Search rooms"
          />
        </div>

        <button
          onClick={() =>
            setShowCreateRoom(
              true
            )
          }
          className="btn-primary mt-3 w-full"
        >

          <Plus className="w-4 h-4" />

          <span>
            New Room
          </span>
        </button>

        <DMUserList />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">

        {filteredPublicRooms.length >
          0 && (

          <div className="mb-4">

            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">

              <Globe className="h-4 w-4" />

              <span>
                Public Rooms
              </span>
            </div>

            <div className="space-y-2 px-1">

              {filteredPublicRooms.map(
                (room) => (

                  <MemoizedRoomButton
                    key={room.id}
                    room={room}
                    active={isRoomActive(
                      room
                    )}
                    unreadCount={
                      unreadCounts[
                        room.id
                      ] || 0
                    }
                    onClick={() =>
                      handleSelectRoom(
                        room
                      )
                    }
                  />
                )
              )}
            </div>
          </div>
        )}

        {filteredDMRooms.length >
          0 && (

          <div className="mb-4">

            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">

              <Lock className="h-4 w-4" />

              <span>
                Direct Messages
              </span>
            </div>

            <div className="space-y-2 px-1 pb-4">

              {filteredDMRooms.map(
                (room) => (

                  <MemoizedDMButton
                    key={room.id}
                    room={room}
                    active={isRoomActive(
                      room
                    )}
                    unreadCount={
                      unreadCounts[
                        room.id
                      ] || 0
                    }
                    displayName={getDMDisplayName(
                      room
                    )}
                    isOnline={isDMOnline(
                      room
                    )}
                    onClick={() =>
                      handleSelectRoom(
                        room
                      )
                    }
                  />
                )
              )}
            </div>
          </div>
        )}

        {filteredPublicRooms.length ===
          0 &&
          filteredDMRooms.length ===
            0 && (

          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">

            <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-800 p-4 text-slate-400 shadow-inner">

              <Search className="mx-auto h-10 w-10" />
            </div>

            <p className="max-w-xs text-sm leading-6 text-slate-400">

              {searchQuery
                ? 'No rooms match your search'
                : 'No rooms yet. Create one to get started!'}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-700/70 px-4 py-4">

        <p className="text-center text-xs text-slate-400">

          © 2024 SyncRoom
        </p>
      </div>

      {showCreateRoom && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-sm animate-pop rounded-[1.75rem] border border-slate-700 bg-slate-900 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.55)]">

            <h2 className="mb-2 text-xl font-semibold tracking-tight text-slate-100">

              Create New Room
            </h2>

            <p className="mb-5 text-sm text-slate-400">

              Start a focused public conversation for your team or community.
            </p>

            <CreateRoomForm
              onClose={() =>
                setShowCreateRoom(
                  false
                )
              }
              onSubmit={(
                name,
                isPrivate
              ) => {

                onCreateRoom(
                  name,
                  isPrivate
                );

                setShowCreateRoom(
                  false
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CreateRoomForm({
  onClose,
  onSubmit,
}) {

  const [
    roomName,
    setRoomName,
  ] = useState('');

  const [error, setError] =
    useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError('');

      if (
        !roomName.trim()
      ) {

        setError(
          'Room name is required'
        );

        return;
      }

      if (
        roomName.trim()
          .length < 2
      ) {

        setError(
          'Room name must be at least 2 characters'
        );

        return;
      }

      try {

        setIsLoading(true);

        await onSubmit(
          roomName.trim(),
          false
        );

      } catch (err) {

        setError(
          err.message ||
          'Failed to create room'
        );

      } finally {

        setIsLoading(false);
      }
    };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-4"
    >

      <div>

        <label
          htmlFor="roomName"
          className="mb-1 block text-sm font-medium text-slate-300"
        >

          Room Name
        </label>

        <input
          id="roomName"
          type="text"
          value={roomName}
          onChange={(e) => {

            setRoomName(
              e.target.value
            );

            setError('');
          }}
          placeholder="Enter room name"
          disabled={isLoading}
          className="input-field"
          aria-label="Room name"
        />
      </div>

      {error && (

        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">

          {error}
        </div>
      )}

      <div className="flex gap-3">

        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="btn-secondary flex-1"
        >

          Cancel
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1"
        >

          {isLoading
            ? 'Creating...'
            : 'Create'}
        </button>
      </div>
    </form>
  );
}