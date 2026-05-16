const isBrowser = typeof window !== "undefined";

export const getWebSocketProtocol = () =>
  isBrowser && window.location.protocol === "https:"
    ? "wss"
    : "ws";

const normalizeBaseUrl = (baseUrl) => {
  const value = (baseUrl || "").trim();

  if (!value) {
    if (!isBrowser) {
      return "";
    }

    return `${getWebSocketProtocol()}://${window.location.host}`;
  }

  const withScheme = value.startsWith("//")
    ? `${getWebSocketProtocol()}:${value}`
    : value;

  const candidate = /^[a-z][a-z\d+\-.]*:\/\//i.test(withScheme)
    ? withScheme
    : `${getWebSocketProtocol()}://${withScheme}`;

  try {
    const parsed = new URL(candidate);
    const protocol = parsed.protocol === "https:"
      ? "wss:"
      : parsed.protocol === "http:"
        ? "ws:"
        : parsed.protocol;

    return `${protocol}//${parsed.host}`;
  } catch {
    return candidate.replace(/\/+$/, "");
  }
};

export const getWebSocketBaseUrl = (baseUrl = import.meta.env.VITE_WS_URL) =>
  normalizeBaseUrl(baseUrl);

export const buildAuthenticatedWebSocketUrl = ({
  baseUrl,
  path,
  token,
}) => {
  const origin = getWebSocketBaseUrl(baseUrl);

  if (!origin) {
    return "";
  }

  const url = new URL(
    path.startsWith("/") ? path : `/${path}`,
    `${origin}/`
  );

  if (token) {
    url.searchParams.set("token", token);
  }

  return url.toString();
};

export const buildChatWebSocketUrl = ({ roomName, token, baseUrl }) =>
  buildAuthenticatedWebSocketUrl({
    baseUrl,
    path: `/ws/chat/${encodeURIComponent(roomName.trim())}/`,
    token,
  });

export const buildNotificationWebSocketUrl = ({ token, baseUrl }) =>
  buildAuthenticatedWebSocketUrl({
    baseUrl,
    path: "/ws/notifications/",
    token,
  });