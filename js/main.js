import { initNavigation, showAppSection } from "./router.js";
import {
  loadConversations,
  openConversation,
  deleteCurrentConversation,
  initChatForm
} from "./sections/conversations.js";

import { renderUserDashboard } from "./sections/userDashboard.js";
import { getMe } from "./services/userService.js";
import { getFeed } from "./services/surpriseService.js";
import { getSkills } from "./services/skillService.js";
import {
  loadOwnerSurprises,
  openOwnerSurpriseDetail,
  saveOwnerSurprise,
  cancelOwnerSurprise,
  deleteOwnerFile,
  initOwnerCancelModal,
  closeOwnerCancelModal
} from "./sections/creatorSurprises.js";

import {
    getNotifications,
    getUnreadNotificationsCount
} from "./services/notificationService.js";

import {
    renderSurprisesHome,
    restartCountdowns
} from "./sections/home.js";

import { renderNotifications } from "./sections/notifications.js";
import { initCreateSurpriseListeners } from "./sections/creator.js";

import {
    initSurpriseDetail,
    showNotificationToast
} from "./sections/surpriseDetail.js";

import { state } from "./state/appState.js";

let notificationTimer = null;
let lastUnreadCount = 0;

document.addEventListener("DOMContentLoaded", initApp);

function getData(res) {
    return res.json?.data ?? res.json ?? [];
}

async function initApp() {
    const token = localStorage.getItem("token");

    if (!token) {
        location.href = "index.html";
        return;
    }

    state.token = token;

    try {
        initNavigation();
        initCreateSurpriseListeners();

        window.openOwnerSurpriseDetail = openOwnerSurpriseDetail;
        window.saveOwnerSurprise = saveOwnerSurprise;
        window.cancelOwnerSurprise = cancelOwnerSurprise;
        window.loadOwnerSurprises = loadOwnerSurprises;
        window.deleteOwnerFile = deleteOwnerFile;
        window.loadConversations = loadConversations;
window.openConversation = openConversation;
window.deleteCurrentConversation = deleteCurrentConversation;

window.loadUserDashboard = async function () {
    renderUserDashboard(state.dashboard || {});
};

window.purchaseGeniusPlan = function (plan) {
    window.showNotificationToast?.({
        title: "Plan genius",
        message: `Todavía falta conectar el plan ${plan}.`
    });
};

window.purchaseGeniusPackage = function (pack) {
    window.showNotificationToast?.({
        title: "Pack genius",
        message: `Todavía falta conectar el paquete ${pack}.`
    });
};

initChatForm();
        initSurpriseDetail();

        const meRes = await getMe(token);

        if (meRes.status !== 200) {
            location.href = "index.html";
            return;
        }

        state.user = meRes.json?.data || meRes.json;

        renderTopMenuUser(state.user);

        showAppSection("home");

        loadHomeFeed(token);
        startNotificationWatcher(token);
        preloadSecondaryData(token);

    } catch (err) {
        console.error("Error inicializando app:", err);
    }
}

async function loadHomeFeed(token) {
    try {
        const surprisesRes = await getFeed(token);

        if (surprisesRes.status === 200) {
            state.surprises = getData(surprisesRes);
            renderSurprisesHome(state.surprises);
            restartCountdowns();
        }
    } catch (error) {
        console.error("Error cargando sorpresas:", error);
    }
}

function renderTopMenuUser(user) {
    const avatar = document.getElementById("profile_avatar_preview");
    const avatarLarge = document.getElementById("profile_avatar_preview_large");
    const name = document.getElementById("top_user_name");

    const avatarUrl = user.avatar
        ? getImageUrl(user.avatar)
        : "https://api.surpriser.app/storage/defaults/avatar.png";

    if (avatar) avatar.src = avatarUrl;
    if (avatarLarge) avatarLarge.src = avatarUrl;

    if (name) {
        name.textContent = user.username
            ? `@${user.username}`
            : user.name || "Usuario";
    }
}

function getImageUrl(path) {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    if (path.startsWith("/storage/")) {
        return "https://api.surpriser.app" + path;
    }

    return "https://api.surpriser.app/storage/" + path;
}

/* =====================================================
   NOTIFICATIONS
===================================================== */

window.loadNotificationsSection = async function () {
    const token = localStorage.getItem("token");

    if (!state.user?.id) return;

    const res = await getNotifications(state.user.id, token);

    if (res.status === 200) {
        state.notifications = getData(res);
        renderNotifications(state.notifications);
    }

    // Solo ocultamos la burbuja visualmente.
    // No marcamos como leídas en backend.
    renderNotificationBadge(0);
};

function startNotificationWatcher(token) {
    refreshUnreadNotifications(token);

    if (notificationTimer) {
        clearInterval(notificationTimer);
    }

    notificationTimer = setInterval(() => {
        refreshUnreadNotifications(token);
    }, 30000);
}

async function refreshUnreadNotifications(token) {
    if (!state.user?.id) return;

    const notificationsSection = document.getElementById("section-notifications");
    const isViewingNotifications =
        notificationsSection &&
        notificationsSection.style.display !== "none";

    if (isViewingNotifications) {
        renderNotificationBadge(0);
        return;
    }

    try {
        const res = await getUnreadNotificationsCount(state.user.id, token);

        if (res.status !== 200) return;

        const count = res.json?.count ?? res.json?.data?.count ?? 0;

        if (count > lastUnreadCount) {
            showNotificationToast({
                title: "Nueva notificación",
                message: `Tienes ${count} notificación${count === 1 ? "" : "es"} pendiente${count === 1 ? "" : "s"}.`
            });
        }

        lastUnreadCount = count;
        renderNotificationBadge(count);

    } catch (error) {
        console.error("Error cargando contador de notificaciones:", error);
    }
}

function renderNotificationBadge(count) {
    const badge = document.getElementById("notif_count");

    if (!badge) return;

    if (!count || count <= 0) {
        badge.textContent = "";
        badge.style.display = "none";
        return;
    }

    badge.textContent = count > 99 ? "99+" : count;
    badge.style.display = "inline-flex";
}

/* =====================================================
   SECONDARY DATA
===================================================== */

async function preloadSecondaryData(token) {
    try {
        const skillsRes = await getSkills(token);

        if (skillsRes.status === 200) {
            state.skills = skillsRes.json?.data || [];
        }
    } catch (error) {
        console.error("Error precargando skills:", error);
    }
}