import { api } from "../api.js";

export function getNotifications(userId, token) {
    return api("GET", `/api/users/${userId}/notifications`, null, token);
}

export function markAsRead(id, token) {
    return api("POST", `/api/notifications/${id}/read`, null, token);
}

export function markAllAsRead(userId, token) {
    return api("POST", `/api/users/${userId}/notifications/read-all`, null, token);
}