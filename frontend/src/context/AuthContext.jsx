import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

import {
  loginUser,
  registerUser,
  refreshToken as refreshUserToken,
  fetchCurrentUser,
} from "../services/auth_service";

import { decodeJWT }
  from "../utils/jwt";

import {
  setAuthToken,
} from "../services/api";

const AuthContext =
  createContext();

export function AuthProvider({
  children,
}) {

  const [user, setUser] =
    useState(null);

  const [token, setToken] =
    useState(() =>
      localStorage.getItem(
        "token"
      )
    );

  const [
    refreshToken,
    setRefreshToken,
  ] = useState(() =>
    localStorage.getItem(
      "refresh_token"
    )
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [
    rememberMe,
    setRememberMe,
  ] = useState(
    () =>
      localStorage.getItem(
        "rememberMe"
      ) === "true"
  );

  // =========================
  // SET AUTH HEADER
  // =========================

  useEffect(() => {

    setAuthToken(token);

  }, [token]);

  // =========================
  // TOKEN STORAGE
  // =========================

  useEffect(() => {

    if (token) {

      localStorage.setItem(
        "token",
        token
      );

    } else {

      localStorage.removeItem(
        "token"
      );
    }

  }, [token]);

  useEffect(() => {

    if (refreshToken) {

      localStorage.setItem(
        "refresh_token",
        refreshToken
      );

    } else {

      localStorage.removeItem(
        "refresh_token"
      );
    }

  }, [refreshToken]);

  // =========================
  // INITIALIZE USER
  // =========================

  useEffect(() => {

    const initializeUser =
      async () => {

        if (!token) {

          setLoading(false);

          return;
        }

        try {

          const decoded =
            decodeJWT(token);

          if (
            !decoded ||
            !decoded.user_id
          ) {

            logout();

            return;
          }

          const userData =
            await fetchCurrentUser();

          setUser({
            id: userData.id,
            username:
              userData.username,
            is_online:
              userData.is_online ??
              true,
          });

        } catch (err) {

          console.error(
            "User init failed:",
            err
          );

          // TRY REFRESH TOKEN

          if (refreshToken) {

            try {

              await refreshAccessToken();

            } catch (
              refreshErr
            ) {

              console.error(
                "Refresh failed:",
                refreshErr
              );

              logout();
            }

          } else {

            logout();
          }

        } finally {

          setLoading(false);
        }
      };

    initializeUser();

  }, [token, refreshToken]);

  // =========================
  // REFRESH ACCESS TOKEN
  // =========================

  const refreshAccessToken =
    useCallback(async () => {

      try {

        if (!refreshToken) {

          throw new Error(
            "No refresh token"
          );
        }

        const data =
          await refreshUserToken(
            refreshToken
          );

        if (!data.access) {

          throw new Error(
            "No access token returned"
          );
        }

        setToken(
          data.access
        );

        return data.access;

      } catch (err) {

        console.error(
          "Refresh token error:",
          err
        );

        logout();

        throw err;
      }

    }, [refreshToken]);

  // =========================
  // REGISTER
  // =========================

  const register =
    useCallback(
      async (
        username,
        password,
        confirmPassword
      ) => {

        try {

          setError(null);

          return await registerUser(
            username,
            password,
            confirmPassword
          );

        } catch (err) {

          console.error(err);

          setError(
            err.message ||
            "Registration failed"
          );

          throw err;
        }
      },
      []
    );

  // =========================
  // LOGIN
  // =========================

  const login =
    useCallback(
      async (
        username,
        password,
        remember = false
      ) => {

        try {

          setError(null);

          const data =
            await loginUser(
              username,
              password
            );

          setToken(
            data.access
          );

          if (data.refresh) {

            setRefreshToken(
              data.refresh
            );
          }

          setRememberMe(
            remember
          );

          localStorage.setItem(
            "rememberMe",
            remember
          );

          const decoded =
            decodeJWT(
              data.access
            );

          if (
            decoded &&
            decoded.user_id
          ) {

            setUser({
              id:
                decoded.user_id,
              username,
              email:
                decoded.email ||
                "",
              is_online:
                true,
            });
          }

          return data;

        } catch (err) {

          console.error(err);

          setError(
            err.message ||
            "Login failed"
          );

          throw err;
        }
      },
      []
    );

  // =========================
  // LOGOUT
  // =========================

  const logout =
    useCallback(() => {

      setToken(null);

      setRefreshToken(null);

      setUser(null);

      setError(null);

      setRememberMe(false);

      localStorage.removeItem(
        "rememberMe"
      );

    }, []);

  // =========================
  // CONTEXT VALUE
  // =========================

  const value = {

    user,

    token,

    refreshToken,

    loading,

    error,

    rememberMe,

    register,

    login,

    logout,

    setError,

    refreshAccessToken,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {

  const context =
    useContext(AuthContext);

  if (!context) {

    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
}