import { state } from "../state/appState.js";

const API = "https://api.surpriser.app";
let currentConversationId = null;

export async function loadConversations() {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/api/conversations`, {
        headers: {
            "Accept": "application/json",
            "Authorization": "Bearer " + token
        }
    });

    const json = await res.json();
    renderConversationList(json.data || json || []);
}

function renderConversationList(conversations) {
    const box = document.getElementById("conversation_list");
    if (!box) return;

    if (!conversations.length) {
        box.innerHTML = `<div class="mini-item">No tienes conversaciones abiertas.</div>`;
        return;
    }

    box.innerHTML = conversations.map(conversation => {
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
    }).join("");
}

export async function openConversation(conversationId) {
    const token = localStorage.getItem("token");
    currentConversationId = conversationId;

    document.getElementById("chat_empty").style.display = "none";
    document.getElementById("chat_view").style.display = "flex";

    document.querySelectorAll(".conversation-item").forEach(btn => {
        btn.classList.toggle("is-active", btn.dataset.conversationId === String(conversationId));
    });

    const res = await fetch(`${API}/api/conversations/${conversationId}/messages`, {
        headers: {
            "Accept": "application/json",
            "Authorization": "Bearer " + token
        }
    });

    const json = await res.json();
    const messages = json.data || json || [];

    renderMessages(messages.slice(-10), messages);
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

function renderMessage(message) {
    const mine = Number(message.user_id) === Number(state.user?.id);

    return `
        <div class="message-row ${mine ? "mine" : ""}">
            <div class="message-bubble">
                <p>${message.body || message.message || ""}</p>
                <time>${formatTime(message.created_at)}</time>
            </div>
        </div>
    `;
}

export function initChatForm() {
    const form = document.getElementById("chat_form");
    if (!form) return;

    form.addEventListener("submit", async e => {
        e.preventDefault();

        const input = document.getElementById("chat_message_input");
        const body = input.value.trim();

        if (!body || !currentConversationId) return;

        const token = localStorage.getItem("token");

        const res = await fetch(`${API}/api/messages`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                conversation_id: currentConversationId,
                body
            })
        });

        if (res.ok) {
            input.value = "";
            await openConversation(currentConversationId);
        }
    });
}

export async function deleteCurrentConversation() {
    if (!currentConversationId) return;
    if (!confirm("¿Eliminar esta conversación?")) return;

    const token = localStorage.getItem("token");

    await fetch(`${API}/api/conversations/${currentConversationId}`, {
        method: "DELETE",
        headers: {
            "Accept": "application/json",
            "Authorization": "Bearer " + token
        }
    });

    currentConversationId = null;
    document.getElementById("chat_view").style.display = "none";
    document.getElementById("chat_empty").style.display = "block";

    await loadConversations();
}

function getOtherUser(conversation) {
    const users = [conversation.creator, conversation.genius, conversation.user].filter(Boolean);
    return users.find(user => Number(user.id) !== Number(state.user?.id)) || users[0] || {};
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
        minute: "2-digit"
    });
}