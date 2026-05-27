import { api } from "../api.js";

export function getSurprises(token) {
    return api("GET", "/api/surprises", null, token);
}

export function getSurprise(id, token) {
    return api("GET", `/api/surprises/${id}`, null, token);
}

export function createSurprise(data, token) {
    return api("POST", "/api/surprises", data, token);
}

export function updateSurprise(id, data, token) {
    return api("POST", `/api/surprises/${id}`, data, token);
}

export function deleteSurprise(id, token) {
    return api("DELETE", `/api/surprises/${id}`, null, token);
}

export function cancelSurprise(id, token) {
    return api("POST", `/api/surprises/${id}/cancel`, null, token);
}

export function startSurprise(id, token) {
    return api("POST", `/api/surprises/${id}/start`, null, token);
}

export function deliverSurprise(id, token) {
    return api("POST", `/api/surprises/${id}/deliver`, null, token);
}

export function completeSurprise(id, token) {
    return api("POST", `/api/surprises/${id}/complete`, null, token);
}

export function getCreatedSurprises(userId, token) {
    return api("GET", `/api/users/${userId}/surprises-created`, null, token);
}

export function getGeniusSurprises(userId, token) {
    return api("GET", `/api/users/${userId}/surprises-genius`, null, token);
}

export function createOffer(id, data, token) {
    return api("POST", `/api/surprises/${id}/offers`, data, token);
}

export function getOffers(id, token) {
    return api("GET", `/api/surprises/${id}/offers`, null, token);
}