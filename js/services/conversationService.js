import { api } from "../api.js";

export function getConversations(token) {
    return api("GET", "/api/conversations", null, token);
}

export function createConversation(data, token) {
    return api("POST", "/api/conversations", data, token);
}

export function deleteConversation(id, token) {
    return api("DELETE", `/api/conversations/${id}`, null, token);
}

export function getMessages(conversationId, token) {
    return api("GET", `/api/conversations/${conversationId}/messages`, null, token);
}

export function sendMessage(data, token) {
    return api("POST", "/api/messages", data, token);
}

export function sendMessageToSurprise(surpriseId, data, token) {
    return api("POST", `/api/surprises/${surpriseId}/messages`, data, token);
}