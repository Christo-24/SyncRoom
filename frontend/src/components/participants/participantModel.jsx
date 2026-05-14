import React, { useState, useEffect, useCallback } from 'react';
import ParticipantItem from './participantItem';
import { fetchRoomParticipants } from '../../services/room_service';
import { useChat } from '../../context/ChatContext';

export default function ParticipantModal({ room, onClose, expanded = false }) {
	const { createOrGetDM, setCurrentRoom } = useChat();

	const [participants, setParticipants] = useState(room?.participants_list || []);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const loadParticipants = useCallback(async (roomId) => {
		if (!roomId) return;

		if (room?.participants_list?.length) {
			setParticipants(room.participants_list);
			return;
		}

		try {
			setLoading(true);
			const data = await fetchRoomParticipants(roomId);
			setParticipants(Array.isArray(data) ? data : data.results || []);
		} catch (err) {
			console.error(err);
			setError('Failed to load participants');
		} finally {
			setLoading(false);
		}
	}, [room]);

	useEffect(() => {
		setParticipants(room?.participants_list || []);
	}, [room]);

	useEffect(() => {
		if (expanded && room?.id && (!room?.participants_list || room.participants_list.length === 0)) {
			loadParticipants(room.id);
		}
	}, [expanded, room, loadParticipants]);

	const handleStartDM = useCallback(
		async (userId) => {
			try {
				const dmRoom = await createOrGetDM(userId);
				if (dmRoom) {
					setCurrentRoom(dmRoom);
					onClose?.();
				}
			} catch (err) {
				console.error(err);
				setError('Failed to start DM');
			}
		},
		[createOrGetDM, setCurrentRoom, onClose]
	);

	if (!room || !expanded) return null;

	return (
		<>
			<div className="fixed inset-0 z-40" onClick={onClose} />

			<div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50 w-[60%] max-w-[90%] rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-xl backdrop-blur-sm max-h-[70vh] overflow-hidden">
				<div className="mb-3 flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold tracking-tight text-slate-100">Participants</h3>
						<p className="text-sm text-slate-400">{participants.length} members</p>
					</div>
					<button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100" onClick={onClose} aria-label="Close">
						Close
					</button>
				</div>

				{error && <div className="mb-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}

				{loading ? (
					<div className="flex justify-center py-6">
						<div className="flex gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2">
							<div className="h-2 w-2 animate-bounce rounded-full bg-cyan-300" />
							<div className="delay-100 h-2 w-2 animate-bounce rounded-full bg-cyan-300" />
							<div className="delay-200 h-2 w-2 animate-bounce rounded-full bg-cyan-300" />
						</div>
					</div>
				) : (
					<div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '60vh' }}>
						{participants.map((p) => (
							<ParticipantItem key={p.id} participant={p} onStartDM={handleStartDM} />
						))}
					</div>
				)}
			</div>
		</>
	);
}
