import { initNavigation, showAppSection } from "./router.js";

/* =========================
   SERVICES
========================= */
import { getMe } from "./services/userService.js";
import { getSurprises } from "./services/surpriseService.js";
import { getGeniusDashboard } from "./services/geniusService.js";
import { getNotifications } from "./services/notificationService.js";

/* =========================
   UI MODULES
========================= */
import { initCreateSurpriseListeners, initUpdateSurpriseListeners } from "./sections/creator.js";

/* =========================
   STATE
========================= */
let surpriseCountdownInterval = null;
let currentUser = null;

document.addEventListener("DOMContentLoaded", dashboardInit);

/* =====================================================
   INIT APP
===================================================== */
async function dashboardInit() {

    const token = localStorage.getItem("token");

    if (!token) {
        location.href = "index.html";
        return;
    }

    try {

        // =========================
        // INIT UI
        // =========================
        initNavigation();
        initCreateSurpriseListeners();
        initUpdateSurpriseListeners();

        // =========================
        // LOAD USER (SERVICE)
        // =========================
        const meRes = await getMe(token);

        if (meRes.status !== 200) {
            throw new Error("Sesión inválida");
        }

        currentUser = meRes.json;

        // =========================
        // LOAD INITIAL DATA (SERVICES)
        // =========================
        const [surprisesRes, geniusRes, notifRes] = await Promise.all([
            getSurprises(token),
            getGeniusDashboard(currentUser.id, token),
            getNotifications(currentUser.id, token)
        ]);

        // =========================
        // HANDLE SURPRISES
        // =========================
        if (surprisesRes.status === 200) {
            const surprises = surprisesRes.json?.data || [];
            renderSurprisesHome(surprises);
        }

        // =========================
        // HANDLE GENIUS
        // =========================
        if (geniusRes.status === 200) {
            const data = geniusRes.json?.data;
            if (data) renderGenius(data);
        }

        // =========================
        // HANDLE NOTIFICATIONS
        // =========================
        if (notifRes.status === 200) {
            const notifications = notifRes.json?.data || [];
            renderNotifications(notifications);
        }

        // =========================
        // START APP
        // =========================
        showAppSection("home");

        restartCountdowns();

    } catch (err) {
        console.error("APP INIT ERROR:", err);
    }
}

/* =====================================================
   SIMPLE RENDERERS (puedes moverlos luego a sections/)
===================================================== */

function renderSurprisesHome(surprises) {
    const container = document.getElementById("all_surprises_list");
    if (!container) return;

    container.innerHTML = surprises.length
        ? surprises.map(s => `<div>${s.title}</div>`).join("")
        : "<p>No hay sorpresas</p>";
}

function renderGenius(data) {
    const level = document.getElementById("genius_level_label");
    const points = document.getElementById("genius_points_label");

    if (level) level.textContent = data.user?.genius_level || "SPARK";
    if (points) points.textContent = `${data.user?.genius_points || 0} puntos`;
}

function renderNotifications(notifications) {
    const box = document.getElementById("notifications_list");
    if (!box) return;

    box.innerHTML = notifications.length
        ? notifications.map(n => `
            <div class="mini-item">
                <strong>${n.title}</strong>
                <span>${n.message}</span>
            </div>
        `).join("")
        : "<div>No notifications</div>";
}

/* =====================================================
   COUNTDOWN SYSTEM
===================================================== */

function restartCountdowns() {

    if (typeof updateSurpriseCountdowns !== "function") return;

    updateSurpriseCountdowns();

    if (surpriseCountdownInterval) {
        clearInterval(surpriseCountdownInterval);
    }

    surpriseCountdownInterval = setInterval(updateSurpriseCountdowns, 1000);
}