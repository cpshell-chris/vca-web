import fetch from "node-fetch";
import { getTekmetricToken } from "./tekmetricAuth.js";

async function tekmetricFetch(path) {
  const token = await getTekmetricToken();

  const res = await fetch(`${process.env.TM_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tekmetric API error ${res.status}: ${text}`);
  }

  return res.json();
}

export const tekmetric = {
  repairOrderById(id) {
    return tekmetricFetch(`/repair-orders/${id}`);
  },

  jobsByRepairOrder(id) {
    return tekmetricFetch(`/jobs?repairOrderId=${id}`);
  },

  vehicleById(id) {
    return tekmetricFetch(`/vehicles/${id}`);
  },

  customerById(id) {
    return tekmetricFetch(`/customers/${id}`);
  },
};
