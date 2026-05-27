let currentUser = null;

/* =====================================================
   LOAD USER (V2 - PRINCIPAL)
===================================================== */

export function loadUserControllerV2() {

    const token = localStorage.getItem("token");

    return api("GET", "/api/me", null, token)
        .then(r => {

            if (r.status !== 200) {
                throw new Error("Sesión caducada. Vuelve a entrar.");
            }

            currentUser = r.json;

            fillProfileCard(currentUser);
            fillProfileForm(currentUser);

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
    const avatarEl = document.getElementById("profile_avatar_preview");

    if (nameEl) nameEl.textContent = user.name || "Sin nombre";
    if (usernameEl) usernameEl.textContent = user.username ? "@" + user.username : "@usuario";
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
            className: "role-creator"
        }
    ];

    if (user.is_genius == 1 || user.is_genius === true || user.is_genius === "1") {
        roles.push({
            label: "Genio",
            className: "role-genius"
        });
    }

    if (user.is_admin == 1 || user.is_admin === true || user.is_admin === "1") {
        roles.push({
            label: "Admin",
            className: "role-admin"
        });
    }

    rolesBox.innerHTML = roles
        .map(r => `<span class="profile-role ${r.className}">${r.label}</span>`)
        .join("");
}

/* =====================================================
   FORM FILL
===================================================== */

export function fillProfileForm(user) {

    if (typeof up_name !== "undefined") up_name.value = user.name || "";
    if (typeof up_username !== "undefined") up_username.value = user.username || "";
    if (typeof up_bio !== "undefined") up_bio.value = user.bio || "";
    if (typeof up_phone !== "undefined") up_phone.value = user.phone || "";
    if (typeof up_city !== "undefined") up_city.value = user.location_city || "";
    if (typeof up_country !== "undefined") up_country.value = user.location_country || "";

    if (typeof up_is_genius !== "undefined") {
        up_is_genius.value =
            (user.is_genius == 1 || user.is_genius === true) ? "1" : "0";
    }
}

/* =====================================================
   UPDATE PROFILE
===================================================== */

export function updateProfileController() {

    const token = localStorage.getItem("token");

    if (!token) {
        location.href = "login.html";
        return;
    }

    const formData = new FormData();

    if (up_name.value.trim()) formData.append("name", up_name.value.trim());
    if (up_username.value.trim()) formData.append("username", up_username.value.trim());
    if (up_bio.value.trim()) formData.append("bio", up_bio.value.trim());
    if (up_phone.value.trim()) formData.append("phone", up_phone.value.trim());
    if (up_city.value.trim()) formData.append("location_city", up_city.value.trim());
    if (up_country.value.trim()) formData.append("location_country", up_country.value.trim());

    formData.append("is_genius", up_is_genius.value);

    const avatar = up_avatar_file?.files?.[0];
    if (avatar) formData.append("avatar", avatar);

    formData.append("_method", "PUT");

    fetch(API + "/api/user/profile", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json"
        },
        body: formData
    })
        .then(async r => {

            const text = await r.text();

            if (!r.ok) {
                throw new Error(`Error ${r.status}: ${text}`);
            }

            return JSON.parse(text);
        })
        .then(data => {

            showMsg(JSON.stringify(data, null, 2));

            // refrescar usuario
            loadUserControllerV2();
        })
        .catch(err => showMsg(err.message));
}

/* =====================================================
   UI
===================================================== */

export function toggleProfileEditor() {

    const editor = document.getElementById("profile_editor");

    if (!editor) return;

    editor.style.display =
        editor.style.display === "none" ? "block" : "none";
}