/* ============================================================
   SURPRISER FRONTEND MVC – CONTROLADORES
   ============================================================ */

const API = "https://api.surpriser.app";

/* ============================================================
   API BASE (con CORS correcto)
   ============================================================ */
function api(method, route, body = null, token = null) {
    const headers = {
        "Accept": "application/json"
    };

    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    if (body) {
        headers["Content-Type"] = "application/json";
        headers["X-Requested-With"] = "XMLHttpRequest";
    }

    return fetch(API + route, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        mode: "cors",
        credentials: "omit"
    })
    .then(res => res.text().then(text => ({
        status: res.status,
        text,
        json: safeJSON(text)
    })));
}

function safeJSON(text) {
    try { return JSON.parse(text); }
    catch { return text; }
}

/* ============================================================
   AUTH – LOGIN / REGISTER / LOGOUT / ME
   ============================================================ */



function registerController() {
    const name = reg_name.value.trim();
    const email = reg_email.value.trim();
    const password = reg_pass.value.trim();
    const password_confirmation = reg_pass2.value.trim();
    const is_genius = reg_is_genius.checked ? 1 : 0;

    api("POST", "/api/register", {
        name,
        email,
        password,
        password_confirmation,
        is_genius
    })
    .then(r => showMsg(r.text));
}

function forgotPasswordController() {
    const email = fp_email.value.trim();

    api("POST", "/api/forgot-password", { email })
        .then(r => showMsg(r.text));
}

function resetPasswordController() {
    const token = rp_token.value.trim();
    const email = rp_email.value.trim();
    const password = rp_pass.value.trim();
    const password_confirmation = rp_pass2.value.trim();

    api("POST", "/api/reset-password", {
        token,
        email,
        password,
        password_confirmation
    })
    .then(r => showMsg(r.text));
}

function logoutController() {
    const token = localStorage.getItem("token");

    api("POST", "/api/logout", null, token)
        .finally(() => {
            localStorage.removeItem("token");
            location.href = "login.html";
        });
}

/* ============================================================
   USER PROFILE
   ============================================================ */

function loadUserController() {
    const token = localStorage.getItem("token");
    if (!token) return location.href = "login.html";

    api("GET", "/api/me", null, token)
        .then(r => {
            if (r.status !== 200) {
                showMsg("Error " + r.status + ": " + r.text);
                return;
            }

            const user = r.json;

            fillProfileCard(user);
            fillProfileForm(user);
        });
}

function fillProfileCard(user) {
    document.getElementById("profile_name").textContent = user.name || "Sin nombre";
    document.getElementById("profile_username").textContent = user.username ? "@" + user.username : "@usuario";
    document.getElementById("profile_bio").textContent = user.bio || "Sin bio todavía.";
    document.getElementById("profile_phone").textContent = user.phone || "-";
    document.getElementById("profile_city").textContent = user.location_city || "-";
    document.getElementById("profile_country").textContent = user.location_country || "-";
    renderUserRoles(user);
    const avatar = document.getElementById("profile_avatar_preview");

    if (user.avatar) {
        avatar.src = getImageUrl(user.avatar);
    } else {
        avatar.src = "https://api.surpriser.app/storage/defaults/avatar.png";
    }
}
function renderUserRoles(user) {
    const rolesBox = document.getElementById("profile_roles");

    if (!rolesBox) return;

    const roles = [];

    roles.push({
        label: "Creador",
        className: "role-creator"
    });

    if (user.is_genius === 1 || user.is_genius === true || user.is_genius === "1") {
        roles.push({
            label: "Genio",
            className: "role-genius"
        });
    }

    if (user.is_admin === 1 || user.is_admin === true || user.is_admin === "1") {
        roles.push({
            label: "Admin",
            className: "role-admin"
        });
    }

    rolesBox.innerHTML = roles.map(role => `
        <span class="profile-role ${role.className}">
            ${role.label}
        </span>
    `).join("");
}
function fillProfileForm(user) {
    up_name.value = user.name || "";
    up_username.value = user.username || "";
    up_bio.value = user.bio || "";
    up_phone.value = user.phone || "";
    up_city.value = user.location_city || "";
    up_country.value = user.location_country || "";
    up_is_genius.value = user.is_genius === 1 || user.is_genius === true ? "1" : "0";
}

function updateProfileController() {
    const token = localStorage.getItem("token");
    if (!token) return location.href = "login.html";

    let formData = new FormData();

    if (up_name.value.trim() !== "") {
        formData.append("name", up_name.value.trim());
    }

    if (up_username.value.trim() !== "") {
        formData.append("username", up_username.value.trim());
    }

    if (up_bio.value.trim() !== "") {
        formData.append("bio", up_bio.value.trim());
    }

    if (up_phone.value.trim() !== "") {
        formData.append("phone", up_phone.value.trim());
    }

    if (up_city.value.trim() !== "") {
        formData.append("location_city", up_city.value.trim());
    }

    if (up_country.value.trim() !== "") {
        formData.append("location_country", up_country.value.trim());
    }

    formData.append("is_genius", up_is_genius.value);

    const avatar = up_avatar_file.files[0];

    if (avatar) {
        formData.append("avatar", avatar);
    }

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
            loadUserController();
        })
        .catch(err => showMsg(err.message));
}
/* ============================================================
   USER DASHBOARD
   ============================================================ */

function userDashboardController() {
    const id = dash_id.value;
    api("GET", `/api/users/${id}/dashboard`)
        .then(r => showMsg(r.text));
}

/* ============================================================
   SURPRISES – CREATE / UPDATE
   ============================================================ */

function createSurpriseController() {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("No hay token. Debes iniciar sesión.");
        return;
    }

    const file = document.getElementById("cs_header_file").files[0];
    const galleryImage = document.getElementById("cs_header_image").value.trim();

    let formData = new FormData();

    formData.append("creator_id", document.getElementById("cs_creator").value);
    formData.append("genius_id", document.getElementById("cs_genius").value);
    formData.append("title", document.getElementById("cs_title").value);
    formData.append("description", document.getElementById("cs_desc").value);
    formData.append("skill_id", document.getElementById("cs_skill").value);
    formData.append("size", document.getElementById("cs_size").value);

    const price = document.getElementById("cs_price").value.trim();
    const deadline = document.getElementById("cs_deadline").value.trim();
    const urgent = document.getElementById("cs_urgent").value;
    const highlight = document.getElementById("cs_highlight").value;

    if (price !== "") {
        formData.append("price", price);
    }

    if (deadline !== "") {
        formData.append("deadline", deadline);
    }

    if (urgent === "true") {
        formData.append("is_urgent", "1");
    }

    if (urgent === "false") {
        formData.append("is_urgent", "0");
    }

    if (highlight === "true") {
        formData.append("highlight", "1");
    }

    if (highlight === "false") {
        formData.append("highlight", "0");
    }

    if (file) {
        formData.append("header_image", file);
    } else if (galleryImage !== "") {
        formData.append("header_image", galleryImage);
    }

    fetch("https://api.surpriser.app/api/surprises", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json"
        },
        body: formData
    })
        .then(async res => {
            const text = await res.text();

            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${text}`);
            }

            return JSON.parse(text);
        })
        .then(data => {
            document.getElementById("output").textContent = JSON.stringify(data, null, 2);
        })
        .catch(err => {
            document.getElementById("output").textContent = err.message;
        });
}
function previewCreateHeaderImage() {
    const file = document.getElementById("cs_header_file").files[0];
    const preview = document.getElementById("preview_header");

    if (!file) {
        preview.src = "";
        preview.style.display = "none";
        return;
    }

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
}

function updateSurpriseController() {
    const id = us_id.value;
    const file = us_header_file.files[0];
    const galleryImage = us_header_image.value;

    if (us_title.value.trim() === "") {
        showMsg("El título es obligatorio.");
        return;
    }

    if (us_desc.value.trim() === "") {
        showMsg("La descripción es obligatoria.");
        return;
    }

    if (us_size.value.trim() === "") {
        showMsg("El tamaño es obligatorio.");
        return;
    }

    let formData = new FormData();

    formData.append("title", us_title.value.trim());
    formData.append("description", us_desc.value.trim());
    formData.append("size", us_size.value.trim());

    if (us_price.value.trim() !== "") {
        formData.append("price", us_price.value);
    }

    if (us_deadline.value.trim() !== "") {
        formData.append("deadline", us_deadline.value);
    }

    if (us_urgent.value === "true") {
        formData.append("is_urgent", "1");
    }

    if (us_urgent.value === "false") {
        formData.append("is_urgent", "0");
    }

    formData.append("target_name", us_tname.value);
    formData.append("target_city", us_tcity.value);
    formData.append("target_country", us_tcountry.value);

    if (us_tlat.value.trim() !== "") {
        formData.append("target_lat", us_tlat.value);
    }

    if (us_tlng.value.trim() !== "") {
        formData.append("target_lng", us_tlng.value);
    }

    if (file) {
        formData.append("header_image", file);
    } else if (galleryImage.trim() !== "") {
        formData.append("header_image", galleryImage.trim());
    }

    formData.append("_method", "PUT");

    const token = localStorage.getItem("token");

    fetch(API + "/api/surprises/" + id, {
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

            return text;
        })
        .then(showMsg)
        .catch(err => showMsg(err.message));
}
function indexController() {
    const token = localStorage.getItem("token");

    const box = document.getElementById("sessionBox");

    if (!token) {
        box.textContent = "No has iniciado sesión.";
        return;
    }

    box.innerHTML = `
        <p>Ya has iniciado sesión.</p>
        <a class="btn" href="dashboard.html">Ir al Dashboard</a>
        <br><br>
        <button class="btn" onclick="logoutController()">Logout</button>
    `;
}
function loginController() {

    const email = document.getElementById("log_email").value.trim();
    const password = document.getElementById("log_pass").value.trim();

    fetch("https://api.surpriser.app/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"   // NO X-Requested-With
        },
        body: JSON.stringify({ email, password }),
        mode: "cors",
        credentials: "omit"
    })
    .then(res => res.json().catch(() => null).then(data => ({ status: res.status, data })))
    .then(r => {

        if (r.status === 200 && r.data && r.data.token) {
            // Guardar token
            localStorage.setItem("token", r.data.token);

            // Redirigir
            location.href = "dashboard.html";
            return;
        }

        // Mostrar error
        const out = document.getElementById("output");
        if (out) out.textContent = JSON.stringify(r.data, null, 2);
    })
    .catch(err => {
        const out = document.getElementById("output");
        if (out) out.textContent = "Error: " + err;
    });
}

/* ============================================================
   UTILIDAD
   ============================================================ */

function showMsg(msg) {
    const out = document.getElementById("output");
    if (out) out.textContent = msg;
}

/* ============================================================
   NAVEGACIÓN INTERNA DEL DASHBOARD
   ============================================================ */

function dashboardInit() {
    loadUserController(); // carga datos del usuario al entrar
    showSection('profile'); // sección por defecto
}


function showSection(name) {
    document.querySelectorAll(".section").forEach(section => {
        section.style.display = "none";
    });

    const section = document.getElementById("section-" + name);

    if (section) {
        section.style.display = "block";
    }

    if (name === "created") {
        loadCreatedSurprisesController();
    }
}
function initCreateSurpriseListeners() {

    const skillInput = document.getElementById("cs_skill");
    const headerInput = document.getElementById("cs_header_image");
    const preview = document.getElementById("preview_header");

    if (!skillInput) return; // seguridad

    // Evitar duplicar listeners
    skillInput.onchange = function () {
        const skill = this.value;
        if (!skill) return;

        const imagePath = `https://api.surpriser.app/storage/surprise_headers/category_${skill}.png`;

        headerInput.value = imagePath;
        preview.src = imagePath;
    };
}
function initUpdateSurpriseListeners() {

    const fileInput = document.getElementById("us_header_file");
    const preview = document.getElementById("us_header_preview");
    const urlInput = document.getElementById("us_header_image");

    if (!fileInput) return; // seguridad

    // Evitar listeners duplicados
    fileInput.onchange = function () {
        const file = this.files[0];
        if (!file) {
            preview.style.display = "none";
            preview.src = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);

        // Si subes archivo, vaciamos el campo URL
        urlInput.value = "";
    };
}
let createdSurprises = [];

function loadCreatedSurprisesController() {
    const token = localStorage.getItem("token");

    fetch(API + "/api/me", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json"
        }
    })
        .then(async r => {
            const text = await r.text();

            if (!r.ok) {
                throw new Error(`Error ${r.status}: ${text}`);
            }

            return JSON.parse(text);
        })
        .then(user => {
            return fetch(API + "/api/users/" + user.id + "/surprises-created", {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Accept": "application/json"
                }
            });
        })
        .then(async r => {
            const text = await r.text();

            if (!r.ok) {
                throw new Error(`Error ${r.status}: ${text}`);
            }

            return JSON.parse(text);
        })
        .then(response => {
            createdSurprises = response.data || [];
            renderCreatedSurprises();
        })
        .catch(err => showMsg(err.message));
}

let surpriseCountdownInterval = null;

function renderCreatedSurprises() {
    const container = document.getElementById("created_surprises_list");

    if (!container) {
        showMsg("No existe el contenedor created_surprises_list.");
        return;
    }

    if (surpriseCountdownInterval) {
        clearInterval(surpriseCountdownInterval);
    }

    if (createdSurprises.length === 0) {
        container.innerHTML = "<p>No tienes sorpresas creadas.</p>";
        return;
    }

    const statusOrder = {
        open: 1,
        in_progress: 2,
        delivered: 3,
        completed: 4,
        cancelled: 5,
        canceled: 5
    };

    const sortedSurprises = [...createdSurprises].sort((a, b) => {
        const statusA = statusOrder[a.status] || 99;
        const statusB = statusOrder[b.status] || 99;

        if (statusA !== statusB) {
            return statusA - statusB;
        }

        return new Date(b.created_at) - new Date(a.created_at);
    });

    container.innerHTML = sortedSurprises.map((surprise) => {
        const originalIndex = createdSurprises.indexOf(surprise);
        const imageUrl = surprise.header_image ? getImageUrl(surprise.header_image) : "";

        const status = surprise.status || "open";
        const statusClass = "surprise-status-" + status;

        const isFeatured =
            surprise.ads_exists === true ||
            surprise.ads_exists === 1 ||
            surprise.ads_exists === "1";

        return `
            <div class="surprise-card ${isFeatured ? "surprise-card-featured" : ""}">
                ${imageUrl ? `
                    <img src="${imageUrl}" alt="${surprise.title || "Sorpresa"}">
                ` : ""}

                <span class="surprise-status ${statusClass}">
                    ${status}
                </span>

                <h4>${surprise.title || "Sin título"}</h4>


                <div class="surprise-meta">
               <p>${surprise.skill ? surprise.skill.name : "Sin categoría"}</p>
                     <p><strong>${surprise.size || ""}</strong></p>
                    <p>${surprise.is_urgent === 1 || surprise.is_urgent === true ? "Urgente" : ""}</p>
                    <p>
                        
                        <span
                            class="surprise-countdown"
                            data-deadline="${surprise.deadline || ""}"
                        >
                            Calculando...
                        </span>
                    </p>

                   
                </div>

                <button class="btn" onclick="fillUpdateSurpriseForm(${originalIndex})">
                    Modificar
                </button>
            </div>
        `;
    }).join("");

    updateSurpriseCountdowns();

    surpriseCountdownInterval = setInterval(updateSurpriseCountdowns, 1000);
}

function updateSurpriseCountdowns() {
    document.querySelectorAll(".surprise-countdown").forEach(element => {
        const deadline = element.dataset.deadline;

        element.textContent = getCountdownText(deadline);

        if (element.textContent === "Expirada") {
            element.classList.add("surprise-countdown-expired");
        } else {
            element.classList.remove("surprise-countdown-expired");
        }
    });
}

function getCountdownText(deadline) {
    if (!deadline) {
        return "Sin fecha";
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();

    if (isNaN(deadlineDate.getTime())) {
        return "Fecha no válida";
    }

    const diff = deadlineDate - now;

    if (diff <= 0) {
        return "Expirada";
    }

    const seconds = Math.floor(diff / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }

    return `${hours}h ${minutes}m ${secs}s`;
}

function fillUpdateSurpriseForm(index) {
    const surprise = createdSurprises[index];

    if (!surprise) {
        showMsg("No se ha encontrado la sorpresa.");
        return;
    }

    showSection("update");

    us_id.value = surprise.id || "";
    us_title.value = surprise.title || "";
    us_desc.value = surprise.description || "";
    us_price.value = surprise.price || "";
    us_deadline.value = surprise.deadline || "";
    us_size.value = surprise.size || "";

    if (surprise.is_urgent === true || surprise.is_urgent === 1 || surprise.is_urgent === "1") {
        us_urgent.value = "true";
    } else if (surprise.is_urgent === false || surprise.is_urgent === 0 || surprise.is_urgent === "0") {
        us_urgent.value = "false";
    } else {
        us_urgent.value = "";
    }

    us_tname.value = surprise.target_name || "";
    us_tcity.value = surprise.target_city || "";
    us_tcountry.value = surprise.target_country || "";
    us_tlat.value = surprise.target_lat || "";
    us_tlng.value = surprise.target_lng || "";

    us_header_image.value = surprise.header_image || "";
    us_header_file.value = "";

    if (surprise.header_image) {
        us_header_preview.src = getImageUrl(surprise.header_image);
        us_header_preview.style.display = "block";
    } else {
        us_header_preview.src = "";
        us_header_preview.style.display = "none";
    }

    showMsg("Sorpresa cargada para modificar.");
}

function getImageUrl(path) {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    return API + "/storage/" + path;
}