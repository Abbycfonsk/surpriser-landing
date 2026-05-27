import { api } from "../api.js";

export function register(data) {
    return api("POST", "/api/register", data);
}

export function login(data) {
    return api("POST", "/api/login", data);
}

export function logout(token) {
    return api("POST", "/api/logout", null, token);
}

export function forgotPassword(data) {
    return api("POST", "/api/forgot-password", data);
}

export function resetPassword(data) {
    return api("POST", "/api/reset-password", data);
}