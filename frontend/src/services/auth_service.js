import api, { setAuthToken } from "./api";

export const loginUser = async (
  username,
  password
) => {

  const response = await api.post(
    "/api/user/token/",
    {
      username,
      password,
    }
  );

  const data = response.data;

  if (data && data.access) {
    setAuthToken(data.access);
  }

  return data;
};

export const registerUser =
  async (
    username,
    password,
    confirmPassword
  ) => {

    const response = await api.post(
      "/api/user/register/",
      {
        username,
        password,
        confirm_password:
          confirmPassword,
      }
    );

    return response.data;
};

export const refreshToken =
  async (refresh) => {

    const response = await api.post(
      "/api/user/token/refresh/",
      {
        refresh,
      }
    );

      const data = response.data;

      if (data && data.access) {
        setAuthToken(data.access);
      }

      return data;
};

export const fetchCurrentUser =
  async () => {

    const response = await api.get(
      "/api/user/me/"
    );

    return response.data;
};