import { api } from "../api.js";

export function getCurrentPlan(token) {
    return api("GET", "/api/creator/plan/current", null, token);
}

export function purchasePlan(planType, token) {
    return api("POST", "/api/creator/plan/purchase", { plan_type: planType }, token);
}

export function getCurrentPackage(token) {
    return api("GET", "/api/creator/package/current", null, token);
}

export function purchasePackage(packageType, token) {
    return api("POST", "/api/creator/package/purchase", { package_type: packageType }, token);
}

export function getAdsStats(token) {
    return api("GET", "/api/creator/ads/stats", null, token);
}