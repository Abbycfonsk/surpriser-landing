import { state } from "../state/appState.js";
import { api } from "../api.js";
import { restartCountdowns, renderSimpleSurprise } from "./home.js";

import {
  getGeniusFeed,
  getGeniusDashboard,
  getGeniusOffers,
  getAllSkills,
  getTopSkill,
} from "../services/geniusService.js";

let geniusFeed = [];
let geniusOffers = [];
let geniusActiveSurprises = [];
let geniusCompletedSurprises = [];
let allSkills = [];
let proposedSkills = [];

window.loadGeniusDashboardController = loadGeniusDashboardController;

window.openChatController = openChatController;
window.openNegotiationController = openNegotiationController;

/* =====================================================
   CARGA PRINCIPAL
===================================================== */

export async function loadGeniusDashboardController() {
  const user = state.user;
  const token = state.token || localStorage.getItem("token");

  console.log("Estado para Genius:", {
    user,
    token,
  });

  const box = document.getElementById("genius_feed_list");

  if (!user?.id || !token) {
    console.error("No hay usuario autenticado.");

    if (box) {
      box.innerHTML = `
        <div class="genius-empty-state">
          Tu sesión ha caducado. Vuelve a iniciar sesión.
        </div>
      `;
    }

    return;
  }

  if (box) {
    box.innerHTML = `
      <div class="genius-empty-state">
        Cargando oportunidades...
      </div>
    `;
  }

  try {
    const results = await Promise.allSettled([
      getGeniusFeed(token),
      getGeniusOffers(token),
      getGeniusDashboard(user.id, token),
      api("GET", `/api/users/${user.id}/skills`, null, token),
      api("GET", `/api/users/${user.id}/surprises-genius`, null, token),
    ]);

    const feedResponse = getResult(results[0]);
    const offersResponse = getResult(results[1]);
    const dashboardResponse = getResult(results[2]);
    const skillsResponse = getResult(results[3]);
    const activeResponse = getResult(results[4]);

    console.log("Genius feed:", feedResponse);
    console.log("Genius offers:", offersResponse);
    console.log("Genius dashboard:", dashboardResponse);
    console.log("Genius skills:", skillsResponse);
    console.log("Genius active surprises:", activeResponse);

    if (!feedResponse?.ok) {
      throw new Error(
        feedResponse?.json?.error ||
          feedResponse?.json?.message ||
          "No se pudo cargar el feed genius.",
      );
    }

    geniusFeed = extractArray(feedResponse.json);
    geniusOffers = extractArray(offersResponse?.json);
    geniusCompletedSurprises = extractArray(dashboardResponse?.json);
    geniusActiveSurprises = extractArray(activeResponse?.json);

    const skillsData = skillsResponse?.json?.data || {};

    renderGeniusHeader(user, skillsData);
    await loadSkillsSelects(token);
    await loadSkillRanking(token);
    initGeniusSkillsToggle();
    renderGeniusFeed(sortGeniusFeed(geniusFeed));
    renderMiniOffers();

    renderMiniActiveSurprises();
  } catch (error) {
    console.error("Error cargando el panel genius:", error);

    if (box) {
      box.innerHTML = `
        <div class="genius-empty-state">
          No se ha podido cargar el panel Genius.
        </div>
      `;
    }

    showGeniusMessage(
      "Error cargando panel",
      error.message || "No se pudo cargar el panel Genius.",
    );
  }
}

/* =====================================================
   CABECERA
===================================================== */

export function renderGeniusHeader(user, skillsData = {}) {
  const level = document.getElementById("genius_level_label");
  const points = document.getElementById("genius_points_label");

  if (level) {
    level.textContent = user?.genius_level || "SPARK";
  }

  if (points) {
    points.textContent = `${user?.genius_points || 0} puntos`;
  }

  renderSkillCloud(skillsData);
}

/* =====================================================
   SKILLS
===================================================== */

export function renderSkillCloud(skillsData = {}) {
  const activeBox = document.getElementById("genius_active_skills_list");
  const proposedBox = document.getElementById("genius_proposed_skills_list");

  const activeSkills = skillsData.active || [];
  const proposedSkills = skillsData.proposed || [];

  if (activeBox) {
    activeBox.innerHTML = activeSkills.length
      ? activeSkills
          .map(
            (skill) => `
              <span class="skill-pill skill-pill-active">
                ${escapeHtml(skill.name || "Skill")}
                <small>Nivel ${skill.level || 0}</small>
              </span>
            `,
          )
          .join("")
      : `
          <div class="skills-empty">
            No tienes skills activas todavía.
          </div>
        `;
  }

  if (proposedBox) {
    proposedBox.innerHTML = proposedSkills.length
      ? proposedSkills
          .map(
            (skill) => `
              <span class="skill-pill skill-pill-proposed">
                ${escapeHtml(skill.name || "Skill")}
                <small>Pendiente</small>
              </span>
            `,
          )
          .join("")
      : `
          <div class="skills-empty">
            No tienes skills propuestas.
          </div>
        `;
  }
}
/* =====================================================
   FEED DE SORPRESAS
===================================================== */

function renderGeniusFeed(surprises = []) {
  const box = document.getElementById("genius_feed_list");

  if (!box) {
    console.error("No existe #genius_feed_list");
    return;
  }

  if (!surprises.length) {
    box.innerHTML = `
      <div class="genius-empty-state">
        No hay sorpresas disponibles para tus habilidades.
      </div>
    `;

    return;
  }

  box.innerHTML = surprises
    .map((surprise) => renderSimpleSurprise(surprise))
    .join("");

  restartCountdowns();
}
/* =====================================================
   OFERTAS
===================================================== */

function renderMiniOffers() {
  const box = document.getElementById("genius_offers_list");

  if (!box) return;

  if (!geniusOffers.length) {
    box.innerHTML = `
      <div class="genius-empty-state">
        Aún no has enviado ninguna oferta.
      </div>
    `;

    return;
  }

  box.innerHTML = geniusOffers
    .map((offer) => {
      const title = offer.surprise?.title || offer.title || "Sorpresa";

      return `
        <div class="mini-item">

          <strong>
            ${escapeHtml(title)}
          </strong>

          <span>
            ${offer.price || 0} €
            ·
            ${formatStatus(offer.status || "pending")}
          </span>

          <button
            type="button"
            class="btn btn-ghost"
            onclick="openNegotiationController(${offer.id})"
          >
            Regateo
          </button>

        </div>
      `;
    })
    .join("");
}

/* =====================================================
   SORPRESAS ACTIVAS
===================================================== */

function renderMiniActiveSurprises() {
  const box = document.getElementById("genius_active_list");

  if (!box) return;

  const active = geniusActiveSurprises.filter((surprise) =>
    ["in_progress", "delivered"].includes(surprise.status),
  );

  if (!active.length) {
    box.innerHTML = `
      <div class="genius-empty-state">
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
            ${escapeHtml(surprise.title || "Sorpresa")}
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
   ORDENACIÓN DEL FEED
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

    const urgentA = isTruthy(a.is_urgent);
    const urgentB = isTruthy(b.is_urgent);

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
  if (window.openConversationForSurprise) {
    window.openConversationForSurprise(id);
    return;
  }

  showGeniusMessage("Chat no disponible", "No se pudo abrir la conversación.");
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

function getResult(result) {
  return result?.status === "fulfilled" ? result.value : null;
}

function extractArray(response) {
  if (Array.isArray(response?.json?.data)) {
    return response.json.data;
  }

  if (Array.isArray(response?.json)) {
    return response.json;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
}

function isTruthy(value) {
  return value === true || value === 1 || value === "1";
}

function formatStatus(status) {
  const labels = {
    open: "Abierta",
    in_progress: "En progreso",
    delivered: "Entregada",
    completed: "Completada",
    cancelled: "Cancelada",
    pending: "Pendiente",
    accepted: "Aceptada",
    rejected: "Rechazada",
    negotiating: "Negociando",
  };

  return labels[status] || status;
}

function showGeniusMessage(title, message) {
  window.showNotificationToast?.({
    title,
    message,
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderGenius(data = {}) {
  const skillsData = Array.isArray(data.skills)
    ? {
        active: data.skills,
        proposed: [],
      }
    : data.skills || {};

  renderGeniusHeader(data.user || state.user, skillsData);
}
export function initGeniusSkillsToggle() {
  const button = document.getElementById("toggle_genius_skills");
  const content = document.getElementById("genius_skills_content");
  const panel = document.querySelector(".genius-skills-panel");

  if (!button || !content || !panel) return;

  button.onclick = () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";

    button.setAttribute("aria-expanded", String(!isOpen));
    content.hidden = isOpen;
    panel.classList.toggle("is-open", !isOpen);
  };
}
async function loadAvailableSkills(userId, skillsData, token) {
  const response = await getAllSkills(token);

  allSkills = response?.json?.data || [];
  proposedSkills = skillsData.proposed || [];

  const select = document.getElementById("available_skills_select");

  if (!select) return;

  const proposedIds = proposedSkills.map((skill) => Number(skill.id));

  select.innerHTML = `
    <option value="">Selecciona una skill</option>
    ${allSkills
      .filter((skill) => !proposedIds.includes(Number(skill.id)))
      .map(
        (skill) => `
          <option value="${skill.id}">
            ${escapeHtml(skill.name)}
          </option>
        `,
      )
      .join("")}
  `;

  bindProposedSkillsEvents(userId, token);
}
function bindProposedSkillsEvents(userId, token) {
  const addButton = document.getElementById("add_proposed_skill");

  if (addButton) {
    addButton.onclick = async () => {
      const select = document.getElementById("available_skills_select");
      const skillId = Number(select?.value);

      if (!skillId) return;

      const ids = proposedSkills.map((skill) => Number(skill.id));

      if (!ids.includes(skillId)) {
        ids.push(skillId);
      }

      const response = await updateProposedSkills(userId, ids, token);

      if (!response.ok) {
        showGeniusMessage(
          "Error",
          response.json?.message || "No se pudo añadir la skill.",
        );
        return;
      }

      showGeniusMessage(
        "Skill añadida",
        "La skill se ha añadido a tus propuestas.",
      );

      await loadGeniusDashboardController();
    };
  }
}
function renderProposedSkills(skills = []) {
  const box = document.getElementById("genius_proposed_skills_list");

  if (!box) return;

  if (!skills.length) {
    box.innerHTML = `
      <div class="skills-empty">
        No tienes skills propuestas.
      </div>
    `;
    return;
  }

  box.innerHTML = skills
    .map(
      (skill) => `
        <span class="skill-pill skill-pill-proposed">
          ${escapeHtml(skill.name)}

          <button
            type="button"
            class="skill-remove"
            data-remove-proposed-skill="${skill.id}"
            aria-label="Eliminar ${escapeHtml(skill.name)}"
          >
            ×
          </button>
        </span>
      `,
    )
    .join("");
}
function bindRemoveProposedSkills(userId, token, skills) {
  document
    .querySelectorAll("[data-remove-proposed-skill]")
    .forEach((button) => {
      button.onclick = async () => {
        const skillId = Number(button.dataset.removeProposedSkill);

        const remainingIds = skills
          .filter((skill) => Number(skill.id) !== skillId)
          .map((skill) => Number(skill.id));

        const response = await updateProposedSkills(
          userId,
          remainingIds,
          token,
        );

        if (!response.ok) {
          showGeniusMessage("Error", "No se pudo eliminar la skill propuesta.");
          return;
        }

        showGeniusMessage(
          "Skill eliminada",
          "La skill se ha eliminado de tus propuestas.",
        );

        await loadGeniusDashboardController();
      };
    });
}
async function loadSkillRanking(token) {
  const select = document.getElementById("ranking_skill_select");
  const box = document.getElementById("genius_ranking_list");

  if (!select || !box) return;

  const skillsResponse = await getAllSkills(token);
  const skills = skillsResponse?.json?.data || [];

  select.innerHTML = `
    <option value="">Selecciona una skill</option>
    ${skills
      .map(
        (skill) => `
          <option value="${skill.id}">
            ${escapeHtml(skill.name)}
          </option>
        `,
      )
      .join("")}
  `;

  select.onchange = async () => {
    const skillId = select.value;

    if (!skillId) {
      box.innerHTML = `
        <div class="skills-empty">
          Selecciona una habilidad para ver el ranking.
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div class="skills-empty">
        Cargando ranking...
      </div>
    `;

    const response = await getTopSkill(skillId, token);
    const ranking = response?.json?.top10 || [];

    if (!ranking.length) {
      box.innerHTML = `
        <div class="skills-empty">
          Todavía no hay genios clasificados en esta skill.
        </div>
      `;
      return;
    }

    box.innerHTML = ranking
      .map(
        (genius, index) => `
          <article class="ranking-item">
            <strong>#${index + 1}</strong>

            <div>
              <h3>${escapeHtml(genius.name)}</h3>
              <span>
                Nivel ${genius.level} ·
                ${genius.xp} XP ·
                ${genius.completed_surprises} sorpresas completadas
              </span>
            </div>
          </article>
        `,
      )
      .join("");
  };
}
async function loadSkillsSelects(token) {
  const response = await getAllSkills(token);

  console.log("Respuesta de skills:", response);

  const skills = response?.json?.data || [];

  const optionHtml = `
    <option value="">Selecciona una skill</option>
    ${skills
      .map(
        (skill) => `
          <option value="${skill.id}">
            ${escapeHtml(skill.name)}
          </option>
        `,
      )
      .join("")}
  `;

  const proposedSelect = document.getElementById("available_skills_select");

  const rankingSelect = document.getElementById("ranking_skill_select");

  if (proposedSelect) {
    proposedSelect.innerHTML = optionHtml;
  }

  if (rankingSelect) {
    rankingSelect.innerHTML = optionHtml;
  }
}
