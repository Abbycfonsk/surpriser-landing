import { api } from "../api.js";

/* =========================
   REVIEWS
========================= */

export function createReview(surpriseId, data, token) {
    return api("POST", `/api/surprises/${surpriseId}/review`, data, token);
}

export function getUserReviews(userId, token) {
    return api("GET", `/api/users/${userId}/reviews`, null, token);
}

export function getUserRating(userId, token) {
    return api("GET", `/api/users/${userId}/rating`, null, token);
}