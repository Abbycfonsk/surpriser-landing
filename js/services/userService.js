import { api } from "../api.js";

export function getMe(token) {
    return api("GET", "/api/me", null, token);
}

export function updateProfile(data, token) {
    return api("POST", "/api/user/profile", data, token);
}

export function getDashboard(userId, token) {
    return api("GET", `/api/users/${userId}/dashboard`, null, token);
}

export function getNotifications(userId, token) {
    return api("GET", `/api/users/${userId}/notifications`, null, token);
}

export function markNotificationRead(id, token) {
    return api("POST", `/api/notifications/${id}/read`, null, token);
}

export function markAllNotificationsRead(userId, token) {
    return api("POST", `/api/users/${userId}/notifications/read-all`, null, token);
}