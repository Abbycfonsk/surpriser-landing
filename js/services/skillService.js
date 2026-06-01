import { api } from "../api.js";

export function getSkills(token) {
    return api("GET", "/api/skills", null, token);
}

export function getUserSkills(userId, token) {
    return api("GET", `/api/users/${userId}/skills`, null, token);
}

export function getSkillRanking(skillId, token) {
    return api("GET", `/api/skills/${skillId}/ranking`, null, token);
}

export function getTopSkill(skillId, token) {
    return api("GET", `/api/skills/${skillId}/top`, null, token);
}

export function updateProposedSkills(userId, data, token) {
    return api("POST", `/api/users/${userId}/proposed-skills`, data, token);
}
export function getUserSkillProgress(userId, skillId, token) {
    return api("GET", `/api/users/${userId}/skills/${skillId}/progress`, null, token);
}

export function getAllUserSkillProgress(userId, token) {
    return api("GET", `/api/users/${userId}/skills/progress`, null, token);
}

export function getUserSkillHistory(userId, skillId, token) {
    return api("GET", `/api/users/${userId}/skills/${skillId}/history`, null, token);
}

export function getUserLevel(userId, token) {
    return api("GET", `/api/users/${userId}/level`, null, token);
}

export function getUserSkillsDashboard(userId, token) {
    return api("GET", `/api/users/${userId}/skills/dashboard`, null, token);
}