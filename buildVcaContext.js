import {
  fetchRepairOrder,
  fetchVehicle,
  fetchCustomer,
} from "./tekmetricResources.js";

/**
 * Build the canonical VCA context for a Repair Order
 */
export async function buildVcaContext(repairOrderId) {
  // 1. Fetch Repair Order
  const repairOrder = await fetchRepairOrder(repairOrderId);

  // 2. Extract required IDs
  const { vehicleId, customerId } = repairOrder;

  if (!vehicleId) {
    throw new Error("Repair Order missing vehicleId");
  }

  if (!customerId) {
    throw new Error("Repair Order missing customerId");
  }

  // 3. Fetch related entities in parallel
  const [vehicle, customer] = await Promise.all([
    fetchVehicle(vehicleId),
    fetchCustomer(customerId),
  ]);

  // 4. Return canonical context
  return {
    repairOrder,
    vehicle,
    customer,
    jobs: repairOrder.jobs || [],
    fees: repairOrder.fees || [],
    customerConcerns: repairOrder.customerConcerns || [],
  };
}
