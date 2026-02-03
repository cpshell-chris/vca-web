import { tekmetricFetch } from "./tekmetricFetch.js";

export async function fetchRepairOrder(id) {
  return tekmetricFetch(`/repair-orders/${id}`);
}

export async function fetchVehicle(vehicleId) {
  return tekmetricFetch(`/vehicles/${vehicleId}`);
}

export async function fetchCustomer(customerId) {
  return tekmetricFetch(`/customers/${customerId}`);
}
