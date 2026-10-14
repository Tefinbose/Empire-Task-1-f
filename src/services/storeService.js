import api from "./api";

/**
 * Fetch all stores accessible to the logged-in admin
 */
export async function getStores() {
  const response = await api.get("/stores");
  return response.data;
}

/**
 * Fetch details of the current active store
 */
export async function getCurrentStore() {
  const response = await api.get("/stores/current");
  return response.data?.data;
}

/**
 * Create a new merchant store
 */
export async function createStore(storeData) {
  const response = await api.post("/stores", storeData);
  return response.data?.data;
}

/**
 * Update configuration & settings for the current active store
 */
export async function updateCurrentStore(settingsData) {
  const response = await api.put("/stores/current", settingsData);
  return response.data?.data;
}

/**
 * Switch the active store context
 */
export async function switchStore(storeId) {
  const response = await api.post(`/stores/switch/${storeId}`);
  if (response.data?.data?._id) {
    localStorage.setItem("currentStoreId", response.data.data._id);
    localStorage.setItem("currentStoreName", response.data.data.name);
    window.dispatchEvent(new CustomEvent("storeChanged", { detail: response.data.data }));
  }
  return response.data?.data;
}

/**
 * Delete a store
 */
export async function deleteStore(storeId) {
  const response = await api.delete(`/stores/${storeId}`);
  return response.data;
}
