import {
  getSurprise,
  getCreatedSurprises,
  cancelSurprise
} from "../services/surpriseService.js";

import { showAppSection } from "../router.js";
import { getTimeLeft, restartCountdowns } from "./home.js";
import { state } from "../state/appState.js";
import { uploadSurpriseFile, deleteSurpriseFile } from "../services/fileService.js";

const API = "https://api.surpriser.app";

let ownerSurprises = [];

export async function loadOwnerSurprises() {
  const token = localStorage.getItem("token");

  if (!state.user?.id) return;

  const res = await getCreatedSurprises(state.user.id, token);

  if (res.status !== 200) return;

  ownerSurprises = res.json?.data || [];
  renderOwnerSurprises(ownerSurprises);
}

export function renderOwnerSurprises(surprises = []) {
  const container = document.getElementById("created_surprises_list");
  if (!container) return;

  if (!surprises.length) {
    container.innerHTML = `<div class="app-card">Aún no tienes sorpresas creadas.</div>`;
    return;
  }

  container.innerHTML = surprises
    .map(renderOwnerSurpriseCard)
    .join("");

  restartCountdowns();
}

function renderOwnerSurpriseCard(surprise) {
  const status = surprise.status || "open";
  const skill = surprise.skill?.name || "Sin categoría";
  const size = surprise.size || "STANDARD";
  const title = surprise.title || "Sin título";

  const isUrgent = isTruthy(surprise.is_urgent);
  const isFeatured = isFeaturedSurprise(surprise);

  return `
    <div class="surprise-card-v2 owner-card ${isFeatured ? "surprise-card-v2-featured" : ""}">
      <div class="surprise-card-v2-top">
        <span class="surprise-status-v2 surprise-status-${status}">
          ${status}
        </span>

        ${isFeatured ? renderFeaturedBadge() : ""}
      </div>

      <div class="surprise-card-v2-body">
        <div class="surprise-card-v2-meta">
          ${
            isUrgent
              ? `<img src="img/destello.png" class="urgent-icon-v2" alt="Urgente">`
              : `<span class="urgent-icon-placeholder"></span>`
          }

          <div class="categorySize">
            <p>${skill}</p>
            <strong>${size}</strong>
          </div>

          ${
            surprise.deadline
              ? `<span class="surprise-countdown-v2" data-deadline="${surprise.deadline}">Calculando...</span>`
              : `<span class="surprise-countdown-v2">Sin fecha</span>`
          }
        </div>

        <h4>${title}</h4>

        <div class="surprise-card-v2-actions owner-actions">
          <a
            class="action-primary"
            href="#"
            data-action="owner-surprise-detail"
            data-surprise-id="${surprise.id}"
          >
            MODIFICAR
          </a>

          <a
            class="action-danger"
            href="#"
            data-action="owner-cancel-surprise"
            data-surprise-id="${surprise.id}"
          >
            CANCELAR
          </a>
        </div>
      </div>
    </div>
  `;
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

        const res = await fetch(`https://api.surpriser.app/api/surprises/${surpriseId}`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Accept": "application/json"
            },
            body: formData
        });

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

    return files.map(file => {
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
    }).join("");
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
                "No se pudo eliminar el archivo."
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
  return ["SMALL", "MEDIUM", "LARGE", "PREMIUM"].map(size => `
    <option value="${size}" ${current === size ? "selected" : ""}>
      ${size}
    </option>
  `).join("");
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
        const reasonText = document.getElementById("cancel_reason_text")?.value.trim();

        if (!surpriseId || !reasonKey) {
            showCancelModalMessage("Selecciona un motivo para cancelar.");
            return;
        }

        try {
            showCancelModalMessage("Cancelando sorpresa...", "info");

            const res = await cancelSurprise(surpriseId, {
                reason_key: reasonKey,
                reason_text: reasonText
            }, token);

            if (res.status < 200 || res.status >= 300) {
                throw new Error(
                    res.json?.error ||
                    res.json?.message ||
                    "No se pudo cancelar la sorpresa."
                );
            }

            closeOwnerCancelModal();

            window.showNotificationToast?.({
                title: "Sorpresa cancelada",
                message: "La sorpresa se ha cancelado correctamente."
            });

            await loadOwnerSurprises();

        } catch (error) {
            console.error("Error cancelando sorpresa:", error);
            showCancelModalMessage(error.message, "error");
        }
    });
}
