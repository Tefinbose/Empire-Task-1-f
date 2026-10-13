import api from "./api";

// Fetch customer list with optional search and status filter
export async function getCustomers(params = {}) {
  const response = await api.get("/customers", { params });
  return response.data;
}

// Fetch single customer profile with order history
export async function getCustomerById(id) {
  const response = await api.get(`/customers/${id}`);
  return response.data;
}

// Toggle or update customer status (active / blocked)
export async function updateCustomerStatus(id, status) {
  const response = await api.patch(`/customers/${id}/status`, { status });
  return response.data;
}
