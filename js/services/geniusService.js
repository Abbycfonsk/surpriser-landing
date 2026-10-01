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
export function getAllSkills(token) {
  return api("GET", "/api/skills", null, token);
}

export function updateProposedSkills(userId, skills, token) {
  return api("POST", `/api/users/${userId}/proposed-skills`, { skills }, token);
}
export function getTopSkill(skillId, token) {
  return api("GET", `/api/skills/${skillId}/top`, null, token);
}
