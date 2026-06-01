import { api } from "../api.js";

export function createOffer(id, data, token) {
    return api("POST", `/api/surprises/${id}/offers`, data, token);
}

export function getOffers(id, token) {
    return api("GET", `/api/surprises/${id}/offers`, null, token);
}

export function counterOffer(offerId, data, token) {
    return api("POST", `/api/offers/${offerId}/counter`, data, token);
}

export function acceptOffer(offerId, token) {
    return api("POST", `/api/offers/${offerId}/accept`, null, token);
}

export function getMyOffers(token) {
    return api("GET", "/api/genius/offers", null, token);
}