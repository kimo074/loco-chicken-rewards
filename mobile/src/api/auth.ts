import { apiFetch } from "./client";
import { Customer, StaffUser } from "./types";

export function signupCustomer(params: { name: string; email: string; password: string }) {
  return apiFetch<{ token: string; customer: Customer }>("/api/auth/customer/signup", {
    method: "POST",
    body: params,
  });
}

export function loginCustomer(params: { email: string; password: string }) {
  return apiFetch<{ token: string; customer: Customer }>("/api/auth/customer/login", {
    method: "POST",
    body: params,
  });
}

export function loginStaff(params: { staffUserId: string; pin: string }) {
  return apiFetch<{ token: string; staff: StaffUser }>("/api/auth/staff/login", {
    method: "POST",
    body: params,
  });
}

export function fetchLocations() {
  return apiFetch<{ locations: { id: string; name: string; address: string }[] }>("/api/locations");
}

export function fetchStaffNames(locationId: string) {
  return apiFetch<{ staff: { id: string; name: string }[] }>(`/api/locations/${locationId}/staff-names`);
}
