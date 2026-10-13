import api from "./api";

export const adminLogin = async (credentials) => {
  const response = await api.post("/admin/auth/login", credentials);
  const { token, admin } = response.data;

  if (!token) {
    throw new Error("The server did not return an authentication token.");
  }

  localStorage.setItem("adminToken", token);
  localStorage.setItem("admin", JSON.stringify(admin));

  // Dispatch custom event to notify other UI components
  window.dispatchEvent(new Event("adminProfileUpdated"));

  return response.data;
};

export const adminLogout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
  window.dispatchEvent(new Event("adminProfileUpdated"));
};

export const getAdminProfile = async () => {
  const response = await api.get("/admin/auth/profile");
  const admin = response.data.admin;

  if (admin) {
    localStorage.setItem("admin", JSON.stringify(admin));
    window.dispatchEvent(new Event("adminProfileUpdated"));
  }

  return admin;
};

export const updateAdminProfile = async (data) => {
  const response = await api.put("/admin/auth/profile", data);
  const admin = response.data.admin;

  if (admin) {
    localStorage.setItem("admin", JSON.stringify(admin));
    window.dispatchEvent(new Event("adminProfileUpdated"));
  }

  return response.data;
};