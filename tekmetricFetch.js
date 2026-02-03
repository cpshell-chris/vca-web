import fetch from "node-fetch";
import { getTekmetricToken } from "./tekmetricAuth.js";

/**
 * Resolve Tekmetric Base URL from either naming convention:
 * - TM_BASE_URL (old)
 * - TEKMETRIC_BASE_URL (new)
 */
function getBaseUrl() {
  return (
    process.env.TM_BASE_URL ||
    process.env.TEKMETRIC_BASE_URL
  );
}

/**
 * Generic Tekmetric API request helper
 */
export async function tekmetricFetch(path, options = {}) {
  const token = await getTekmetricToken();
  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    throw new Error(
      "Tekmetric base URL missing. Set TM_BASE_URL or TEKMETRIC_BASE_URL."
    );
  }

  const url = `${baseUrl}${path}`;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Tekmetric API error ${res.status} on ${path}: ${text}`
    );
  }

  return res.json();
}

/**
 * Fetch Repair Order by ID
 */
export async function fetchRepairOrder(roId) {
  return tekmetricFetch(`/repair-orders/${roId}`);
}

/**
 * Fetch Inspection (DVI)
 *
 * Tekmetric does NOT reliably support:
 *   /repair-orders/{id}/inspection
 *
 * Instead, we will use the inspectionUrl already present
 * on the Repair Order object.
 */
export async function fetchInspectionFromRo(repairOrder) {
  if (!repairOrder.inspectionUrl) {
    return null;
  }

  return {
    type: "link",
    inspectionUrl: repairOrder.inspectionUrl,
    note: "Inspection must be fetched as PDF via inspectionUrl (not API JSON).",
  };
}
