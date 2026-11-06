import { state } from "../state/appState.js";
import { getGeniusHistory } from "../services/geniusService.js";

window.loadGeniusHistorySection = loadGeniusHistorySection;

export async function loadGeniusHistorySection() {
  const body = document.getElementById("genius_history_table_body");
  const total = document.getElementById("genius_history_total");

  if (!body) return;

  const token = state.token || localStorage.getItem("token");

  body.innerHTML = `
    <tr>
      <td colspan="7">Cargando historial...</td>
    </tr>
  `;

  try {
    const response = await getGeniusHistory(token);

    if (!response.ok) {
      throw new Error(
        response.json?.error ||
          response.json?.message ||
          "No se pudo cargar el historial.",
      );
    }

    const surprises = response.json?.data || [];

    if (total) {
      total.textContent = `${surprises.length} ${
        surprises.length === 1 ? "sorpresa" : "sorpresas"
      }`;
    }

    if (!surprises.length) {
      body.innerHTML = `
        <tr>
          <td colspan="7">
            Todavía no tienes sorpresas en tu historial.
          </td>
        </tr>
      `;
      return;
    }

    body.innerHTML = surprises
      .map((surprise, index) => {
        const status = String(surprise.status || "").toLowerCase();

        const location =
          [surprise.target_city, surprise.target_province]
            .filter(Boolean)
            .join(", ") || "Sin ubicación";

        const date = formatDate(
          surprise.completed_at || surprise.updated_at || surprise.created_at,
        );

        const price = surprise.final_price
          ? `${Number(surprise.final_price).toFixed(2)} €`
          : "Sin precio";

        return `
          <tr
            class="genius-history-row status-${status}"
            data-action="genius-history-detail"
            data-surprise-id="${surprise.id}"
            tabindex="0"
          >
            <td>${index + 1}</td>

            <td>
              <strong>${escapeHtml(surprise.title || "Sin título")}</strong>
            </td>

            <td>
              ${escapeHtml(surprise.skill?.name || "Sin categoría")}
            </td>

            <td>${escapeHtml(location)}</td>

            <td>${date}</td>

            <td>${price}</td>

            <td>
              <span class="genius-history-status status-${status}">
                ${formatStatus(status)}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error cargando historial:", error);

    body.innerHTML = `
      <tr>
        <td colspan="7">
          No se pudo cargar el historial.
        </td>
      </tr>
    `;
  }
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status) {
  const labels = {
    completed: "Completada",
    cancelled: "Cancelada",
    canceled: "Cancelada",
  };

  return labels[status] || status;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
