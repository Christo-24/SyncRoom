import api from "./api";

export const fetchRooms = async () => {

  const response = await api.get(
    "/api/room/"
  );

  return response.data;
};

export const createRoom = async (
  roomData
) => {

  const response = await api.post(
    "/api/room/",
    roomData
  );

  return response.data;
};

export const deleteRoom = async (
  roomId
) => {

  const response = await api.delete(
    `/api/room/${roomId}/`
  );

  return response.data;
};

export const fetchRoomParticipants = async (roomId) => {

  const response = await api.get(
    `/api/room/${roomId}/participants/`
  );

  return response.data;
};

export const createOrGetDM = async (userId) => {

  const response = await api.post(
    `/api/room/create_dm/`,
    { user_id: userId }
  );

  return response.data;
};