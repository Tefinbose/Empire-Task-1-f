import api from "./api";

export const adminLogin = async (credentials) => {
  const response = await api.post("/admin/auth/login", credentials);
  const { token, admin } = response.data;

  if (!token) {
    throw new Error("The server did not return an authentication token.");
  }

  localStorage.setItem("adminToken", token);
  localStorage.setItem("admin", JSON.stringify(admin));

  return response.data;
};

export const adminLogout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
};

export const getAdminProfile = async () => {
  const response = await api.get("/admin/auth/profile");
  return response.data.admin;
};