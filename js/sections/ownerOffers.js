import { state } from "../state/appState.js";
import {
  getOffers,
  counterOffer,
  acceptOffer,
} from "../services/offerService.js";

let currentSurpriseId = null;

export async function openOwnerOffers(surpriseId) {
  currentSurpriseId = surpriseId;

  await window.showSection?.("ownerOffers");

  await waitForElement("owner-offers-list");

  await loadOffers();
}
async function waitForElement(id, timeout = 2000) {
  return new Promise((resolve) => {
    const start = Date.now();

    const interval = setInterval(() => {
      const el = document.getElementById(id);

      if (el) {
        clearInterval(interval);
        resolve(el);
      }

      if (Date.now() - start > timeout) {
        clearInterval(interval);
        resolve(null);
      }
    }, 20);
  });
}
async function loadOffers() {
  const container = document.getElementById("owner-offers-list");

  if (!container) return;

  container.innerHTML = "<p>Cargando ofertas...</p>";

  const result = await getOffers(currentSurpriseId, state.token);

  const offers = result.json?.data || [];

  const surprise = state.surprises.find((s) => s.id == currentSurpriseId);

  const title = document.getElementById("offers-surprise-title");

  if (title) {
    title.textContent = surprise?.title || "";
  }

  if (!offers.length) {
    container.innerHTML = `
   <div class="offers-empty">
  <div class="offers-empty-image">
    <img src="/img/no-offers-genie.png" alt="Sin ofertas">
  </div>

  <div class="offers-empty-content">
    <span class="offers-empty-badge">OFERTAS</span>

    <h2>Aún no hay ofertas</h2>

    <p>
      Cuando los genios crean en tu sorpresa, sus ofertas aparecerán aquí.
    </p>
<div class="divider">
  <span class="diamond"></span>
</div>
    <div class="offers-empty-tip">
      <span class="offers-empty-tip-icon"></span>
      <span>
        <strong>Consejo:</strong>
        Cuantos más detalles creativos des, más probabilidades tendrás de recibir ofertas increíbles.
      </span>
    </div>
  </div>
</div>
  `;
    return;
  }

  container.innerHTML = offers.map(renderOffer).join("");
}

function renderOffer(offer) {
  return `
  <article class="offer-card">

    <div class="offer-header">

 <img
  class="offer-avatar"
  src="${offer.genius?.avatar_url || "/assets/avatar-placeholder.jpg"}"
  alt="${offer.genius?.name || "Genius"}"
  onerror="this.src='/assets/avatar-placeholder.jpg'"
>

  <div class="offer-genius">

  <div class="offer-name">
    ${offer.genius?.name || "Genius"}
  </div>

  <div class="offer-level">
    ${offer.genius?.genius_badge || offer.genius?.genius_level || ""}
  </div>

</div>

      <div class="offer-price">
        ${offer.price}€
      </div>

    </div>

    <div class="offer-meta">

      <span class="offer-status">
        ${offer.status}
      </span>

      <span>
        ⏱ ${offer.eta_hours || "-"}h
      </span>

    </div>

    ${
      offer.message
        ? `
      <div class="offer-message">
        ${offer.message}
      </div>
    `
        : ""
    }

    <div class="offer-actions">

      ${
        offer.status !== "accepted"
          ? `
        <button
          class="btn-small"
          data-offer-accept="${offer.id}"
        >
          Aceptar
        </button>
      `
          : ""
      }

      ${
        offer.status !== "accepted"
          ? `
        <button
          class="btn-small secondary"
          data-offer-counter="${offer.id}"
        >
          Regatear
        </button>
      `
          : ""
      }

    </div>

    ${
      offer.bids?.length
        ? `
      <div class="offer-history">

        <div class="offer-history-title">
          Historial de negociación
        </div>

        ${offer.bids.map(renderBid).join("")}

      </div>
    `
        : ""
    }

  </article>
  `;
}

function renderBid(bid) {
  return `
    <div
      class="offer-bid ${bid.role}"
    >

      <strong>
        ${bid.role.toUpperCase()}
      </strong>

      <div>
        ${bid.price}€
      </div>

      <div>
        ${bid.eta_hours || "-"} horas
      </div>

      <p>
        ${bid.message || ""}
      </p>

    </div>
  `;
}

document.addEventListener("click", async (e) => {
  const acceptBtn = e.target.closest("[data-offer-accept]");

  if (acceptBtn) {
    const offerId = acceptBtn.dataset.offerAccept;

    const ok = confirm("¿Aceptar oferta?");

    if (!ok) return;

    await acceptOffer(offerId, state.token);

    loadOffers();

    return;
  }

  const counterBtn = e.target.closest("[data-offer-counter]");

  if (!counterBtn) return;

  const offerId = counterBtn.dataset.offerCounter;

  openCounterModal(offerId);
});
export function initOwnerOffers() {
  console.log("Init owner offers");
}
function openCounterModal(offerId) {
  const modal = document.getElementById("counter-modal");

  modal.classList.remove("hidden");

  const price = document.getElementById("counter-price");
  const eta = document.getElementById("counter-eta");
  const message = document.getElementById("counter-message");

  document.getElementById("counter-confirm").onclick = async () => {
    await counterOffer(
      offerId,
      {
        price: price.value,
        eta_hours: eta.value,
        message: message.value,
      },
      state.token,
    );

    modal.classList.add("hidden");
    loadOffers();
  };

  document.getElementById("counter-cancel").onclick = () => {
    modal.classList.add("hidden");
  };
}
