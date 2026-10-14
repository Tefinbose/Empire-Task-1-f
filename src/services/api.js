
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach auth token and active tenant store ID to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const currentStoreId = localStorage.getItem("currentStoreId");
  if (currentStoreId) {
    config.headers["x-store-id"] = currentStoreId;
  }
  return config;
});

export default api;