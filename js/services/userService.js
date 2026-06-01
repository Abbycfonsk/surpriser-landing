import { api } from "../api.js";

export function getMe(token) {
    return api("GET", "/api/me", null, token);
}

export function updateProfile(data, token) {
    return api("POST", "/api/user/profile", data, token);
}

export function getUserDashboard(userId, token) {
    return api("GET", `/api/users/${userId}/dashboard`, null, token);
}

export function getUserSkills(userId, token) {
    return api("GET", `/api/users/${userId}/skills`, null, token);
}

export function getUserLevel(userId, token) {
    return api("GET", `/api/users/${userId}/level`, null, token);
}

export function getSkillProgress(userId, skillId, token) {
    return api("GET", `/api/users/${userId}/skills/${skillId}/progress`, null, token);
}

export function getAllSkillProgress(userId, token) {
    return api("GET", `/api/users/${userId}/skills/progress`, null, token);
}

export function getSkillHistory(userId, skillId, token) {
    return api("GET", `/api/users/${userId}/skills/${skillId}/history`, null, token);
}

export function getUserSkillsDashboard(userId, token) {
    return api("GET", `/api/users/${userId}/skills/dashboard`, null, token);
}