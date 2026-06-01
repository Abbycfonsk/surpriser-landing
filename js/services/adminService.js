import { api } from "../api.js";

export function getAdminDashboard(token) {
    return api("GET", "/api/admin/dashboard", null, token);
}

export function listAdminUsers(token) {
    return api("GET", "/api/admin/users", null, token);
}

export function banUser(id, token) {
    return api("POST", `/api/admin/users/${id}/ban`, null, token);
}

export function unbanUser(id, token) {
    return api("POST", `/api/admin/users/${id}/unban`, null, token);
}

export function listAdminSurprises(token) {
    return api("GET", "/api/admin/surprises", null, token);
}

export function forceCancelSurprise(id, token) {
    return api("POST", `/api/admin/surprises/${id}/force-cancel`, null, token);
}

export function listAdminDisputes(token) {
    return api("GET", "/api/admin/disputes", null, token);
}

export function resolveDispute(id, token) {
    return api("POST", `/api/admin/disputes/${id}/resolve`, null, token);
}