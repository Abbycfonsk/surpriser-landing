import { API } from "../api.js";

import { getMe, updateProfile } from "../services/userService.js";
let currentUser = null;
function getImageUrl(path) {
  const fallback = "https://api.surpriser.app/storage/defaults/avatar.png";

  if (!path) return fallback;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanPath = String(path).replace(/^\/+/, "");

  if (cleanPath.startsWith("storage/")) {
    return `${API}/${cleanPath}`;
  }

  return `${API}/storage/${cleanPath}`;
}
/* =====================================================
   LOAD USER (V2 - PRINCIPAL)
===================================================== */

export function loadUserControllerV2() {
  const token = localStorage.getItem("token");

  return getMe(token).then((r) => {
    if (r.status !== 200) {
      throw new Error("Sesión caducada. Vuelve a entrar.");
    }

    currentUser = r.json;

    fillProfileCard(currentUser);
    fillProfileForm(currentUser);
    initThemeToggle();
    initProfileEvents();

    // sincronizar creator_id
    const creatorInput = document.getElementById("cs_creator");
    if (creatorInput) {
      creatorInput.value = currentUser.id;
    }

    return currentUser;
  });
}

/* =====================================================
   PROFILE CARD
===================================================== */

export function fillProfileCard(user) {
  const nameEl = document.getElementById("profile_name");
  const usernameEl = document.getElementById("profile_username");
  const bioEl = document.getElementById("profile_bio");
  const avatarEl = document.getElementById("profile_avatar_preview_large");

  if (nameEl) nameEl.textContent = user.name || "Sin nombre";
  if (usernameEl)
    usernameEl.textContent = user.username ? "@" + user.username : "@usuario";
  if (bioEl) bioEl.textContent = user.bio || "Sin bio todavía.";

  renderUserRoles(user);

  if (avatarEl) {
    avatarEl.src = user.avatar
      ? getImageUrl(user.avatar)
      : "https://api.surpriser.app/storage/defaults/avatar.png";
  }
}

/* =====================================================
   ROLES
===================================================== */

export function renderUserRoles(user) {
  const rolesBox = document.getElementById("profile_roles");
  if (!rolesBox) return;

  const roles = [
    {
      label: "Creador",
      className: "role-creator",
    },
  ];

  if (
    user.is_genius == 1 ||
    user.is_genius === true ||
    user.is_genius === "1"
  ) {
    roles.push({
      label: "Genio",
      className: "role-genius",
    });
  }

  if (user.is_admin == 1 || user.is_admin === true || user.is_admin === "1") {
    roles.push({
      label: "Admin",
      className: "role-admin",
    });
  }

  rolesBox.innerHTML = roles
    .map((r) => `<span class="profile-role ${r.className}">${r.label}</span>`)
    .join("");
}

/* =====================================================
   FORM FILL
===================================================== */

export function fillProfileForm(user) {
  if (typeof up_name !== "undefined") up_name.value = user.name || "";
  if (typeof up_username !== "undefined")
    up_username.value = user.username || "";
  if (typeof up_bio !== "undefined") up_bio.value = user.bio || "";
  if (typeof up_phone !== "undefined") up_phone.value = user.phone || "";
  if (typeof up_city !== "undefined") up_city.value = user.location_city || "";
  if (typeof up_country !== "undefined")
    up_country.value = user.location_country || "";

  if (typeof up_is_genius !== "undefined") {
    up_is_genius.value =
      user.is_genius == 1 || user.is_genius === true ? "1" : "0";
  }
}

/* =====================================================
   UPDATE PROFILE
===================================================== */

export async function updateProfileController() {
  console.log("UPDATE PROFILE EJECUTADO");

  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const formData = new FormData();

  const nameInput = document.getElementById("up_name");
  const usernameInput = document.getElementById("up_username");
  const bioInput = document.getElementById("up_bio");
  const phoneInput = document.getElementById("up_phone");
  const cityInput = document.getElementById("up_city");
  const countryInput = document.getElementById("up_country");
  const geniusInput = document.getElementById("up_is_genius");
  const avatarInput = document.getElementById("up_avatar_file");

  formData.append("name", nameInput?.value.trim() || "");
  formData.append("username", usernameInput?.value.trim() || "");
  formData.append("bio", bioInput?.value.trim() || "");
  formData.append("phone", phoneInput?.value.trim() || "");
  formData.append("location_city", cityInput?.value.trim() || "");
  formData.append("location_country", countryInput?.value.trim() || "");

  if (geniusInput) {
    formData.append("is_genius", geniusInput.value === "1" ? "1" : "0");
  }

  if (avatarInput?.files?.[0]) {
    formData.append("avatar", avatarInput.files[0]);
  }

  // Solo si Laravel espera PUT mediante method spoofing.
  formData.append("_method", "PUT");

  try {
    const response = await updateProfile(formData, token);

    console.log("Respuesta actualización perfil:", response);

    if (!response.ok) {
      const message =
        response.json?.message ||
        response.json?.error ||
        response.text ||
        "No se pudo actualizar el perfil.";

      throw new Error(message);
    }

    const updatedUser = response.json?.data || response.json;

    currentUser = updatedUser;

    fillProfileCard(currentUser);
    fillProfileForm(currentUser);

    window.showNotificationToast?.({
      title: "Perfil actualizado",
      message: "Tus cambios se han guardado correctamente.",
    });
  } catch (error) {
    console.error("Error actualizando perfil:", error);

    window.showNotificationToast?.({
      title: "Error",
      message: error.message || "No se pudo actualizar el perfil.",
    });
  }
}
export function initProfileEvents() {
  const button = document.querySelector('[data-action="update-profile"]');

  if (!button) {
    console.warn("No se encontró el botón de actualizar perfil.");
    return;
  }

  button.onclick = updateProfileController;

  console.log("Botón de perfil conectado correctamente");
}
/* =====================================================
   UI
===================================================== */

export function toggleProfileEditor() {
  const editor = document.getElementById("profile_editor");

  if (!editor) return;

  editor.style.display = editor.style.display === "none" ? "block" : "none";
}
export function initThemeToggle() {
  const toggle = document.getElementById("theme_toggle");
  const stateLabel = document.getElementById("theme_toggle_state");

  if (!toggle) return;

  const savedTheme = localStorage.getItem("theme") || "dark";

  applyTheme(savedTheme);

  toggle.onchange = () => {
    const nextTheme = toggle.checked ? "light" : "dark";
    applyTheme(nextTheme);
  };

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    toggle.checked = theme === "light";

    if (stateLabel) {
      stateLabel.textContent = theme === "light" ? "Modo claro" : "Modo oscuro";
    }
  }
}
