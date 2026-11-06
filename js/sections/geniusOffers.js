import { state } from "../state/appState.js";
import { getMyOffers, counterOffer } from "../services/offerService.js";

let currentOfferId = null;

window.loadGeniusOffersSection = loadGeniusOffersSection;
window.openGeniusOfferCounter = openGeniusOfferCounter;

export async function loadGeniusOffersSection() {
  const box = document.getElementById("genius_offers_page_list");

  if (!box) return;

  const token = state.token || localStorage.getItem("token");

  box.innerHTML = `
    <div class="genius-empty-state">
      Cargando ofertas...
    </div>
  `;

  const response = await getMyOffers(token);
  const offers = response?.json?.data || [];

  if (!response.ok) {
    box.innerHTML = `
    <div class="genius-empty-state">
      No se pudieron cargar tus ofertas.
    </div>
  `;

    return;
  }

  const sortedOffers = [...offers].sort((a, b) => {
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  if (!sortedOffers.length) {
    box.innerHTML = `
    <div class="genius-empty-state">
      Todavía no tienes ofertas.
    </div>
  `;

    return;
  }

  box.innerHTML = sortedOffers.map(renderGeniusOffer).join("");

  bindGeniusOfferEvents();
}

function renderGeniusOffer(offer) {
  const surprise = offer.surprise || {};
  const status = offer.status || "pending";
  const canNegotiate =
    ["pending", "negotiating"].includes(status) && surprise.status === "open";

  return `
  <article
  class="genius-offer-page-card offer-card-${status}"
  id="genius-offer-${offer.id}"
>
      <div class="genius-offer-page-head">
        <div>
          <span class="detail-kicker">
            ${escapeHtml(surprise.skill?.name || "Sorpresa")}
          </span>

          <h2>
            ${escapeHtml(surprise.title || "Sorpresa")}
          </h2>
        </div>

        <span class="offer-status ${status}">
          ${formatOfferStatus(status)}
        </span>
      </div>

      <div class="genius-offer-page-data">
        <div>
          <span>Tu precio actual</span>
          <strong>${offer.price || 0} €</strong>
        </div>

        <div>
          <span>Tiempo estimado</span>
          <strong>
            ${offer.eta_hours || "-"} horas
          </strong>
        </div>

        <div>
          <span>Estado sorpresa</span>
          <strong>
            ${formatOfferStatus(surprise.status)}
          </strong>
        </div>
      </div>

      ${
        offer.message
          ? `
            <p class="genius-offer-message">
              ${escapeHtml(offer.message)}
            </p>
          `
          : ""
      }

      ${
        offer.bids?.length
          ? `
            <div class="genius-offer-history">
              <h3>Historial de negociación</h3>

              ${offer.bids.map(renderBid).join("")}
            </div>
          `
          : ""
      }

      <div class="genius-offer-actions">
        ${
          canNegotiate
            ? `
              <button
                type="button"
                class="btn primary"
                data-genius-counter="${offer.id}"
                data-price="${offer.price || ""}"
                data-eta="${offer.eta_hours || ""}"
              >
                Regatear
              </button>
            `
            : ""
        }

      <button
  type="button"
  class="btn secondary"
  data-action="open-genius-surprise-detail"
  data-surprise-id="${surprise.id}"
>
  Ver sorpresa
</button>
      </div>
    </article>
  `;
}

function renderBid(bid) {
  return `
    <div class="genius-bid-row ${bid.role}">
      <div>
        <strong>
          ${bid.role === "genius" ? "Tú" : "Creador"}
        </strong>

        <span>
          ${escapeHtml(bid.message || "")}
        </span>
      </div>

      <strong>${bid.price} €</strong>
    </div>
  `;
}

function bindGeniusOfferEvents() {
  document.querySelectorAll("[data-genius-counter]").forEach((button) => {
    button.onclick = () => {
      openGeniusOfferCounter(
        button.dataset.geniusCounter,
        button.dataset.price,
        button.dataset.eta,
      );
    };
  });
}

export function openGeniusOfferCounter(offerId, price = "", eta = "") {
  currentOfferId = offerId;

  const modal = document.getElementById("genius-counter-modal");

  if (!modal) return;

  document.getElementById("genius-counter-price").value = price;

  document.getElementById("genius-counter-eta").value = eta;

  document.getElementById("genius-counter-message").value = "";

  modal.classList.remove("hidden");

  document.getElementById("genius-counter-cancel").onclick = () => {
    modal.classList.add("hidden");
  };

  document.getElementById("genius-counter-confirm").onclick =
    sendGeniusCounterOffer;
}

async function sendGeniusCounterOffer() {
  const token = state.token || localStorage.getItem("token");

  const price = Number(document.getElementById("genius-counter-price").value);

  const etaHours = Number(document.getElementById("genius-counter-eta").value);

  const message = document
    .getElementById("genius-counter-message")
    .value.trim();

  if (!price || price < 1) {
    alert("Introduce un precio válido.");
    return;
  }

  if (!etaHours || etaHours < 1) {
    alert("Introduce las horas estimadas.");
    return;
  }

  const response = await counterOffer(
    currentOfferId,
    {
      price,
      eta_hours: etaHours,
      message,
    },
    token,
  );

  if (!response.ok) {
    alert(
      response.json?.error ||
        response.json?.message ||
        "No se pudo enviar la contraoferta.",
    );
    return;
  }

  document.getElementById("genius-counter-modal").classList.add("hidden");

  await loadGeniusOffersSection();
}

function formatOfferStatus(status) {
  const labels = {
    pending: "Pendiente",
    negotiating: "En negociación",
    accepted: "Aceptada",
    rejected: "Rechazada",
    open: "Abierta",
    in_progress: "En progreso",
    delivered: "Entregada",
  };

  return labels[status] || status || "Sin estado";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
