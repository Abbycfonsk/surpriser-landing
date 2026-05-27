import { api } from "../api.js";

export function getGeniusFeed(token) {
    return api("GET", "/api/genius/feed", null, token);
}

export function getGeniusDashboard(userId, token) {
    return api("GET", `/api/genius/${userId}/dashboard`, null, token);
}

export function getGeniusOffers(token) {
    return api("GET", "/api/genius/offers", null, token);
}

export function getGeniusSuggestions(skillId, token) {
    return api("GET", `/api/skills/${skillId}/genius-suggestions`, null, token);
}

export function getUserSkills(userId, token) {
    return api("GET", `/api/users/${userId}/skills`, null, token);
}