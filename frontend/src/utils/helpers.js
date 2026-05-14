export const uniqueById = (
  messages
) => {

  const map = new Map();

  messages.forEach((msg) => {

    const messageKey =
      msg.message_id ??
      msg.id;

    map.set(messageKey, msg);
  });

  return Array.from(
    map.values()
  );
};

export const sortMessages = (
  messages
) => {

  return [...messages].sort(
    (a, b) =>
      new Date(a.timestamp) -
      new Date(b.timestamp)
  );
};