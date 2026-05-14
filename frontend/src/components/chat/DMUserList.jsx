import {
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  Search,
  X,
} from 'lucide-react';

import {
  useChat,
} from '../../context/ChatContext';

import api from '../../services/api';

export default function DMUserList() {

  const {
    createOrGetDM,
    setCurrentRoom,
  } = useChat();

  const [users, setUsers] =
    useState([]);

  const [
    filteredUsers,
    setFilteredUsers,
  ] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [
    showUsers,
    setShowUsers,
  ] = useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const loadUsers =
    useCallback(async () => {

      try {

        setLoading(true);

        setError(null);

        const response =
          await api.get(
            '/api/user/users/'
          );

        const usersList =
          Array.isArray(
            response.data
          )
            ? response.data
            : response.data.results ||
              [];

        setUsers(usersList);

        setFilteredUsers(
          usersList
        );

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data
            ?.detail ||
            'Failed to load users'
        );

      } finally {

        setLoading(false);
      }
    }, []);

  useEffect(() => {

    if (!showUsers) {
      return;
    }

    loadUsers();

  }, [
    showUsers,
    loadUsers,
  ]);

  useEffect(() => {

    if (
      searchQuery.trim() === ''
    ) {

      setFilteredUsers(users);

      return;
    }

    const query =
      searchQuery.toLowerCase();

    const filtered =
      users.filter((user) => {

        return (
          user.username
            ?.toLowerCase()
            .includes(query) ||

          user.email
            ?.toLowerCase()
            .includes(query)
        );
      });

    setFilteredUsers(
      filtered
    );

  }, [searchQuery, users]);

  const handleClose =
    useCallback(() => {

      setShowUsers(false);

      setSearchQuery('');

      setError(null);

    }, []);

  const handleStartDM =
    useCallback(
      async (userId) => {

        try {

          const dmRoom =
            await createOrGetDM(
              userId
            );

          setCurrentRoom(
            dmRoom
          );

          handleClose();

        } catch (err) {

          console.error(err);

          setError(
            'Failed to start DM'
          );
        }
      },
      [
        createOrGetDM,
        setCurrentRoom,
        handleClose,
      ]
    );

  return (
    <div className="dm-user-list">

      <button
        className="dm-toggle-btn mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/35 transition duration-200 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-cyan-400"
        onClick={() => {

          setShowUsers(
            !showUsers
          );

          if (!showUsers) {

            setSearchQuery('');
          }
        }}
        title="Start direct message"
      >

        <Search className="w-4 h-4" />

        <span>
          Start DM
        </span>
      </button>

      {showUsers && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="flex max-h-[32rem] w-full max-w-lg animate-pop flex-col rounded-[1.75rem] border border-slate-700 bg-slate-900 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.55)]">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h3 className="text-lg font-semibold tracking-tight text-slate-100">
                  Start a DM
                </h3>

                <p className="text-sm text-slate-400">
                  Pick a person to open a private conversation.
                </p>
              </div>

              <button
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
                onClick={
                  handleClose
                }
                aria-label="Close"
              >

                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mb-4">

              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                placeholder="Search users..."
                value={
                  searchQuery
                }
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value
                  )
                }
                className="input-field w-full pl-11"
                autoFocus
              />
            </div>

            {error && (

              <div className="mb-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">

                {error}
              </div>
            )}

            {loading ? (

              <div className="flex justify-center py-10">

                <div className="flex gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2">

                  <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-300"></div>

                  <div className="delay-100 h-2 w-2 animate-bounce rounded-full bg-cyan-300"></div>

                  <div className="delay-200 h-2 w-2 animate-bounce rounded-full bg-cyan-300"></div>
                </div>
              </div>

            ) : filteredUsers.length ===
              0 ? (

              <div className="py-10 text-center text-slate-400">

                {searchQuery
                  ? 'No users match your search'
                  : 'No users available'}
              </div>

            ) : (

              <ul className="flex-1 space-y-2 overflow-y-auto pr-1">

                {filteredUsers.map(
                  (user) => (

                    <li
                      key={
                        user.id
                      }
                      className="flex items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-800/70 p-3 transition hover:border-slate-500 hover:bg-slate-800"
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-xs font-semibold text-slate-100">

                          {(
                            user?.username?.charAt(
                              0
                            ) || '?'
                          ).toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-slate-100">

                            {
                              user.username
                            }
                          </p>

                          <p className="truncate text-xs text-slate-400">

                            {user.email}
                          </p>
                        </div>
                      </div>

                      <button
                        className="ml-2 shrink-0 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                        onClick={() =>
                          handleStartDM(
                            user.id
                          )
                        }
                      >

                        Message
                      </button>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}