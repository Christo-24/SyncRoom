import api from "./api";

export const fetchMessages = async (
  roomId,
  cursor = null
) => {

  let url =
    `/api/messages/?room=${roomId}`;

  if (cursor) {
    url += `&cursor=${cursor}`;
  }

   const response =await api.get(url);

  const rawMessages =
    response.data.messages ||
    response.data.results ||
    [];

  return {
    messages:
      Array.isArray(rawMessages)
        ? rawMessages.reverse()
        : [],

    next:
      response.data.next,

    previous:
      response.data.previous,
  };
};

export const fetchUnreadCounts =
  async () => {

    const response = await api.get(
      "/api/messages/unread/"
    );

    return response.data;
};

export const markMessagesSeen =
  async (roomId) => {

    const response = await api.post(
      "/api/messages/mark_as_seen/",
      {
        room_id: roomId
      }
    );

    return response.data;
};