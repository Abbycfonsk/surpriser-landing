import {
  getSurprise,
  getCreatedSurprises,
  cancelSurprise,
} from "../services/surpriseService.js";

import { showAppSection } from "../router.js";
import { getTimeLeft, restartCountdowns } from "./home.js";
import { state } from "../state/appState.js";
import {
  uploadSurpriseFile,
  deleteSurpriseFile,
} from "../services/fileService.js";

const API = "https://api.surpriser.app";

let ownerFilters = {
  status: "",
  skill: "",
  size: "",
  deadline: "",
  urgent: false,
  featured: false,
};
let ownerSurprises = [];

let ownerFiltersInitialized = false;

export async function loadOwnerSurprises() {
  const token = localStorage.getItem("token");

  if (!state.user?.id) return;

  const res = await getCreatedSurprises(state.user.id, token);

  if (res.status !== 200) return;

  ownerSurprises = res.json?.data || [];

  if (!ownerFiltersInitialized) {
    loadOwnerSkillMenu();
    initOwnerDropdowns();
    initOwnerFilters();

    ownerFiltersInitialized = true;
  }

  applyOwnerFilters();
}

export function renderOwnerSurprises(surprises = []) {
  const container = document.getElementById("created_surprises_list");
  if (!container) return;

  if (!surprises.length) {
    container.innerHTML = `<div class="app-card">Aún no tienes sorpresas creadas.</div>`;
    return;
  }

  container.innerHTML = surprises.map(renderOwnerSurpriseCard).join("");

  restartCountdowns();
}

function getAllowedActions(status) {
  return {
    offers: status === "open",

    modify: ["open", "in_progress"].includes(status),

    cancel: ["open", "in_progress"].includes(status),

    chat: ["in_progress", "delivered", "completed", "disputed"].includes(
      status,
    ),

    review: ["delivered", "completed", "disputed"].includes(status),

    dispute: ["in_progress", "delivered", "completed", "disputed"].includes(
      status,
    ),

    complete: status === "delivered",
  };
}
function renderOwnerSurpriseCard(surprise) {
  const status = surprise.status || "open";
  const skill = surprise.skill?.name || "Sin categoría";
  const size = surprise.size || "STANDARD";
  const title = surprise.title || "Sin título";

  // ✅ CORREGIDO (nombres reales de API)
  const city = surprise.target_city || "Sin ciudad";
  const province = surprise.target_province || "";
  const country = surprise.target_country || "";

  const isUrgent = isTruthy(surprise.is_urgent);
  const isFeatured = isFeaturedSurprise(surprise);

  // ✅ CORREGIDO avatar
  const creatorImage = surprise.creator?.avatar || "img/default-avatar.png";

  return `
    <div class="surprise-card-v2 owner-card ${
      isFeatured ? "surprise-card-v2-featured" : ""
    }">

      <div class="surprise-card-v2-top">

        <span class="surprise-status-v2 surprise-status-${status}">
          ${status}
        </span>

        <div class="surprise-creator-img">
          <img src="${creatorImage}" alt="Creador">
        </div>
<div class="surprise-xp">
  ${surprise.xp_value} <span class="xp-suffix">XP</span>
</div>
        ${
          isFeatured
            ? `
              <div class="surprise-featured-stack">
                <img
                  class="surprise-featured-v2 surprise-featured-bg"
                  src="img/creacionestrellablanco.png"
                  alt=""
                  aria-hidden="true"
                >
                <img
                  class="surprise-featured-v2 surprise-featured-main"
                  src="img/creacionestrella.png"
                  alt="Creación estrella"
                >
              </div>
            `
            : ""
        }

      </div>

      <div class="surprise-card-v2-body">

        <div class="surprise-card-v2-city">
          ${city}
        </div>

        ${province ? `<div class="comunidad">${province}</div>` : ""}

        <h4>${title}</h4>

        <div class="surprise-card-v2-meta">

          ${
            isUrgent
              ? `<img src="img/destello.png" class="urgent-icon-v2" alt="Urgente">`
              : `<span class="urgent-icon-placeholder"></span>`
          }

          <div>
            <p>${skill}</p>
            <strong>${size}</strong>
          </div>

          ${
            surprise.deadline
              ? `<span class="surprise-countdown-v2" data-deadline="${surprise.deadline}">
                  Calculando...
                </span>`
              : `<span class="surprise-countdown-v2">Sin fecha</span>`
          }

        </div>

        <div class="surprise-card-v2-actions owner-actions">
          ${renderOwnerActions(surprise)}
        </div>

      </div>

    </div>
  `;
}
function renderOwnerActions(surprise) {
  const actions = getAllowedActions(surprise.status);

  const buttons = [];

  if (actions.offers) {
    buttons.push(`
      <a
        class="action-offer-mini"
        href="#"
        data-action="owner-offers"
        data-surprise-id="${surprise.id}"
      >
        OFERTAS
      </a>
    `);
  }

  if (actions.chat) {
    buttons.push(`
      <a
        class="action-chat-mini"
        href="#"
        data-action="owner-chat"
        data-surprise-id="${surprise.id}"
      >
        CHAT
      </a>
    `);
  }

  if (actions.complete) {
    buttons.push(`
      <a
        class="action-complete-mini"
        href="#"
        data-action="owner-complete"
        data-surprise-id="${surprise.id}"
      >
        COMPLETAR
      </a>
    `);
  }
  if (actions.review) {
    buttons.push(`
      <a
        class="action-review-mini"
        href="#"
        data-action="owner-review"
        data-surprise-id="${surprise.id}"
      >
        VALORAR
      </a>
    `);
  }

  if (actions.modify) {
    buttons.push(`
      <a
        class="action-primary"
        href="#"
        data-action="owner-surprise-detail"
        data-surprise-id="${surprise.id}"
      >
        MODIFICAR
      </a>
    `);
  }
  if (actions.dispute) {
    buttons.push(`
      <a
        class="action-dispute-mini"
        href="#"
        data-action="owner-dispute"
        data-surprise-id="${surprise.id}"
      >
        DISPUTA
      </a>
    `);
  }

  if (actions.cancel) {
    buttons.push(`
      <a
        class="action-danger"
        href="#"
        data-action="owner-cancel-surprise"
        data-surprise-id="${surprise.id}"
      >
        CANCELAR
      </a>
    `);
  }

  return buttons.join("");
}
function renderFeaturedBadge() {
  return `
    <div class="surprise-featured-stack">
      <img
        class="surprise-featured-v2 surprise-featured-bg"
        src="img/creacionestrellablanco.png"
        alt=""
        aria-hidden="true"
      >

      <img
        class="surprise-featured-v2 surprise-featured-main"
        src="img/creacionestrella.png"
        alt="Creación estrella"
      >
    </div>
  `;
}

/* =====================================================
   OWNER DETAIL / EDIT
===================================================== */

export async function openOwnerSurpriseDetail(surpriseId) {
  const token = localStorage.getItem("token");

  if (!surpriseId) return;

  showAppSection("owner-surprise-detail");

  const container = document.getElementById("owner_surprise_detail_container");

  if (container) {
    container.innerHTML = `<div class="app-card">Cargando sorpresa...</div>`;
  }

  const res = await getSurprise(surpriseId, token);

  if (res.status !== 200) {
    container.innerHTML = `<div class="app-card">No se pudo cargar la sorpresa.</div>`;
    return;
  }

  const surprise = res.json?.data || res.json;
  renderOwnerSurpriseDetail(surprise);
}

function renderOwnerSurpriseDetail(surprise) {
  const container = document.getElementById("owner_surprise_detail_container");
  if (!container) return;

  const status = surprise.status || "open";
  const skill = surprise.skill?.name || "Sin categoría";

  const imageUrl = surprise.header_image
    ? getImageUrl(surprise.header_image)
    : "img/eliges.png";

  container.innerHTML = `
  <div id="owner_detail_message" class="owner-detail-message" style="display:none"></div>
    <form class="owner-detail-card" id="owner_surprise_form">

      <div class="owner-detail-head">
        <div>
          <span class="detail-kicker">${skill}</span>
          <input
            id="owner_title"
            class="owner-title-input"
            value="${escapeAttr(surprise.title || "")}"
            placeholder="Título de la sorpresa"
          >
        </div>

        <span class="surprise-status-v2 surprise-status-${status}">
          ${status}
        </span>
      </div>

      <div class="owner-detail-grid">

        <div class="owner-image-panel">
          <img
            id="owner_header_preview"
            src="${imageUrl}"
            alt="${surprise.title || "Sorpresa"}"
          >

          <label class="owner-upload-btn">
            Cambiar imagen
            <input
              type="file"
              id="owner_header_file"
              accept="image/*"
              hidden
            >
          </label>
        </div>

        <div class="owner-edit-panel">

          <label>Descripción</label>
          <textarea id="owner_description">${surprise.description || ""}</textarea>

          <div class="owner-form-grid">
            <div>
              <label>Tamaño</label>
              <select id="owner_size">
                ${renderSizeOptions(surprise.size)}
              </select>
            </div>

            <div>
              <label>Deadline</label>
              <input
                id="owner_deadline"
                type="date"
                value="${formatDateForInput(surprise.deadline)}"
              >
            </div>

            <div>
              <label>Urgente</label>
              <select id="owner_is_urgent">
                <option value="0" ${!isTruthy(surprise.is_urgent) ? "selected" : ""}>No</option>
                <option value="1" ${isTruthy(surprise.is_urgent) ? "selected" : ""}>Sí</option>
              </select>
            </div>

            <div>
              <label>Precio</label>
              <input
                id="owner_price"
                type="number"
                step="0.01"
                value="${surprise.price || ""}"
                placeholder="Opcional"
              >
            </div>

            <div>
              <label>Ciudad</label>
              <input
                id="owner_target_city"
                value="${escapeAttr(surprise.target_city || "")}"
                placeholder="Ciudad"
              >
            </div>

            <div>
              <label>País</label>
              <input
                id="owner_target_country"
                value="${escapeAttr(surprise.target_country || "")}"
                placeholder="País"
              >
            </div>
          </div>

        </div>
      </div>

      <div class="owner-files-block">
        <div class="owner-files-head">
          <h3>Archivos vinculados</h3>

          <label class="owner-file-add">
            Añadir archivos
            <input
              type="file"
              id="owner_files"
              multiple
              hidden
            >
          </label>
        </div>

        <div class="detail-files-grid">
          ${renderOwnerFiles(surprise.files || [])}
        </div>
      </div>

      <div class="owner-detail-actions">
        <button
          type="button"
          class="detail-offer-btn"
          data-action="owner-save-surprise"
          data-surprise-id="${surprise.id}"
        >
          Guardar cambios
        </button>

        <button
          type="button"
          class="detail-secondary-btn"
          data-section="creator"
        >
          Volver al creador
        </button>
      </div>

    </form>
  `;

  bindOwnerImagePreview();
}

function bindOwnerImagePreview() {
  const input = document.getElementById("owner_header_file");
  const preview = document.getElementById("owner_header_preview");

  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;

    preview.src = URL.createObjectURL(file);
  });
}

export async function saveOwnerSurprise(surpriseId) {
  const token = localStorage.getItem("token");

  try {
    showOwnerDetailMessage("Guardando cambios...", "info");

    const formData = new FormData();

    formData.append("_method", "PUT");
    const title = getOwnerFieldValue("owner_title");
    const description = getOwnerFieldValue("owner_description");
    const size = getOwnerFieldRawValue("owner_size");
    const isUrgent = getOwnerFieldRawValue("owner_is_urgent");
    const deadline = getOwnerFieldRawValue("owner_deadline");

    if (title) formData.append("title", title);
    if (description) formData.append("description", description);
    if (size) formData.append("size", size);
    if (isUrgent !== "") formData.append("is_urgent", isUrgent);
    if (deadline) formData.append("deadline", deadline);

    const city = getOwnerFieldValue("owner_city");
    const country = getOwnerFieldValue("owner_country");
    const price = getOwnerFieldValue("owner_price");
    if (city) formData.append("target_city", city);
    if (country) formData.append("target_country", country);
    if (price) formData.append("price", price);

    const headerInput = document.getElementById("owner_header_file");

    if (headerInput?.files?.length) {
      formData.append("header_image", headerInput.files[0]);
    }

    const res = await fetch(
      `https://api.surpriser.app/api/surprises/${surpriseId}`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/json",
        },
        body: formData,
      },
    );

    const text = await res.text();

    let json = null;

    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }

    if (!res.ok) {
      throw new Error(getLaravelErrorMessage(json));
    }

    await uploadOwnerFiles(surpriseId, token);

    showOwnerDetailMessage("Sorpresa modificada con éxito.", "success");

    await loadOwnerSurprises();
  } catch (error) {
    console.error("Error guardando sorpresa:", error);
    showOwnerDetailMessage(error.message, "error");
  }
}

function showOwnerDetailMessage(message, type = "success") {
  const box = document.getElementById("owner_detail_message");

  if (!box) return;

  box.textContent = message;
  box.className = `owner-detail-message ${type}`;
  box.style.display = "block";
}
/* =====================================================
   HELPERS
===================================================== */

function renderOwnerFiles(files = []) {
  if (!files.length) {
    return `<p class="detail-empty-files">No hay archivos vinculados.</p>`;
  }

  return files
    .map((file) => {
      const rawPath = file.path || file.file_url || file.url || "";
      const url = getFileUrl(rawPath);
      const isImage = /\.(png|jpe?g|webp|gif)$/i.test(rawPath);
      const fileName = file.filename || rawPath.split("/").pop() || "Archivo";
      const fileId = file.id;

      return `
            <div class="owner-file-thumb-wrap">
                <a class="owner-file-card" href="${url}" target="_blank" rel="noopener">
                    <div class="owner-file-preview">
                        ${
                          isImage
                            ? `<img src="${url}" alt="${fileName}">`
                            : `<div class="file-generic-icon">${getFileLabel(file)}</div>`
                        }
                    </div>

                    <span class="owner-file-name" title="${fileName}">
                        ${fileName}
                    </span>
                </a>

                <button
                    type="button"
                    class="owner-file-delete"
                    data-action="owner-delete-file"
                    data-file-id="${fileId}"
                    aria-label="Eliminar archivo"
                >
                    ×
                </button>
            </div>
        `;
    })
    .join("");
}

export async function deleteOwnerFile(fileId) {
  const token = localStorage.getItem("token");

  if (!fileId) return;

  const ok = confirm("¿Eliminar este archivo?");

  if (!ok) return;

  try {
    const res = await deleteSurpriseFile(fileId, token);

    if (!res.ok) {
      throw new Error(
        res.json?.error ||
          res.json?.message ||
          "No se pudo eliminar el archivo.",
      );
    }

    showOwnerDetailMessage("Archivo eliminado correctamente.", "success");

    const button = document.querySelector(`[data-file-id="${fileId}"]`);
    const wrapper = button?.closest(".owner-file-thumb-wrap");

    if (wrapper) {
      wrapper.remove();
    }
  } catch (error) {
    console.error("Error eliminando archivo:", error);
    showOwnerDetailMessage(error.message, "error");
  }
}

function renderSizeOptions(current) {
  return ["SMALL", "MEDIUM", "LARGE", "PREMIUM"]
    .map(
      (size) => `
    <option value="${size}" ${current === size ? "selected" : ""}>
      ${size}
    </option>
  `,
    )
    .join("");
}
function getFileLabel(file) {
  const mime = file.mime || "";
  const path = file.path || file.file_url || file.url || file.filename || "";

  if (mime === "application/pdf" || /\.pdf$/i.test(path)) return "PDF";
  if (mime === "video/mp4" || /\.mp4$/i.test(path)) return "Video";
  if (mime === "audio/mpeg" || /\.mp3$/i.test(path)) return "Audio";

  return "Archivo";
}
function isFeaturedSurprise(surprise) {
  return (
    Number(surprise.ads_count) > 0 ||
    surprise.ads_exists === true ||
    surprise.ads_exists === 1 ||
    surprise.ads_exists === "1" ||
    (Array.isArray(surprise.ads) && surprise.ads.length > 0)
  );
}

function isTruthy(value) {
  return value === 1 || value === true || value === "1";
}

function getImageUrl(path) {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/storage/")) return API + path;

  return API + "/storage/" + path;
}

function getFileUrl(path) {
  if (!path) return "#";

  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/storage/")) return API + path;

  return API + "/storage/" + path;
}

function formatDateForInput(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function uploadOwnerFiles(surpriseId, token) {
  const input = document.getElementById("owner_files");

  if (!input || !input.files.length) return;

  for (const file of input.files) {
    const res = await uploadSurpriseFile(surpriseId, file, token);

    if (!res.ok) {
      throw new Error(getLaravelErrorMessage(res.json));
    }
  }
}
function getOwnerFieldValue(id, fallback = "") {
  const field = document.getElementById(id);
  return field ? field.value.trim() : fallback;
}

function getOwnerFieldRawValue(id, fallback = "") {
  const field = document.getElementById(id);
  return field ? field.value : fallback;
}

function getLaravelErrorMessage(errorResponse) {
  const errors = errorResponse?.errors;

  if (errors?.file?.length) {
    return errors.file[0];
  }

  if (errors) {
    const firstKey = Object.keys(errors)[0];

    if (firstKey && errors[firstKey]?.length) {
      return errors[firstKey][0];
    }
  }

  return errorResponse?.message || "No se pudo guardar la sorpresa.";
}
export function cancelOwnerSurprise(surpriseId) {
  openOwnerCancelModal(surpriseId);
}

function openOwnerCancelModal(surpriseId) {
  const modal = document.getElementById("owner_cancel_modal");
  const input = document.getElementById("cancel_surprise_id");
  const message = document.getElementById("cancel_modal_message");

  if (!modal || !input) return;

  input.value = surpriseId;

  if (message) {
    message.textContent = "";
    message.style.display = "none";
  }

  modal.style.display = "grid";
}

export function closeOwnerCancelModal() {
  const modal = document.getElementById("owner_cancel_modal");
  const form = document.getElementById("owner_cancel_form");

  if (form) form.reset();
  if (modal) modal.style.display = "none";
}

function showCancelModalMessage(message, type = "error") {
  const box = document.getElementById("cancel_modal_message");

  if (!box) return;

  box.textContent = message;
  box.className = `owner-detail-message ${type}`;
  box.style.display = "block";
}

export function initOwnerCancelModal() {
  const form = document.getElementById("owner_cancel_form");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const surpriseId = document.getElementById("cancel_surprise_id")?.value;
    const reasonKey = document.getElementById("cancel_reason_key")?.value;
    const reasonText = document
      .getElementById("cancel_reason_text")
      ?.value.trim();

    if (!surpriseId || !reasonKey) {
      showCancelModalMessage("Selecciona un motivo para cancelar.");
      return;
    }

    try {
      showCancelModalMessage("Cancelando sorpresa...", "info");

      const res = await cancelSurprise(
        surpriseId,
        {
          reason_key: reasonKey,
          reason_text: reasonText,
        },
        token,
      );

      if (res.status < 200 || res.status >= 300) {
        throw new Error(
          res.json?.error ||
            res.json?.message ||
            "No se pudo cancelar la sorpresa.",
        );
      }

      closeOwnerCancelModal();

      window.showNotificationToast?.({
        title: "Sorpresa cancelada",
        message: "La sorpresa se ha cancelado correctamente.",
      });

      await loadOwnerSurprises();
    } catch (error) {
      console.error("Error cancelando sorpresa:", error);
      showCancelModalMessage(error.message, "error");
    }
  });
}
//======================================//
//FILTROS//
//======================================//
function applyOwnerFilters() {
  let results = [...ownerSurprises];

  if (ownerFilters.status) {
    results = results.filter((s) => s.status === ownerFilters.status);
  }

  if (ownerFilters.skill) {
    results = results.filter((s) => String(s.skill?.id) === ownerFilters.skill);
  }

  if (ownerFilters.size) {
    results = results.filter((s) => s.size === ownerFilters.size);
  }

  if (ownerFilters.urgent) {
    results = results.filter((s) => isTruthy(s.is_urgent));
  }

  if (ownerFilters.featured) {
    results = results.filter((s) => isFeaturedSurprise(s));
  }

  if (ownerFilters.deadline === "asc") {
    results.sort(
      (a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0),
    );
  }

  if (ownerFilters.deadline === "desc") {
    results.sort(
      (a, b) => new Date(b.deadline || 0) - new Date(a.deadline || 0),
    );
  }
  if (ownerFilters.deadline === "asc") {
    results.sort(
      (a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0),
    );
  } else if (ownerFilters.deadline === "desc") {
    results.sort(
      (a, b) => new Date(b.deadline || 0) - new Date(a.deadline || 0),
    );
  } else {
    results = sortByStatusPriority(results);
  }

  renderOwnerSurprises(results);
}
export function initOwnerFilters() {
  document.querySelectorAll("[data-owner-size]").forEach((el) => {
    el.addEventListener("click", () => {
      ownerFilters.size = el.dataset.ownerSize || "";

      applyOwnerFilters();
    });
  });
  document.querySelectorAll("[data-owner-status]").forEach((el) => {
    el.addEventListener("click", () => {
      ownerFilters.status = el.dataset.ownerStatus || "";

      applyOwnerFilters();
    });
  });
  document.querySelectorAll("[data-owner-deadline]").forEach((el) => {
    el.addEventListener("click", () => {
      ownerFilters.deadline = el.dataset.ownerDeadline || "";

      applyOwnerFilters();
    });
  });
  document
    .getElementById("owner_filter_urgent")
    ?.addEventListener("change", (e) => {
      ownerFilters.urgent = e.target.checked;

      applyOwnerFilters();
    });
  document
    .getElementById("owner_filter_featured")
    ?.addEventListener("change", (e) => {
      ownerFilters.featured = e.target.checked;

      applyOwnerFilters();
    });
  document
    .getElementById("owner_reset_filters")
    ?.addEventListener("click", () => {
      ownerFilters = {
        status: "",
        skill: "",
        size: "",
        deadline: "",
        urgent: false,
        featured: false,
      };

      applyOwnerFilters();
    });
}
function loadOwnerSkillMenu() {
  const menu = document.getElementById("owner_skill_menu");

  if (!menu) return;

  menu.innerHTML = `
    <div class="option" data-owner-skill="">
      Todas
    </div>

    ${state.skills
      .map(
        (skill) => `
      <div
        class="option"
        data-owner-skill="${skill.id}"
      >
        ${skill.name}
      </div>
    `,
      )
      .join("")}
  `;
  menu.querySelectorAll("[data-owner-skill]").forEach((el) => {
    el.addEventListener("click", () => {
      ownerFilters.skill = el.dataset.ownerSkill || "";

      console.log("SKILL SELECTED:", ownerFilters.skill);

      applyOwnerFilters();
    });
  });
}
function initOwnerDropdowns() {
  document
    .querySelectorAll(".creator-filters .filter-item.dropdown")
    .forEach((item) => {
      const btn = item.querySelector(".filter-btn");
      const menu = item.querySelector(".dropdown-menu");

      if (!btn || !menu) return;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        document
          .querySelectorAll(".creator-filters .dropdown-menu")
          .forEach((other) => {
            if (other !== menu) {
              other.classList.remove("is-open");
            }
          });

        menu.classList.toggle("is-open");
      });
    });

  document.addEventListener("click", () => {
    document
      .querySelectorAll(".creator-filters .dropdown-menu")
      .forEach((menu) => {
        menu.classList.remove("is-open");
      });
  });
}

/* ORDENAR LISTADO DE SORPRESAS */
function sortByStatusPriority(surprises) {
  const statusOrder = {
    open: 1,
    in_progress: 2,
    delivered: 3,
    completed: 4,
    disputed: 5,
    cancelled: 6,
    canceled: 6, // por si el backend usa spelling americano
  };

  return surprises.sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 999;
    const orderB = statusOrder[b.status] ?? 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Dentro del mismo estado, las más recientes primero
    return (b.id || 0) - (a.id || 0);
  });
}
