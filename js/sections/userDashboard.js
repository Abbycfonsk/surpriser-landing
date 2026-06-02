import { state } from "../state/appState.js";

export function renderUserDashboard(data = {}) {
    renderCreatorStats(data.creator || data);
    renderGeniusStats(data.genius || data);
    renderDashboardProfile(state.user || {});
}

function renderCreatorStats(data) {
    const box = document.getElementById("user_creator_stats");
    if (!box) return;

    box.innerHTML = `
        ${stat("Creadas", data.created_surprises || 0)}
        ${stat("Open", data.open || data.status_open || 0)}
        ${stat("In progress", data.in_progress || 0)}
        ${stat("Completed", data.completed || 0)}
        ${stat("Promedio mes", data.avg_monthly || "-")}
        ${stat("Promedio semana", data.avg_weekly || "-")}
    `;
}

function renderGeniusStats(data) {
    const box = document.getElementById("user_genius_stats");
    const skillsBox = document.getElementById("user_skills_stats");

    if (!box || !skillsBox) return;

    if (!state.user?.is_genius) {
        box.innerHTML = `<div class="mini-item">Cuando seas genio, aquí aparecerán tus métricas.</div>`;
        skillsBox.innerHTML = "";
        return;
    }

    box.innerHTML = `
        ${stat("Nivel", data.level || state.user.genius_level || "SPARK")}
        ${stat("Completadas", data.completed_surprises || 0)}
        ${stat("Valoración", data.rating || "-")}
        ${stat("Penalizaciones", data.penalties || 0)}
        ${stat("Promedio mes", data.avg_completed_monthly || "-")}
    `;

    const skills = data.skills || state.skills || [];

    skillsBox.innerHTML = skills.length
        ? skills.map(skill => `
            <div class="skill-dashboard-pill">
                <span>${skill.skill_name || skill.name || "Skill"}</span>
                <strong>Nivel ${skill.level || 0}</strong>
            </div>
        `).join("")
        : `<div class="mini-item">Sin skills todavía.</div>`;
}

function renderDashboardProfile(user) {
    const avatar = document.getElementById("dash_avatar_preview");
    const name = document.getElementById("dash_user_name");
    const roles = document.getElementById("dash_user_roles");

    if (avatar) avatar.src = getAvatarUrl(user.avatar);
    if (name) name.textContent = user.username ? `@${user.username}` : user.name || "Usuario";

    if (roles) {
        const roleList = ["Creador"];
        if (user.is_genius) roleList.push("Genio");
        if (user.is_admin) roleList.push("Admin");
        roles.textContent = roleList.join(" · ");
    }

    setValue("dash_up_name", user.name);
    setValue("dash_up_username", user.username);
    setValue("dash_up_bio", user.bio);
}

function stat(label, value) {
    return `
        <div class="stat-box">
            <span>${label}</span>
            <strong>${value}</strong>
        </div>
    `;
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
}

function getAvatarUrl(path) {
    const API = "https://api.surpriser.app";
    if (!path) return `${API}/storage/defaults/avatar.png`;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/storage/")) return API + path;
    return `${API}/storage/${path}`;
}