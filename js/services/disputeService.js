import { api } from "../api.js";

/* =========================
   DISPUTES
========================= */

export function createDispute(surpriseId, data, token) {
    return api("POST", `/api/surprises/${surpriseId}/dispute`, data, token);
}

export function getDispute(id, token) {
    return api("GET", `/api/disputes/${id}`, null, token);
}

export function getMyDisputes(token) {
    return api("GET", "/api/my/disputes", null, token);
}

export function getCreatorDisputes(userId, token) {
    return api("GET", `/api/users/${userId}/disputes/creator`, null, token);
}

export function getGeniusDisputes(userId, token) {
    return api("GET", `/api/users/${userId}/disputes/genius`, null, token);
}