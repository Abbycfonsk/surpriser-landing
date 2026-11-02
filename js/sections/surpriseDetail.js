import { showAppSection } from "../router.js";
import { getSurprise } from "../services/surpriseService.js";
import { createOffer } from "../services/offerService.js";
import { getTimeLeft } from "./home.js";
import { state } from "../state/appState.js";
import {
  uploadSurpriseFile,
  deleteSurpriseFile,
} from "../services/fileService.js";

const API = "https://api.surpriser.app";

let notificationToastTimer = null;

export function initSurpriseDetail() {
  window.openSurpriseDetail = openSurpriseDetail;
  window.openOfferModal = openOfferModal;
  window.closeOfferModal = closeOfferModal;
  window.offerFromDetail = openOfferModal;
  window.openCreatorDetail = openCreatorDetail;
  window.showNotificationToast = showNotificationToast;
  window.openGeniusReadonlyDetail = openGeniusReadonlyDetail;

  initOfferModal();
}

/* =====================================================
   DETAIL
===================================================== */

export async function openSurpriseDetail(surpriseId) {
  const token = localStorage.getItem("token");

  if (!surpriseId) return;

  showAppSection("surprise-detail");

  const container = document.getElementById("surprise_detail_container");

  if (container) {
    container.innerHTML = `<div class="app-card">Cargando detalle...</div>`;
  }

  try {
    const res = await getSurprise(surpriseId, token);

    if (res.status !== 200) {
      throw new Error("No se pudo cargar la sorpresa.");
    }

    const surprise = res.json?.data || res.json;

    renderSurpriseDetail(surprise);
  } catch (error) {
    console.error(error);

    if (container) {
      container.innerHTML = `<div class="app-card">No se pudo cargar la sorpresa.</div>`;
    }
  }
}

function renderSurpriseDetail(surprise) {
  const container = document.getElementById("surprise_detail_container");
  if (!container) return;

  const creator = surprise.creator || {};
  const skill = surprise.skill || {};
  const files = surprise.files || [];

  const imageUrl = surprise.header_image
    ? getImageUrl(surprise.header_image)
    : "img/eliges.png";

  const creatorAvatar = creator.avatar
    ? getImageUrl(creator.avatar)
    : `${API}/storage/defaults/avatar.png`;

  const timeLeft = getTimeLeft(surprise.deadline);
  const status = surprise.status || "open";

  const location =
    [surprise.target_city, surprise.target_province, surprise.target_country]
      .filter(Boolean)
      .join(", ") || "No especificada";

  container.innerHTML = `
    <article class="surprise-detail-compact">

      <div class="detail-main-card">

       <div class="detail-header-row">
    <div>
        <span class="detail-kicker">
            ${skill.name || "Sin categoría"}
        </span>

        <h1>
            ${surprise.title || "Sin título"}
        </h1>

        <div class="detail-status-wrapper">
            <span class="detail-status-pill detail-status-${status}">
                ${status}
            </span>
        </div>
    </div>
</div>
        <div class="detail-content-grid">

          <div class="detail-image-compact">
            <img
              src="${imageUrl}"
              alt="${surprise.title || "Sorpresa"}"
            >
          </div>

          <div class="detail-summary">

            <p>
              ${surprise.description || "Sin descripción."}
            </p>

            <div class="detail-countdown-box">

              <span class="detail-countdown-label">
                Tiempo restante
              </span>

              <strong class="detail-countdown-value">
                ${timeLeft}
              </strong>

            </div>

            <div class="detail-summary-info">

              <div class="detail-info-row">
                <span>📍 Ubicación</span>
                <strong>${location}</strong>
              </div>

              <div class="detail-info-row">
                <span>📅 Fecha límite</span>
                <strong>
                  ${formatDate(surprise.deadline)}
                </strong>
              </div>

              <div class="detail-info-row">
                <span>🚨 Prioridad</span>
                <strong>
                  ${isTruthy(surprise.is_urgent) ? "Urgente" : "Normal"}
                </strong>
              </div>

            </div>

          </div>

        </div>

        <div class="detail-files-block">

          <h3>Archivos vinculados</h3>

          <div class="detail-files-grid">
            ${renderSurpriseFiles(files)}
          </div>

        </div>

        <div class="detail-actions">

          <button
            class="detail-offer-btn"
            data-action="open-offer-modal"
            data-surprise-id="${surprise.id}"
          >
            Hacer oferta
          </button>

          <button
            class="detail-secondary-btn"
            data-section="home"
          >
            Volver al listado
          </button>

        </div>

      </div>

      <aside class="creator-detail-panel compact">

        <img
          class="creator-detail-avatar"
          src="${creatorAvatar}"
          alt="${creator.username || creator.name || "Creador"}"
        >

        <button
          class="creator-name-btn"
          data-action="creator-detail"
          data-creator-id="${creator.id || ""}"
        >
          ${
            creator.username
              ? "@" + creator.username
              : creator.name || "Creador"
          }
        </button>

        <div class="creator-role-list">
          ${isTruthy(creator.is_creator) ? "<span>Creador</span>" : ""}

          ${isTruthy(creator.is_genius) ? "<span>Genio</span>" : ""}
        </div>

        <div class="creator-mini-info">

          <div>
            <span>Ciudad</span>
            <strong>
              ${creator.location_city || "No indicada"}
            </strong>
          </div>

          <div>
            <span>País</span>
            <strong>
              ${creator.location_country || "No indicado"}
            </strong>
          </div>

          <div>
            <span>Nivel genius</span>
            <strong>
              ${creator.genius_level || "Sin nivel"}
            </strong>
          </div>

        </div>

      </aside>

    </article>
  `;
}
function renderSurpriseFiles(files = []) {
  if (!files.length) {
    return `<p class="detail-empty-files">No hay archivos vinculados.</p>`;
  }

  return files
    .map((file) => {
      const path = file.file_path || file.path || file.url || "";
      const url = getFileUrl(path);
      const isImage = /\.(png|jpe?g|webp|gif)$/i.test(path);

      return `
            <a class="detail-file-thumb" href="${url}" target="_blank" rel="noopener">
                ${
                  isImage
                    ? `<img src="${url}" alt="Archivo">`
                    : `<div class="file-generic-icon">Archivo</div>`
                }
            </a>
        `;
    })
    .join("");
}

/* =====================================================
   OFFER MODAL
===================================================== */

function initOfferModal() {
  const form = document.getElementById("offer_form");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const surpriseId = document.getElementById("offer_surprise_id")?.value;

    const priceValue = document.getElementById("offer_price")?.value.trim();

    const etaValue = document.getElementById("offer_eta")?.value.trim();

    const message =
      document.getElementById("offer_message")?.value.trim() || null;

    const price = Number(priceValue);
    const etaHours = Number(etaValue);

    if (!Number.isFinite(price) || price < 1) {
      showNotificationToast({
        title: "Precio inválido",
        message: "Introduce un precio mayor que 0.",
      });
      return;
    }

    if (!Number.isInteger(etaHours) || etaHours < 1) {
      showNotificationToast({
        title: "Tiempo inválido",
        message: "Introduce un número entero de horas.",
      });
      return;
    }

    const res = await createOffer(
      surpriseId,
      {
        price,
        message,
        eta_hours: etaHours,
      },
      token,
    );

    console.log("Respuesta de createOffer:", res);

    if (!res.ok) {
      const validationError = res.json?.errors
        ? Object.values(res.json.errors).flat()[0]
        : null;

      const errorMessage =
        res.json?.error ||
        res.json?.message ||
        validationError ||
        "No se pudo enviar la oferta.";

      showNotificationToast({
        title: "Oferta no enviada",
        message: errorMessage,
      });

      return;
    }

    closeOfferModal();

    showNotificationToast({
      title: "Oferta enviada",
      message: res.json?.message || "Tu propuesta se ha enviado correctamente.",
    });
  });
}

function openOfferModal(surpriseId) {
  const modal = document.getElementById("offer_modal");
  const idInput = document.getElementById("offer_surprise_id");

  if (!modal || !idInput) return;

  idInput.value = surpriseId;
  modal.style.display = "grid";
}

function closeOfferModal() {
  const modal = document.getElementById("offer_modal");
  const form = document.getElementById("offer_form");

  if (form) form.reset();
  if (modal) modal.style.display = "none";
}

/* =====================================================
   CREATOR DETAIL PLACEHOLDER
===================================================== */

function openCreatorDetail(creatorId) {
  if (!creatorId) return;

  showNotificationToast({
    title: "Perfil de creador",
    message: `Abrir perfil público del creador ${creatorId}.`,
  });
}

/* =====================================================
   TOAST
===================================================== */

export function showNotificationToast(notification) {
  const toast = document.getElementById("notification_toast");
  if (!toast) return;

  toast.innerHTML = `
        <strong>${notification.title || "Notificación"}</strong>
        <span>${notification.message || ""}</span>
    `;

  toast.style.display = "grid";

  if (notificationToastTimer) {
    clearTimeout(notificationToastTimer);
  }

  notificationToastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 5000);
}

/* =====================================================
   HELPERS
===================================================== */

function getImageUrl(path) {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/storage/")) {
    return API + path;
  }

  return API + "/storage/" + path;
}

function getFileUrl(path) {
  if (!path) return "#";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/storage/")) {
    return API + path;
  }

  return API + "/storage/" + path;
}

function isTruthy(value) {
  return value === 1 || value === true || value === "1";
}

function formatDate(date) {
  if (!date) return "Sin fecha";

  const parsed = new Date(String(date).replace(" ", "T"));

  if (isNaN(parsed.getTime())) return "Fecha inválida";

  return parsed.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
export async function openGeniusReadonlyDetail(surpriseId) {
  const token = localStorage.getItem("token");

  if (!surpriseId || !token) return;

  await showAppSection("surprise-detail");

  const container = document.getElementById("surprise_detail_container");

  if (!container) return;

  container.innerHTML = `
    <div class="app-card">
      Cargando detalle...
    </div>
  `;

  const response = await getSurprise(surpriseId, token);

  if (!response.ok) {
    container.innerHTML = `
      <div class="app-card">
        No se pudo cargar la sorpresa.
      </div>
    `;
    return;
  }

  const surprise = response.json?.data || response.json;

  renderGeniusReadonlyDetail(surprise);
}
function renderGeniusReadonlyDetail(surprise) {
  const container = document.getElementById("surprise_detail_container");

  if (!container) return;

  const files = surprise.files || [];
  const skill = surprise.skill?.name || "Sin categoría";
  const status = surprise.status || "open";
  const currentUserId = Number(state.user?.id);

  const location = [
    surprise.target_city,
    surprise.target_province,
    surprise.target_country,
  ]
    .filter(Boolean)
    .join(", ");

  const imageUrl = surprise.header_image
    ? getImageUrl(surprise.header_image)
    : "img/eliges.png";

  container.innerHTML = `
    <article class="surprise-detail-compact genius-readonly-detail">
      <div class="detail-main-card">

        <div class="detail-header-row">
          <div>
            <span class="detail-kicker">
              ${escapeHtml(skill)}
            </span>

            <h1>
              ${escapeHtml(surprise.title || "Sin título")}
            </h1>

            <span class="detail-status-pill detail-status-${status}">
              ${escapeHtml(status)}
            </span>
          </div>
        </div>

        <div class="detail-content-grid">
          <div class="detail-image-compact">
            <img
              src="${imageUrl}"
              alt="${escapeHtml(surprise.title || "Sorpresa")}"
            >
          </div>

          <div class="detail-summary">
            <p>
              ${escapeHtml(surprise.description || "Sin descripción.")}
            </p>

            <div class="detail-summary-info">
              <div class="detail-info-row">
                <span>Ubicación</span>
                <strong>
                  ${escapeHtml(location || "No especificada")}
                </strong>
              </div>

              <div class="detail-info-row">
                <span>Fecha límite</span>
                <strong>
                  ${formatDate(surprise.deadline)}
                </strong>
              </div>

              <div class="detail-info-row">
                <span>Precio acordado</span>
                <strong>
                  ${
                    surprise.final_price
                      ? `${Number(surprise.final_price).toFixed(2)} €`
                      : "Pendiente"
                  }
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-files-block">
  <div class="detail-files-heading">
    <h3>Archivos del proyecto</h3>

    <label
      for="genius_file_input"
      class="genius-file-upload-btn"
    >
      Añadir archivo

      <input
        id="genius_file_input"
        type="file"
        hidden
      >
    </label>
  </div>

  <div
    id="genius_files_grid"
    class="detail-files-grid genius-files-grid"
  >
    ${renderGeniusFiles(files, currentUserId)}
  </div>
</div>

        <div class="detail-actions">
          <button
            class="detail-secondary-btn"
            type="button"
            data-section="conversations"
          >
            Ir a conversación
          </button>

          <button
            class="detail-secondary-btn"
            type="button"
            data-section="genius"
          >
            Volver al panel
          </button>
        </div>

      </div>
    </article>
  `;

  bindGeniusFileUpload(surprise.id);
  bindGeniusFileDelete();
}
function renderGeniusFiles(files = [], currentUserId) {
  if (!files.length) {
    return `
      <p class="detail-empty-files">
        Todavía no hay archivos vinculados.
      </p>
    `;
  }

  return files
    .map((file) => {
      const path = file.file_url || file.path || "";
      const url = getFileUrl(path);
      const name = file.filename || "Archivo";
      const isImage = /\.(png|jpe?g|webp|gif)$/i.test(path);
      const canDelete = Number(file.uploader_id) === Number(currentUserId);

      return `
        <div class="genius-file-item">
          <a
            class="detail-file-thumb"
            href="${url}"
            target="_blank"
            rel="noopener"
          >
            ${
              isImage
                ? `<img src="${url}" alt="${escapeHtml(name)}">`
                : `<div class="file-generic-icon">Archivo</div>`
            }

            <span>${escapeHtml(name)}</span>
          </a>

          ${
            canDelete
              ? `
                <button
                  type="button"
                  class="owner-file-delete"
                  data-genius-file-id="${file.id}"
                >
                  ×
                </button>
              `
              : `
                <span class="file-readonly-label">
                  Del creador
                </span>
              `
          }
        </div>
      `;
    })
    .join("");
}
function bindGeniusFileUpload(surpriseId) {
  const input = document.getElementById("genius_file_input");

  if (!input) return;

  input.onchange = async () => {
    const file = input.files?.[0];

    if (!file) return;

    const token = localStorage.getItem("token");

    const response = await uploadSurpriseFile(surpriseId, file, token);

    if (!response.ok) {
      showNotificationToast({
        title: "Error",
        message: response.json?.error || "No se pudo subir el archivo.",
      });
      return;
    }

    showNotificationToast({
      title: "Archivo subido",
      message: "El archivo ya está disponible para el creador.",
    });

    await openGeniusReadonlyDetail(surpriseId);
  };
}
function bindGeniusFileDelete() {
  document.querySelectorAll("[data-genius-file-id]").forEach((button) => {
    button.onclick = async () => {
      const fileId = button.dataset.geniusFileId;
      const token = localStorage.getItem("token");

      const response = await deleteSurpriseFile(fileId, token);

      if (!response.ok) {
        showNotificationToast({
          title: "No permitido",
          message: response.json?.error || "No puedes eliminar este archivo.",
        });
        return;
      }

      button.closest(".genius-file-item")?.remove();

      showNotificationToast({
        title: "Archivo eliminado",
        message: "El archivo se ha eliminado correctamente.",
      });
    };
  });
}
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
