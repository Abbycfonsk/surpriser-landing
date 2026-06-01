import { showAppSection } from "../router.js";
import { getSurprise } from "../services/surpriseService.js";
import { createOffer } from "../services/offerService.js";
import { getTimeLeft } from "./home.js";

const API = "https://api.surpriser.app";

let notificationToastTimer = null;

export function initSurpriseDetail() {
    window.openSurpriseDetail = openSurpriseDetail;
    window.openOfferModal = openOfferModal;
    window.closeOfferModal = closeOfferModal;
    window.offerFromDetail = openOfferModal;
    window.openCreatorDetail = openCreatorDetail;
    window.showNotificationToast = showNotificationToast;

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

    container.innerHTML = `
        <article class="surprise-detail-compact">

            <div class="detail-main-card">

                <div class="detail-header-row">
                    <div>
                        <span class="detail-kicker">${skill.name || "Sin categoría"}</span>
                        <h1>${surprise.title || "Sin título"}</h1>
                    </div>

                    <span class="surprise-status-v2 surprise-status-${status}">
                        ${status}
                    </span>
                </div>

                <div class="detail-content-grid">

                    <div class="detail-image-compact">
                        <img src="${imageUrl}" alt="${surprise.title || "Sorpresa"}">
                    </div>

                    <div class="detail-summary">
                        <p>${surprise.description || "Sin descripción."}</p>

                        <div class="detail-info-grid compact">
                            <div>
                                <span>Urgente</span>
                                <strong>${isTruthy(surprise.is_urgent) ? "Sí" : "No"}</strong>
                            </div>

                            <div>
                                <span>Estado</span>
                                <strong>${status}</strong>
                            </div>

                            <div>
                                <span>Deadline</span>
                                <strong>${formatDate(surprise.deadline)}</strong>
                            </div>

                            <div>
                                <span>Queda</span>
                                <strong>${timeLeft}</strong>
                            </div>

                            <div>
                                <span>Ciudad</span>
                                <strong>${surprise.target_city || "No indicada"}</strong>
                            </div>

                            <div>
                                <span>País</span>
                                <strong>${surprise.target_country || "No indicado"}</strong>
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

                    <button class="detail-secondary-btn" data-section="home">
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
                    ${creator.username ? "@" + creator.username : creator.name || "Creador"}
                </button>

                <div class="creator-role-list">
                    ${isTruthy(creator.is_creator) ? `<span>Creador</span>` : ""}
                    ${isTruthy(creator.is_genius) ? `<span>Genio</span>` : ""}
                </div>

                <div class="creator-mini-info">
                    <div>
                        <span>Ciudad</span>
                        <strong>${creator.location_city || "No indicada"}</strong>
                    </div>

                    <div>
                        <span>País</span>
                        <strong>${creator.location_country || "No indicado"}</strong>
                    </div>

                    <div>
                        <span>Nivel genius</span>
                        <strong>${creator.genius_level || "Sin nivel"}</strong>
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

    return files.map(file => {
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
    }).join("");
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
        const surpriseId = document.getElementById("offer_surprise_id").value;

        const price = document.getElementById("offer_price").value.trim();
        const message = document.getElementById("offer_message").value.trim();
        const eta = document.getElementById("offer_eta").value.trim();

        if (!price || !eta) {
            showNotificationToast({
                title: "Faltan datos",
                message: "Indica precio y horas estimadas."
            });
            return;
        }

        const res = await createOffer(surpriseId, {
            price,
            message,
            eta_hours: eta
        }, token);

        closeOfferModal();

        showNotificationToast({
            title: "Oferta enviada",
            message: res.json?.message || "Tu propuesta se ha enviado correctamente."
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
        message: `Abrir perfil público del creador ${creatorId}.`
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
        year: "numeric"
    });
}