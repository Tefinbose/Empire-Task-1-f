
import api from "./api";

async function getDashboardStats() {
  const response = await api.get("/dashboard/stats");
  return response.data.data;
}

async function getRecentOrders() {
  const response = await api.get("/orders");
  const data = response.data;

  if (Array.isArray(data.orders)) return data.orders;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
}

async function updateOrderStatus(id, status) {
  const response = await api.patch(`/orders/${id}/status`, {
    status,
  });
  return response.data;
}

export { getDashboardStats, getRecentOrders, updateOrderStatus };
