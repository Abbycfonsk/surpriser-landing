let allSurprises = [];

/* =====================================================
   DASHBOARD (usuario)
===================================================== */

export function userDashboardController() {
    const id = dash_id?.value;
    if (!id) return;

    api("GET", `/api/users/${id}/dashboard`)
        .then(r => showMsg(r.text));
}

/* =====================================================
   FEED SORPRESAS
===================================================== */

export function loadAllSurprisesController() {
    const token = localStorage.getItem("token");

    return api("GET", "/api/surprises", null, token)
        .then(r => {
            if (r.status !== 200 || !r.json.success) {
                throw new Error("No se pudo cargar el feed.");
            }

            allSurprises = (r.json.data || []).filter(s => s.status === "open");

            renderSurpriseCards("all_surprises_list", allSurprises, {
                mode: "offer"
            });
        });
}

/* =====================================================
   NOTIFICACIONES
===================================================== */

export function loadNotificationsController() {
    if (!currentUser) return Promise.resolve();

    const token = localStorage.getItem("token");

    return api("GET", `/api/users/${currentUser.id}/notifications`, null, token)
        .then(r => {
            const notifications = r.json?.data || [];

            const unread = notifications.filter(n => !n.read_flag).length;

            const count = document.getElementById("notif_count");
            if (count) count.textContent = unread;

            renderNotifications(notifications);
        });
}

/* =====================================================
   RENDER SORPRESAS
===================================================== */

export function renderSurpriseCards(containerId, surprises, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!surprises.length) {
        container.innerHTML = `<div class="app-card">No hay sorpresas para mostrar.</div>`;
        return;
    }

    container.innerHTML = surprises
        .map(s => renderSurpriseCard(s, options))
        .join("");

    restartCountdowns();
}

export function renderSurpriseCard(surprise, options = {}) {

    const status = surprise.status || "open";
    const statusClass = "surprise-status-" + String(status).replace("_", "-");

    const isFeatured =
        surprise.ads_exists === true ||
        surprise.ads_exists === 1 ||
        surprise.ads_exists === "1" ||
        (surprise.ads && surprise.ads.length);

    const skillName = surprise.skill?.name || "Sin categoría";
    const size = surprise.size || "";
    const title = surprise.title || "Sin título";

    return `
        <div class="surprise-card-v2 ${isFeatured ? "surprise-card-v2-featured" : ""}">

            <div class="surprise-card-v2-top">
                <span class="surprise-status-v2 ${statusClass}">
                    ${status}
                </span>

                ${isFeatured ? `
                    <div class="surprise-featured-stack">
                        <img src="img/creacionestrellablanco.png" class="surprise-featured-v2 surprise-featured-bg" alt="">
                        <img src="img/creacionestrella.png" class="surprise-featured-v2 surprise-featured-main" alt="Featured">
                    </div>
                ` : ""}
            </div>

            <div class="surprise-card-v2-body">

                <div class="surprise-card-v2-meta">

                    ${
                        surprise.is_urgent === 1 ||
                        surprise.is_urgent === true ||
                        surprise.is_urgent === "1"
                        ? `<img src="img/destello.png" class="urgent-icon-v2" alt="Urgente">`
                        : `<span class="urgent-icon-v2 urgent-icon-empty"></span>`
                    }

                    <div>
                        <p>${skillName}</p>
                        <strong>${size}</strong>
                    </div>

                    <span class="surprise-countdown-v2" data-deadline="${surprise.deadline || ""}">
                        Calculando...
                    </span>

                </div>

                <h4>${title}</h4>

                ${renderCardActions(surprise, options.mode)}

            </div>
        </div>
    `;
}

export function renderCardActions(surprise, mode) {

    if (mode === "creator") {
        return `
            <div class="surprise-card-v2-actions">

                <a href="#" onclick="fillUpdateSurpriseById(${surprise.id}); return false;" class="action-primary">
                    MODIFICAR
                </a>

                <a href="#" onclick="cancelSurpriseController(${surprise.id}); return false;" class="action-danger">
                    CANCELAR
                </a>

            </div>
        `;
    }

    return `
        <div class="surprise-card-v2-actions">

            <a href="#" onclick="offerSurpriseController(${surprise.id}); return false;" class="surprise-card-v2-actions-offer">
                HACER OFERTA
            </a>

            <a href="#" onclick="showMsg('Más info de la sorpresa ${surprise.id}'); return false;" class="action-more">
                Más info
            </a>

        </div>
    `;
}

/* =====================================================
   NOTIFICACIONES UI
===================================================== */

export function renderNotifications(notifications) {
    const box = document.getElementById("notifications_list");
    if (!box) return;

    box.innerHTML = notifications.length
        ? notifications.map(n => `
            <div class="mini-item">
                <strong>${n.title}</strong>
                <span>${n.message}</span>
            </div>
        `).join("")
        : `<div class="mini-item">Sin notificaciones.</div>`;
}

/* =====================================================
   COUNTDOWN (UI GLOBAL)
===================================================== */

export function updateSurpriseCountdowns() {

    document.querySelectorAll(".surprise-countdown, .surprise-countdown-v2")
        .forEach(el => {

            const deadline = el.dataset.deadline;
            el.textContent = getCountdownText(deadline);

            if (el.textContent === "Expirada") {
                el.classList.add("surprise-countdown-expired");
            } else {
                el.classList.remove("surprise-countdown-expired");
            }
        });
}

export function getCountdownText(deadline) {

    if (!deadline) return "Sin fecha";

    const deadlineDate = new Date(deadline);
    const now = new Date();

    if (isNaN(deadlineDate.getTime())) return "Fecha no válida";

    const diff = deadlineDate - now;

    if (diff <= 0) return "Expirada";

    const seconds = Math.floor(diff / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }

    return `${hours}h ${minutes}m ${secs}s`;
}

/* =====================================================
   HELPERS
===================================================== */

export function getImageUrl(path) {

    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    if (path.startsWith("/storage/")) {
        return API + path;
    }

    return API + "/storage/" + path;
}