import { state } from "../state/appState.js";

/* =====================================================
   RESTART COUNTDOWN (IMPORTANTE: SOLO UNA)
===================================================== */
console.log(state);

export function restartCountdowns() {
  updateSurpriseCountdowns();

  if (state.ui.countdownInterval) {
    clearInterval(state.ui.countdownInterval);
  }

  state.ui.countdownInterval = setInterval(() => {
    updateSurpriseCountdowns();
  }, 1000);
}

/* =====================================================
   HOME - RENDER LISTA PRINCIPAL
===================================================== */

export function renderSurprisesHome(surprises = []) {
  const container = document.getElementById("all_surprises_list");

  if (!container) return;

  // solo sorpresas OPEN
  const openSurprises = surprises.filter(
    (surprise) => surprise.status === "open",
  );

  if (openSurprises.length === 0) {
    container.innerHTML = `
            <p>No hay sorpresas abiertas disponibles</p>
        `;
    return;
  }

  container.innerHTML = openSurprises.map(renderSimpleSurprise).join("");

  restartCountdowns();
}

/* =====================================================
   CARD SIMPLE (nivel básico)
===================================================== */
const API_URL = "https://api.surpriser.app";

export function getImageUrl(path) {
  if (!path) return "img/default-avatar.png";

  // ya es absoluta
  if (path.startsWith("http")) return path;

  // evita duplicar /storage si ya viene incluido
  const cleanPath = path.startsWith("/storage/")
    ? path.replace("/storage/", "")
    : path;

  return `${API_URL}/storage/${cleanPath}`;
}
export function renderSimpleSurprise(surprise) {
  const title = surprise.title || "Sin título";
  const status = surprise.status || "open";

  const category = surprise.skill?.name || "Sin categoría";
  const size = surprise.size || "STANDARD";

  const isFeatured =
    Number(surprise.ads_count) > 0 ||
    surprise.ads_exists === true ||
    surprise.ads_exists === 1;

  const isUrgent = Number(surprise.is_urgent) === 1;

  // -----------------------------
  // AVATAR
  // -----------------------------
  const avatar = getImageUrl(surprise.creator?.avatar);

  // -----------------------------
  // UBICACIÓN (API REAL)
  // -----------------------------
  const city = surprise.target_city || "Sin ciudad";
  const province = surprise.target_province || "";
  const country = surprise.target_country || "";

  // -----------------------------
  // DEADLINE
  // -----------------------------
  const deadlineBlock = surprise.deadline
    ? `
      <span class="surprise-countdown-v2" data-deadline="${surprise.deadline}">
        Calculando...
      </span>
    `
    : `<span class="surprise-countdown-v2">Sin fecha</span>`;

  return `
    <div class="surprise-card-v2 ${
      isFeatured ? "surprise-card-v2-featured" : ""
    }">

      <!-- TOP -->
      <div class="surprise-card-v2-top">

        <span class="surprise-status-v2 surprise-status-${status}">
          ${status}
        </span>

        <!-- AVATAR -->
        <div class="surprise-creator-img">
          <img src="${avatar}" alt="Avatar creador" />
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
            />
            <img
              class="surprise-featured-v2 surprise-featured-main"
              src="img/creacionestrella.png"
              alt="Creación estrella"
            />
          </div>
        `
            : ""
        }

      </div>

      <!-- BODY -->
      <div class="surprise-card-v2-body">

        <!-- CITY -->
        <div class="surprise-card-v2-city">
          ${city}
        </div>

        ${province ? `<div class="comunidad">${province}</div>` : ""}
 <h4>${title}</h4>
        <div class="surprise-card-v2-meta">

          ${
            isUrgent
              ? `<img src="img/destello.png" class="urgent-icon-v2" alt="Urgente" />`
              : `<span class="urgent-icon-placeholder"></span>`
          }

          <div>
            <p>${category}</p>
            <strong>${size}</strong>
          </div>

          ${deadlineBlock}

        </div>

       

        <div class="surprise-card-v2-actions">

          <a
            class="surprise-card-v2-actions-offer"
            href="#"
            data-action="open-offer-modal"
            data-surprise-id="${surprise.id}"
          >
            HACER OFERTA
          </a>

          <a
            class="action-more"
            href="#"
            data-action="surprise-detail"
            data-surprise-id="${surprise.id}"
          >
            MÁS INFO
          </a>

        </div>

      </div>
    </div>
  `;
}

/* =====================================================
   COUNTDOWN SIMPLE
===================================================== */

export function updateSurpriseCountdowns() {
  const elements = document.querySelectorAll(
    ".surprise-countdown-v2[data-deadline]",
  );

  elements.forEach((el) => {
    const deadline = el.dataset.deadline;
    el.textContent = getTimeLeft(deadline);
  });
}

/* =====================================================
   TIEMPO RESTANTE
===================================================== */

export function getTimeLeft(deadline) {
  if (!deadline) return "Sin fecha";

  const end = new Date(String(deadline).replace(" ", "T"));
  const now = new Date();

  if (isNaN(end.getTime())) {
    return "Fecha inválida";
  }

  const diff = end - now;

  if (diff <= 0) {
    return "Expirada";
  }

  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Si queda al menos 1 día
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  // Últimas 24 horas
  return `${hours}h ${minutes}m ${seconds}s`;
}
/* =====================================================
   FILTROS
===================================================== */

let filters = {
  skill_id: "",
  size: "",
  order_deadline: "",
  featured: "",
  is_urgent: "",
  province: "",
};

export function initHomeFilters() {
  initFilterDropdowns();
  initStaticFilterOptions();
  initToggleFilters();
  initResetFilters();
  initProvinceFilter();

  loadSkillMenu();
}

function initFilterDropdowns() {
  document.querySelectorAll(".filter-item.dropdown").forEach((item) => {
    const btn = item.querySelector(".filter-btn");
    const menu = item.querySelector(".dropdown-menu");

    if (!btn || !menu) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      document.querySelectorAll(".dropdown-menu").forEach((other) => {
        if (other !== menu) other.classList.remove("is-open");
      });

      menu.classList.toggle("is-open");
    });

    menu.addEventListener("click", (e) => e.stopPropagation());
  });

  document.addEventListener("click", closeAllFilterMenus);
}

function closeAllFilterMenus() {
  document.querySelectorAll(".dropdown-menu").forEach((menu) => {
    menu.classList.remove("is-open");
  });
}

function initStaticFilterOptions() {
  document.querySelectorAll("[data-size]").forEach((el) => {
    el.addEventListener("click", () => {
      filters.size = el.dataset.size || "";
      updateFilterButtonText(el, "Tamaño");
      closeAllFilterMenus();
      fetchSurprises();
    });
  });

  document.querySelectorAll("[data-order-deadline]").forEach((el) => {
    el.addEventListener("click", () => {
      filters.order_deadline = el.dataset.orderDeadline || "";
      updateFilterButtonText(el, "Tiempo");
      closeAllFilterMenus();
      fetchSurprises();
    });
  });
}

function initToggleFilters() {
  const urgent = document.getElementById("filter_urgent");
  const featured = document.getElementById("filter_featured");

  if (urgent) {
    urgent.addEventListener("change", (e) => {
      filters.is_urgent = e.target.checked ? "1" : "";
      fetchSurprises();
    });
  }

  if (featured) {
    featured.addEventListener("change", (e) => {
      filters.featured = e.target.checked ? "1" : "";
      fetchSurprises();
    });
  }
}

function initResetFilters() {
  const resetBtn = document.getElementById("reset_filters");
  if (!resetBtn) return;
  const provinceInput = document.getElementById("filter_province");
  if (provinceInput) provinceInput.value = "";
  resetBtn.addEventListener("click", () => {
    filters = {
      skill_id: "",
      size: "",
      order_deadline: "",
      featured: "",
      is_urgent: "",
      province: "",
    };

    document
      .querySelectorAll(".surpriser-filter-nav input")
      .forEach((input) => {
        input.checked = false;
      });

    resetFilterButtonTexts();
    closeAllFilterMenus();
    fetchSurprises();
  });
}

function loadSkillMenu() {
  const menu = document.getElementById("skill_menu");
  if (!menu) return;

  fetch("https://api.surpriser.app/api/skills", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then((res) => res.json())
    .then((response) => {
      const skills = response.data || [];

      menu.innerHTML = `
        <div class="option" data-skill="">Todas</div>
        ${skills
          .map(
            (skill) => `
          <div class="option" data-skill="${skill.id}">
            ${skill.name}
          </div>
        `,
          )
          .join("")}
      `;

      bindSkillOptions();
    });
}

function bindSkillOptions() {
  document.querySelectorAll("[data-skill]").forEach((el) => {
    el.addEventListener("click", () => {
      filters.skill_id = el.dataset.skill || "";
      updateFilterButtonText(el, "Categoría");
      closeAllFilterMenus();
      fetchSurprises();
    });
  });
}

function fetchSurprises() {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.append(key, value);
    }
  });

  const url = `https://api.surpriser.app/api/surprises/feed?${params.toString()}`;

  fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then(async (res) => {
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error cargando sorpresas");
      }

      renderSurprisesHome(data.data || []);
    })
    .catch((error) => {
      console.error("Error cargando sorpresas:", error);
    });
}

function updateFilterButtonText(option, fallback) {
  const dropdown = option.closest(".dropdown");
  const btn = dropdown?.querySelector(".filter-btn");

  if (!btn) return;

  const text = option.textContent.trim();

  btn.textContent =
    text && text !== "Todas" && text !== "Todos"
      ? `${fallback}: ${text} ▾`
      : `${fallback} ▾`;
}

function resetFilterButtonTexts() {
  const skillBtn = document.querySelector('[data-toggle="skill"]');
  const sizeBtn = document.querySelector('[data-toggle="size"]');
  const deadlineBtn = document.querySelector('[data-toggle="deadline"]');

  if (skillBtn) skillBtn.textContent = "Categoría ▾";
  if (sizeBtn) sizeBtn.textContent = "Tamaño ▾";
  if (deadlineBtn) deadlineBtn.textContent = "Tiempo ▾";
}
function initProvinceFilter() {
  const input = document.getElementById("filter_province");
  if (!input) return;

  let timeout;

  input.addEventListener("input", (e) => {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      filters.province = e.target.value.trim();
      fetchSurprises();
    }, 400); // debounce para no spamear API
  });
}
