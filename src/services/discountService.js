import api from "./api";

// Fetch all discounts with optional search and status filtering
export async function getDiscounts(params = {}) {
  const response = await api.get("/discounts", { params });
  return response.data;
}

// Fetch single discount details
export async function getDiscountById(id) {
  const response = await api.get(`/discounts/${id}`);
  return response.data;
}

// Create a new discount coupon
export async function createDiscount(data) {
  const response = await api.post("/discounts", data);
  return response.data;
}

// Update discount coupon
export async function updateDiscount(id, data) {
  const response = await api.put(`/discounts/${id}`, data);
  return response.data;
}

// Toggle discount status (active / disabled)
export async function toggleDiscountStatus(id, status) {
  const response = await api.patch(`/discounts/${id}/status`, { status });
  return response.data;
}

// Delete discount coupon
export async function deleteDiscount(id) {
  const response = await api.delete(`/discounts/${id}`);
  return response.data;
}

// Validate coupon for checkout (Public)
export async function validateCoupon({ code, cartTotal }) {
  const response = await api.post("/discounts/validate", { code, cartTotal });
  return response.data;
}
