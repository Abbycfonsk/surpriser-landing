import {
  getNotifications,
  getUnreadNotificationsCount,
  markAsRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../services/notificationService.js";

let currentNotifications = [];
let currentPage = 1;
const perPage = 10;

export async function loadNotificationsView(user, token) {
  if (!user?.id || !token) return;

  const response = await getNotifications(user.id, token);

  currentNotifications = Array.isArray(response)
    ? response
    : Array.isArray(response?.json?.data)
      ? response.json.data
      : Array.isArray(response?.data)
        ? response.data
        : [];

  currentPage = 1;

  renderNotificationsPage(user, token);
  bindMarkAllNotificationsRead(user, token);
  bindDeleteAllNotifications(user, token);

  await refreshNotificationsCount(user, token);
}

function renderNotificationsPage(user, token) {
  const box = document.getElementById("notifications_list");
  if (!box) return;

  const totalPages = Math.ceil(currentNotifications.length / perPage);
  const start = (currentPage - 1) * perPage;
  const pageItems = currentNotifications.slice(start, start + perPage);

  box.innerHTML = pageItems.length
    ? pageItems.map((n) => renderNotificationItem(n)).join("")
    : `<div class="empty-state">No notifications</div>`;

  renderNotificationsPagination(totalPages);
  bindNotificationEvents(user, token);
}
export function renderNotifications(notifications = []) {
  currentNotifications = Array.isArray(notifications) ? notifications : [];
  currentPage = 1;

  renderNotificationsPage(window.currentUser, window.currentToken);
}
function renderNotificationItem(n) {
  const link = n.url ?? n.link ?? n.action_url ?? n.data?.url ?? "#";

  return `
    <article 
      class="notification-bubble ${n.read_at ? "is-read" : "is-unread"}"
      data-notification-id="${n.id}"
    >
      <div class="notification-bubble-top">
        ${
          n.read_at
            ? `<span class="notification-read-label">Leída</span>`
            : `<button
         type="button"
         class="notification-read-btn"
         data-mark-notification-read="${n.id}"
         title="Marcar como leída"
         aria-label="Marcar notificación como leída"
       >
         Marcar leída
       </button>`
        }

      <button 
  type="button" 
  class="notification-delete-btn"
  data-delete-notification="${n.id}"
  aria-label="Eliminar notificación"
>
  &times;
</button>
      </div>

      <div class="notification-bubble-body">
        <strong>${n.title ?? "Notificación"}</strong>
        <p>${n.message ?? ""}</p>
      </div>

      <div class="notification-bubble-footer">
        ${
          link !== "#"
            ? `<a href="${link}" class="notification-open-link" data-notification-link="${n.id}">
                 Ver
               </a>`
            : `<span></span>`
        }

        ${n.read_at ? `<small>Leída</small>` : `<small>Nueva</small>`}
      </div>
    </article>
  `;
}

function renderNotificationsPagination(totalPages) {
  const pagination = document.getElementById("notifications_pagination");
  if (!pagination) return;

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  pagination.innerHTML = `
    <button type="button" id="notifications_prev" ${currentPage === 1 ? "disabled" : ""}>
      Anterior
    </button>

    <span>Página ${currentPage} de ${totalPages}</span>

    <button type="button" id="notifications_next" ${currentPage === totalPages ? "disabled" : ""}>
      Siguiente
    </button>
  `;

  document
    .getElementById("notifications_prev")
    ?.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderNotificationsPage(window.currentUser, window.currentToken);
      }
    });

  document
    .getElementById("notifications_next")
    ?.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderNotificationsPage(window.currentUser, window.currentToken);
      }
    });
}

function bindNotificationEvents(user, token) {
  window.currentUser = user;
  window.currentToken = token;

  document
    .querySelectorAll("[data-mark-notification-read]")
    .forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const id = button.dataset.markNotificationRead;
        await markNotificationReadLocally(id, user, token);
      });
    });

  document.querySelectorAll("[data-notification-link]").forEach((link) => {
    link.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.notificationLink;
      await markNotificationReadLocally(id, user, token);
    });
  });

  document.querySelectorAll("[data-delete-notification]").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const id = Number(button.dataset.deleteNotification);
      if (!id) return;

      await deleteNotification(id, token);

      currentNotifications = currentNotifications.filter((n) => n.id !== id);

      const totalPages = Math.max(
        1,
        Math.ceil(currentNotifications.length / perPage),
      );

      if (currentPage > totalPages) currentPage = totalPages;

      renderNotificationsPage(user, token);
      await refreshNotificationsCount(user, token);
    });
  });

  document.querySelectorAll("[data-notification-id]").forEach((item) => {
    item.addEventListener("click", async () => {
      const id = item.dataset.notificationId;
      await markNotificationReadLocally(id, user, token);
    });
  });
}

async function markNotificationReadLocally(id, user, token) {
  const notification = currentNotifications.find(
    (n) => String(n.id) === String(id),
  );
  if (!notification || notification.read_at) return;

  await markAsRead(id, token);

  notification.read_at = new Date().toISOString();

  renderNotificationsPage(user, token);
  await refreshNotificationsCount(user, token);
}

export function bindMarkAllNotificationsRead(user, token) {
  const button = document.getElementById("mark_all_notifications_read");
  if (!button) return;

  button.onclick = async () => {
    button.disabled = true;

    try {
      await markAllNotificationsRead(user.id, token);

      currentNotifications = currentNotifications.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      }));

      renderNotificationsPage(user, token);
      await refreshNotificationsCount(user, token);
    } finally {
      button.disabled = false;
    }
  };
}

export function bindDeleteAllNotifications(user, token) {
  const button = document.getElementById("delete_all_notifications");
  if (!button) return;

  button.onclick = async () => {
    const confirmed = confirm("¿Eliminar todas las notificaciones?");
    if (!confirmed) return;

    button.disabled = true;

    try {
      await deleteAllNotifications(user.id, token);

      currentNotifications = [];
      currentPage = 1;

      renderNotificationsPage(user, token);
      await refreshNotificationsCount(user, token);
    } finally {
      button.disabled = false;
    }
  };
}

export async function refreshNotificationsCount(user, token) {
  const badge = document.getElementById("notif_count");
  if (!badge || !user?.id || !token) return;

  const response = await getUnreadNotificationsCount(user.id, token);

  const count =
    typeof response === "number"
      ? response
      : (response?.json?.count ??
        response?.json?.unread_count ??
        response?.count ??
        response?.unread_count ??
        0);

  badge.textContent = count > 0 ? count : "";
  badge.style.display = count > 0 ? "inline-flex" : "none";
}
