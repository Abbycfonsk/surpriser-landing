import { restartCountdowns } from "../sections/home.js";

// =====================
// STATE
// =====================
let geniusFeed = [];
let geniusOffers = [];
let geniusActiveSurprises = [];

// =====================
// DASHBOARD SUMMARY
// =====================
export function loadDashboardSummaryController() {
    if (!currentUser) return Promise.resolve();

    const token = localStorage.getItem("token");

    return api("GET", `/api/users/${currentUser.id}/dashboard`, null, token)
        .then(r => {
            if (r.status !== 200 || !r.json.success) return;

            const data = r.json.data;
            renderGeniusHeader(data.user, data.skills || []);
        });
}

// =====================
// GENIUS DASHBOARD
// =====================
export function loadGeniusDashboardController() {
    const token = localStorage.getItem("token");
    if (!currentUser) return;

    return Promise.all([
        api("GET", "/api/genius/feed", null, token),
        api("GET", "/api/genius/offers", null, token),
        api("GET", `/api/users/${currentUser.id}/surprises-genius`, null, token),
        api("GET", `/api/users/${currentUser.id}/skills`, null, token)
    ])
    .then(([feedRes, offersRes, activeRes, skillsRes]) => {

        geniusFeed = feedRes.json?.data || [];
        geniusOffers = offersRes.json?.data || [];
        geniusActiveSurprises = activeRes.json?.data || [];

        const skills = skillsRes.json?.data || {};
        const mergedSkills = [
            ...(skills.active || []),
            ...(skills.proposed || [])
        ];

        renderGeniusHeader(currentUser, mergedSkills);

        renderSurpriseCards(
            "genius_feed_list",
            sortGeniusFeed(geniusFeed),
            { mode: "offer" }
        );

        renderMiniOffers();
        renderMiniActiveSurprises();
        restartCountdowns();
    })
    .catch(err => showMsg(err.message));
}

// =====================
// HEADER
// =====================
export function renderGeniusHeader(user, skills) {
    const level = document.getElementById("genius_level_label");
    const points = document.getElementById("genius_points_label");

    if (level) level.textContent = user?.genius_level || "SPARK";
    if (points) points.textContent = `${user?.genius_points || 0} puntos`;

    renderSkillCloud(skills);
}

// =====================
// SKILLS
// =====================
export function renderSkillCloud(skills = []) {
    const box = document.getElementById("genius_skills_list");
    if (!box) return;

    if (!skills.length) {
        box.innerHTML = `<span class="skill-pill">Sin skills activas</span>`;
        return;
    }

    box.innerHTML = skills.map(skill => `
        <span class="skill-pill">
            ${skill.skill_name || skill.name || "Skill"} · Nivel ${skill.level || 0}
        </span>
    `).join("");
}

// =====================
// SORT FEED
// =====================
export function sortGeniusFeed(surprises) {
    const adOrder = { premium: 1, pro: 2, starter: 3, start: 3 };

    return [...surprises].sort((a, b) => {

        const adA = a.ads?.[0]
            ? (adOrder[a.ads[0].ad_type] || 50)
            : 50;

        const adB = b.ads?.[0]
            ? (adOrder[b.ads[0].ad_type] || 50)
            : 50;

        if (adA !== adB) return adA - adB;

        if (!!b.is_urgent !== !!a.is_urgent) {
            return b.is_urgent ? 1 : -1;
        }

        return new Date(b.created_at) - new Date(a.created_at);
    });
}

// =====================
// MINI OFFERS
// =====================
export function renderMiniOffers() {
    const box = document.getElementById("genius_offers_list");
    if (!box) return;

    box.innerHTML = geniusOffers.length
        ? geniusOffers.map(offer => `
            <div class="mini-item">
                <strong>${offer.surprise?.title || "Sorpresa"}</strong>
                <span>${offer.price || ""} · ${offer.status || "pending"}</span>
                <button class="btn btn-ghost"
                    onclick="openNegotiationController(${offer.surprise_id})">
                    Regateo
                </button>
            </div>
        `).join("")
        : `<div class="mini-item">Aún no has ofertado.</div>`;
}

// =====================
// ACTIVE SURPRISES
// =====================
export function renderMiniActiveSurprises() {
    const box = document.getElementById("genius_active_list");
    if (!box) return;

    const active = geniusActiveSurprises.filter(s =>
        ["in_progress", "delivered"].includes(s.status)
    );

    box.innerHTML = active.length
        ? active.map(surprise => `
            <div class="mini-item">
                <strong>${surprise.title || "Sorpresa"}</strong>
                <span>${surprise.status}</span>
                <button class="btn btn-ghost"
                    onclick="openChatController(${surprise.id})">
                    Chat
                </button>
            </div>
        `).join("")
        : `<div class="mini-item">No tienes sorpresas en marcha.</div>`;
}

// =====================
// ACTIONS
// =====================
export function offerSurpriseController(id) {
    const price = prompt("Precio de tu oferta");
    if (!price) return;

    const message = prompt("Mensaje para la creadora") || "";
    const eta = prompt("Horas estimadas", "24") || "24";

    const token = localStorage.getItem("token");

    api("POST", `/api/surprises/${id}/offers`, {
        price,
        message,
        eta_hours: eta
    }, token)
    .then(r => showMsg(r.text));
}

export function openChatController(id) {
    showMsg(`Abrir chat de la sorpresa ${id}. Pendiente de vista.`);
}

export function openNegotiationController(id) {
    showMsg(`Abrir regateo de la sorpresa ${id}. Pendiente de vista.`);
}
export function renderGenius(data) {
    const level = document.getElementById("genius_level_label");
    const points = document.getElementById("genius_points_label");

    if (level) level.textContent = data.user?.genius_level || "SPARK";
    if (points) points.textContent = `${data.user?.genius_points || 0} puntos`;
}