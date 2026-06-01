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

export function forgotPassword(email) {
    return api("POST", "/api/forgot-password", { email });
}

export function resetPassword(data) {
    return api("POST", "/api/reset-password", data);
}

export function subscribeLanding(email) {
    return api("POST", "/api/landing/subscribe", { email });
}