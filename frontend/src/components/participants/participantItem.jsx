import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export default function ParticipantItem({ participant, onStartDM }) {
  const { user } = useAuth();
  const { onlineUsers } = useChat();

  const isSelf = user?.username === participant?.username;
  const isOnline = onlineUsers.includes(participant?.username);

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-slate-600 hover:bg-slate-800/80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-xs font-semibold text-slate-100">
          {(participant?.username?.charAt(0) || '?').toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">{participant.username}</p>
          <p className="text-xs text-slate-400">{isOnline ? 'Online' : 'Offline'}</p>
        </div>
      </div>

      {!isSelf && (
        <button
          onClick={() => onStartDM(participant.id)}
          className="ml-2 shrink-0 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Message
        </button>
      )}
    </div>
  );
}
