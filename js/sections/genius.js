import { state } from "../state/appState.js";
import { api } from "../api.js";
import { restartCountdowns } from "../sections/home.js";

import {
  getGeniusFeed,
  getGeniusDashboard,
  getGeniusOffers,
} from "../services/geniusService.js";

const API = "https://api.surpriser.app";

let geniusFeed = [];
let geniusOffers = [];
let geniusActiveSurprises = [];

window.loadGeniusDashboardController = loadGeniusDashboardController;

window.openChatController = openChatController;
window.openNegotiationController = openNegotiationController;

/* =====================================================
   DASHBOARD GENIUS
===================================================== */

export async function loadGeniusDashboardController() {
  const user = state.user;
  const token = state.token || localStorage.getItem("token");

  if (!user?.id || !token) {
    console.error("No hay usuario o token para cargar el panel genius.");
    return;
  }

  try {
    const [feedResponse, offersResponse, dashboardResponse] = await Promise.all(
      [
        getGeniusFeed(token),
        getGeniusOffers(token),
        getGeniusDashboard(user.id, token),
      ],
    );

    console.log("Genius feed:", feedResponse);
    console.log("Genius offers:", offersResponse);
    console.log("Genius dashboard:", dashboardResponse);

    if (!feedResponse.ok) {
      throw new Error(
        feedResponse.json?.error ||
          feedResponse.json?.message ||
          "No se pudo cargar el feed genius.",
      );
    }

    geniusFeed = normalizeArray(feedResponse.json);
    geniusOffers = normalizeArray(offersResponse.json);

    const dashboard =
      dashboardResponse.json?.data || dashboardResponse.json || {};

    geniusActiveSurprises =
      dashboard.active_surprises ||
      dashboard.surprises ||
      dashboard.surprises_genius ||
      [];

    const dashboardUser = dashboard.user || user;

    const skills = dashboard.skills || dashboardUser.skills || [];

    renderGeniusHeader(dashboardUser, skills);
    renderGeniusFeed(sortGeniusFeed(geniusFeed));
    renderMiniOffers();
    renderMiniActiveSurprises();

    restartCountdowns();
  } catch (error) {
    console.error("Error cargando panel genius:", error);

    showGeniusMessage(
      "Error cargando panel genius",
      error.message || "No se pudo cargar el panel.",
    );
  }
}

/* =====================================================
   FEED DE SORPRESAS
===================================================== */

function renderGeniusFeed(surprises = []) {
  const box = document.getElementById("genius_feed_list");

  if (!box) {
    console.error("No existe el elemento #genius_feed_list");
    return;
  }

  if (!surprises.length) {
    box.innerHTML = `
      <div class="mini-item">
        No hay sorpresas disponibles para tus habilidades.
      </div>
    `;
    return;
  }

  box.innerHTML = surprises
    .map((surprise) => {
      const status = surprise.status || "open";
      const location = surprise.location || {};

      const city = location.city || surprise.target_city || "Sin ciudad";

      const province = location.province || surprise.target_province || "";

      const isUrgent =
        surprise.is_urgent === true ||
        surprise.is_urgent === 1 ||
        surprise.is_urgent === "1";

      return `
        <article class="surprise-card-v2">

          <div class="surprise-card-v2-top">

            <span class="surprise-status-v2 surprise-status-${status}">
              ${formatStatus(status)}
            </span>

            ${
              isUrgent
                ? `
                  <img
                    src="img/destello.png"
                    class="urgent-icon-v2"
                    alt="Urgente"
                  >
                `
                : ""
            }

          </div>

          <div class="surprise-card-v2-body">

            <div class="surprise-card-v2-city">
              ${city}
            </div>

            ${province ? `<div class="comunidad">${province}</div>` : ""}

            <h4>
              ${surprise.title || "Sin título"}
            </h4>

            <div class="surprise-card-v2-meta">

              <div>
                <p>
                  ${surprise.skill?.name || "Sin categoría"}
                </p>

                <strong>
                  ${surprise.size || "SMALL"}
                </strong>
              </div>

              ${
                surprise.deadline
                  ? `
                    <span
                      class="surprise-countdown-v2"
                      data-deadline="${surprise.deadline}"
                    >
                      Calculando...
                    </span>
                  `
                  : `
                    <span class="surprise-countdown-v2">
                      Sin fecha
                    </span>
                  `
              }

            </div>

            <div class="surprise-card-v2-actions">

              <a
                href="#"
                class="action-primary"
                data-action="open-offer-modal"
                data-surprise-id="${surprise.id}"
              >
                HACER OFERTA
              </a>

              <a
                href="#"
                class="action-more"
                data-action="surprise-detail"
                data-surprise-id="${surprise.id}"
              >
                MÁS INFO
              </a>

            </div>

          </div>

        </article>
      `;
    })
    .join("");
}

/* =====================================================
   CABECERA
===================================================== */

export function renderGeniusHeader(user, skills = []) {
  const level = document.getElementById("genius_level_label");
  const points = document.getElementById("genius_points_label");

  if (level) {
    level.textContent = user?.genius_level || "SPARK";
  }

  if (points) {
    points.textContent = `${user?.genius_points || 0} puntos`;
  }

  renderSkillCloud(skills);
}

/* =====================================================
   SKILLS
===================================================== */

export function renderSkillCloud(skills = []) {
  const box = document.getElementById("genius_skills_list");

  if (!box) return;

  if (!skills.length) {
    box.innerHTML = `
      <span class="skill-pill">
        Sin skills activas
      </span>
    `;
    return;
  }

  box.innerHTML = skills
    .map(
      (skill) => `
        <span class="skill-pill">
          ${skill.skill_name || skill.name || "Skill"}
          · Nivel ${skill.level || 0}
        </span>
      `,
    )
    .join("");
}

/* =====================================================
   OFERTAS
===================================================== */

export function renderMiniOffers() {
  const box = document.getElementById("genius_offers_list");

  if (!box) return;

  if (!geniusOffers.length) {
    box.innerHTML = `
      <div class="mini-item">
        Aún no has ofertado.
      </div>
    `;
    return;
  }

  box.innerHTML = geniusOffers
    .map(
      (offer) => `
        <div class="mini-item">

          <strong>
            ${offer.surprise?.title || "Sorpresa"}
          </strong>

          <span>
            ${offer.price || ""} €
            ·
            ${offer.status || "pending"}
          </span>

          <button
            type="button"
            class="btn btn-ghost"
            onclick="openNegotiationController(${offer.id})"
          >
            Regateo
          </button>

        </div>
      `,
    )
    .join("");
}

/* =====================================================
   SORPRESAS ACTIVAS
===================================================== */

export function renderMiniActiveSurprises() {
  const box = document.getElementById("genius_active_list");

  if (!box) return;

  const active = geniusActiveSurprises.filter((surprise) =>
    ["in_progress", "delivered"].includes(surprise.status),
  );

  if (!active.length) {
    box.innerHTML = `
      <div class="mini-item">
        No tienes sorpresas en marcha.
      </div>
    `;
    return;
  }

  box.innerHTML = active
    .map(
      (surprise) => `
        <div class="mini-item">

          <strong>
            ${surprise.title || "Sorpresa"}
          </strong>

          <span>
            ${formatStatus(surprise.status)}
          </span>

          <button
            type="button"
            class="btn btn-ghost"
            onclick="openChatController(${surprise.id})"
          >
            Chat
          </button>

        </div>
      `,
    )
    .join("");
}

/* =====================================================
   ORDENACIÓN
===================================================== */

export function sortGeniusFeed(surprises = []) {
  const adOrder = {
    premium: 1,
    pro: 2,
    starter: 3,
    start: 3,
  };

  return [...surprises].sort((a, b) => {
    const adA = a.ads?.[0] ? adOrder[a.ads[0].ad_type] || 50 : 50;

    const adB = b.ads?.[0] ? adOrder[b.ads[0].ad_type] || 50 : 50;

    if (adA !== adB) {
      return adA - adB;
    }

    const urgentA =
      a.is_urgent === true || a.is_urgent === 1 || a.is_urgent === "1";

    const urgentB =
      b.is_urgent === true || b.is_urgent === 1 || b.is_urgent === "1";

    if (urgentA !== urgentB) {
      return urgentB ? 1 : -1;
    }

    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

/* =====================================================
   ACCIONES
===================================================== */

export async function offerSurpriseController(id) {
  const price = prompt("Precio de tu oferta");

  if (!price) return;

  const message = prompt("Mensaje para la creadora") || "";

  const eta = prompt("Horas estimadas", "24") || "24";

  const token = localStorage.getItem("token");

  const response = await api(
    "POST",
    `/api/surprises/${id}/offers`,
    {
      price: Number(price),
      message,
      eta_hours: Number(eta),
    },
    token,
  );

  showGeniusMessage(
    response.ok ? "Oferta enviada" : "Error",
    response.json?.message ||
      response.json?.error ||
      "No se pudo enviar la oferta.",
  );
}

export function openChatController(id) {
  window.openConversationForSurprise?.(id);
}

export function openNegotiationController(id) {
  showGeniusMessage(
    "Regateo",
    "La sección de negociación estará disponible próximamente.",
  );
}

/* =====================================================
   HELPERS
===================================================== */

function normalizeArray(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
}

function formatStatus(status) {
  const labels = {
    open: "Abierta",
    in_progress: "En progreso",
    delivered: "Entregada",
    completed: "Completada",
    cancelled: "Cancelada",
  };

  return labels[status] || status;
}

function showGeniusMessage(title, message) {
  window.showNotificationToast?.({
    title,
    message,
  });
}

/* Compatibilidad con otros controladores */

export function renderGenius(data = {}) {
  renderGeniusHeader(data.user || state.user, data.skills || []);
}
