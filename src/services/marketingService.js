import api from "./api";

// Fetch high-level marketing overview, attribution KPIs, and segments
export async function getMarketingSummary() {
  const response = await api.get("/marketing/summary");
  return response.data;
}

// Fetch campaigns with optional query parameters (search, status, channel)
export async function getCampaigns(params = {}) {
  const response = await api.get("/marketing/campaigns", { params });
  return response.data;
}

// Fetch single campaign details
export async function getCampaignById(id) {
  const response = await api.get(`/marketing/campaigns/${id}`);
  return response.data;
}

// Create a new campaign
export async function createCampaign(data) {
  const response = await api.post("/marketing/campaigns", data);
  return response.data;
}

// Update existing campaign
export async function updateCampaign(id, data) {
  const response = await api.put(`/marketing/campaigns/${id}`, data);
  return response.data;
}

// Toggle campaign status (active / paused)
export async function toggleCampaignStatus(id, status) {
  const response = await api.patch(`/marketing/campaigns/${id}/status`, { status });
  return response.data;
}

// Trigger / dispatch campaign blast to audience
export async function triggerCampaign(id) {
  const response = await api.post(`/marketing/campaigns/${id}/trigger`);
  return response.data;
}

// Delete campaign
export async function deleteCampaign(id) {
  const response = await api.delete(`/marketing/campaigns/${id}`);
  return response.data;
}

// Fetch marketing automations (Shopify Flows)
export async function getAutomations() {
  const response = await api.get("/marketing/automations");
  return response.data;
}

// Toggle automation on/off
export async function toggleAutomationStatus(id, status) {
  const response = await api.patch(`/marketing/automations/${id}/toggle`, { status });
  return response.data;
}

// Update automation settings (delay, discount code)
export async function updateAutomation(id, data) {
  const response = await api.put(`/marketing/automations/${id}`, data);
  return response.data;
}
