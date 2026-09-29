import { state } from "../state/appState.js";
import { showAppSection } from "../router.js";

const API = "https://api.surpriser.app";
let currentConversationId = null;
let currentConversations = [];

export async function loadConversations() {
  resetChatPanel();
  const token = localStorage.getItem("token");

  window.loadConversations = loadConversations;
  window.openConversationForSurprise = openConversationForSurprise;

  const res = await fetch(`${API}/api/conversations`, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    },
  });

  const json = await res.json();
  currentConversations = json.data || json || [];
  renderConversationList(currentConversations);
  initChatForm();
}

function renderConversationList(conversations) {
  const box = document.getElementById("conversation_list");
  if (!box) return;

  if (!conversations.length) {
    box.innerHTML = `<div class="mini-item">No tienes conversaciones abiertas.</div>`;
    return;
  }

  box.innerHTML = conversations
    .map((conversation) => {
      const surprise = conversation.surprise || {};
      const other = getOtherUser(conversation);

      return `
            <button
                class="conversation-item"
                data-action="open-conversation"
                data-conversation-id="${conversation.id}"
            >
                <span class="conversation-title">${surprise.title || "Sorpresa"}</span>

                <div class="conversation-users">
                    <img src="${getAvatarUrl(other.avatar)}" alt="${other.username || other.name || "Usuario"}">
                    <span>${other.username ? "@" + other.username : other.name || "Usuario"}</span>
                </div>
            </button>
        `;
    })
    .join("");
}

export async function openConversation(conversationId) {
  const token = localStorage.getItem("token");
  currentConversationId = conversationId;
  const conversation = currentConversations.find(
    (item) => Number(item.id) === Number(conversationId),
  );

  if (conversation) {
    const surprise = conversation.surprise || {};
    const other = getOtherUser(conversation);

    document.getElementById("chat_surprise_title").textContent =
      surprise.title || "Sorpresa";

    document.getElementById("chat_interlocutor_name").textContent =
      other.username ? "@" + other.username : other.name || "Conversación";

    updateChatStatus(conversation);
  }

  document.getElementById("chat_empty").style.display = "none";
  document.getElementById("chat_view").style.display = "flex";

  document.querySelectorAll(".conversation-item").forEach((btn) => {
    btn.classList.toggle(
      "is-active",
      btn.dataset.conversationId === String(conversationId),
    );
  });

  const res = await fetch(
    `${API}/api/conversations/${conversationId}/messages`,
    {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
      },
    },
  );

  const json = await res.json();
  const messages = json.data || json || [];

  renderMessages(messages.slice(-10), messages);
}

function renderMessage(message) {
  const mine = Number(message.sender_id) === Number(state.user?.id);

  const text =
    message.content ?? message.body ?? message.message ?? message.text ?? "";

  return `
    <div class="message-row ${mine ? "mine" : ""}">
      <div class="message-bubble">
        <p>${text}</p>
        <time>${formatTime(message.created_at)}</time>
      </div>
    </div>
  `;
}
function renderMessages(lastMessages, allMessages) {
  const box = document.getElementById("chat_messages");
  if (!box) return;

  box.dataset.allMessages = JSON.stringify(allMessages);
  box.dataset.visibleCount = "10";

  box.innerHTML = lastMessages.map(renderMessage).join("");
  box.scrollTop = box.scrollHeight;

  box.onscroll = () => {
    if (box.scrollTop <= 8) {
      prependOlderMessages();
    }
  };
}

function prependOlderMessages() {
  const box = document.getElementById("chat_messages");
  const all = JSON.parse(box.dataset.allMessages || "[]");
  const visible = Number(box.dataset.visibleCount || 10);
  const nextVisible = Math.min(visible + 10, all.length);

  if (nextVisible === visible) return;

  const previousHeight = box.scrollHeight;
  const messages = all.slice(-nextVisible);

  box.dataset.visibleCount = String(nextVisible);
  box.innerHTML = messages.map(renderMessage).join("");

  box.scrollTop = box.scrollHeight - previousHeight;
}

export function initChatForm() {
  const form = document.getElementById("chat_form");
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();

    const input = document.getElementById("chat_message_input");
    const body = input.value.trim();

    if (!body || !currentConversationId) return;

    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/api/messages`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        conversation_id: currentConversationId,
        content: body,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error enviando mensaje", errorText);

      let message = "No se pudo enviar el mensaje.";

      try {
        const errorJson = JSON.parse(errorText);
        if (
          errorJson.error === "Messages are not allowed in this surprise status"
        ) {
          message =
            "No se pueden enviar mensajes en el estado actual de esta sorpresa.";
        } else {
          message = errorJson.error || errorJson.message || message;
        }
      } catch {}

      window.showNotificationToast?.({
        title: "Mensaje no enviado",
        message,
      });

      return;
    }

    input.value = "";
    await openConversation(currentConversationId);
  };
}

export async function deleteCurrentConversation() {
  if (!currentConversationId) return;
  if (!confirm("¿Eliminar esta conversación?")) return;

  const token = localStorage.getItem("token");

  await fetch(`${API}/api/conversations/${currentConversationId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    },
  });

  currentConversationId = null;
  document.getElementById("chat_view").style.display = "none";
  document.getElementById("chat_empty").style.display = "block";

  await loadConversations();
}

function getOtherUser(conversation) {
  const users = [
    conversation.creator,
    conversation.genius,
    conversation.user,
  ].filter(Boolean);
  return (
    users.find((user) => Number(user.id) !== Number(state.user?.id)) ||
    users[0] ||
    {}
  );
}

function getAvatarUrl(path) {
  if (!path) return `${API}/storage/defaults/avatar.png`;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/storage/")) return API + path;
  return `${API}/storage/${path}`;
}

function formatTime(date) {
  if (!date) return "";
  return new Date(String(date).replace(" ", "T")).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
const MESSAGE_ALLOWED_STATUSES = ["open", "in_progress", "delivered"];

function updateChatStatus(conversation) {
  const statusEl = document.getElementById("chat_surprise_status");
  const hintEl = document.getElementById("chat_status_hint");
  const form = document.getElementById("chat_form");
  const input = document.getElementById("chat_message_input");
  const submit = form?.querySelector('button[type="submit"]');

  const status = conversation?.surprise?.status || "unknown";
  const canSend = MESSAGE_ALLOWED_STATUSES.includes(status);

  if (statusEl) {
    statusEl.textContent = formatSurpriseStatus(status);
    statusEl.className = `chat-status-badge status-${status}`;
  }

  if (hintEl) {
    hintEl.textContent = canSend
      ? "Puedes enviar mensajes en esta conversación."
      : "No se pueden enviar mensajes en el estado actual.";
  }

  if (input) {
    input.disabled = !canSend;
    input.placeholder = canSend
      ? "Escribe un mensaje..."
      : "Mensajes bloqueados por el estado de la sorpresa";
  }

  if (submit) {
    submit.disabled = !canSend;
  }

  if (form) {
    form.classList.toggle("is-disabled", !canSend);
  }
}

function formatSurpriseStatus(status) {
  const labels = {
    open: "Abierta",
    in_progress: "En progreso",
    delivered: "Entregada",
    completed: "Completada",
    cancelled: "Cancelada",
    unknown: "Sin estado",
  };

  return labels[status] || status;
}
export async function openConversationForSurprise(surpriseId) {
  const token = localStorage.getItem("token");

  if (!surpriseId || !token) return;

  try {
    const res = await fetch(`${API}/api/conversations`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        surprise_id: surpriseId,
      }),
    });

    const text = await res.text();

    let json = null;

    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }

    if (!res.ok) {
      throw new Error(
        json?.error || json?.message || "No se pudo abrir la conversación.",
      );
    }

    // El endpoint puede devolver directamente la conversación
    // o dentro de data.
    const conversation = json?.data || json;

    await showAppSection("conversations");
    await loadConversations();

    if (conversation?.id) {
      await openConversation(conversation.id);
    }
  } catch (error) {
    console.error("Error creando conversación:", error);

    window.showNotificationToast?.({
      title: "No se pudo abrir el chat",
      message: error.message,
    });
  }
}
/*-------------------------------------------------------------------------------------*/
/* para limpiar el panel del chat cada vez que se entra a la seccion de conversaciones*/
/*-------------------------------------------------------------------------------------*/
function resetChatPanel() {
  currentConversationId = null;

  const empty = document.getElementById("chat_empty");
  const view = document.getElementById("chat_view");
  const messages = document.getElementById("chat_messages");
  const input = document.getElementById("chat_message_input");
  const form = document.getElementById("chat_form");

  if (empty) {
    empty.style.display = "block";
    empty.textContent = "Selecciona una conversación para ver los mensajes.";
  }

  if (view) {
    view.style.display = "none";
  }

  if (messages) {
    messages.innerHTML = "";
    messages.dataset.allMessages = "[]";
    messages.dataset.visibleCount = "0";
  }

  if (input) {
    input.value = "";
    input.disabled = false;
    input.placeholder = "Escribe un mensaje...";
  }

  if (form) {
    form.classList.remove("is-disabled");
  }

  document.querySelectorAll(".conversation-item").forEach((item) => {
    item.classList.remove("is-active");
  });
}
