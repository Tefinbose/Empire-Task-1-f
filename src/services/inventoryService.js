import api from "./api";

// ── Inventory Items ──────────────────────────

export const getInventory = async (params = {}) => {
  const response = await api.get("/inventory", { params });
  return response.data;
};

export const getInventoryItem = async (id) => {
  const response = await api.get(`/inventory/${id}`);
  return response.data;
};

export const adjustInventory = async (data) => {
  const response = await api.post("/inventory/adjust", data);
  return response.data;
};

export const bulkAdjustInventory = async (adjustments) => {
  const response = await api.post("/inventory/bulk-adjust", { adjustments });
  return response.data;
};

export const updateInventoryItem = async (id, data) => {
  const response = await api.put(`/inventory/${id}`, data);
  return response.data;
};

export const syncInventory = async () => {
  const response = await api.post("/inventory/sync");
  return response.data;
};

// ── Transfers ────────────────────────────────

export const getTransfers = async (params = {}) => {
  const response = await api.get("/inventory/transfers", { params });
  return response.data;
};

// ── Purchase Orders ──────────────────────────

export const getPurchaseOrders = async (params = {}) => {
  const response = await api.get("/inventory/purchase-orders", { params });
  return response.data;
};
