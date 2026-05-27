let createdSurprises = [];
let surpriseCountdownInterval = null;

/* =====================================================
   CREATE SURPRISE
===================================================== */

export function createSurpriseController() {
    const token = localStorage.getItem("token");
    if (!token) return showMsg("No hay sesión.");

    const file = document.getElementById("cs_header_file")?.files?.[0];
    const galleryImage = document.getElementById("cs_header_image")?.value?.trim() || "";

    const formData = new FormData();

    formData.append("creator_id", document.getElementById("cs_creator").value);
    formData.append("title", document.getElementById("cs_title").value);
    formData.append("description", document.getElementById("cs_desc").value);
    formData.append("skill_id", document.getElementById("cs_skill").value);
    formData.append("size", document.getElementById("cs_size").value);

    const deadline = document.getElementById("cs_deadline").value.trim();

    if (deadline) formData.append("deadline", deadline);

    if (file) {
        formData.append("header_image", file);
    } else if (galleryImage) {
        formData.append("header_image", galleryImage);
    }

    fetch(API + "/api/surprises", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json"
        },
        body: formData
    })
        .then(async res => {
            const text = await res.text();
            if (!res.ok) throw new Error(text);
            return JSON.parse(text);
        })
        .then(data => showMsg("Sorpresa creada ✔"))
        .catch(err => showMsg(err.message));
}


/* =====================================================
   LISTA CREATOR (V2 ONLY)
===================================================== */

export function loadCreatorDashboardController() {
    loadCreatedSurprisesControllerV2();
}

export function loadCreatedSurprisesControllerV2() {
    const token = localStorage.getItem("token");
    if (!currentUser) return;

    fetch(API + `/api/users/${currentUser.id}/surprises-created`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json"
        }
    })
        .then(async r => {
            const text = await r.text();
            if (!r.ok) throw new Error(text);
            return JSON.parse(text);
        })
        .then(response => {
            createdSurprises = response.data || [];

            renderSurpriseCards(
                "created_surprises_list",
                sortCreatorSurprises(createdSurprises),
                { mode: "creator" }
            );

            restartCountdowns();
        })
        .catch(err => showMsg(err.message));
}

export function sortCreatorSurprises(list) {
    const order = {
        open: 1,
        in_progress: 2,
        delivered: 3,
        completed: 4,
        cancelled: 5,
        canceled: 5
    };

    return [...list].sort((a, b) => {
        const diff = (order[a.status] || 99) - (order[b.status] || 99);
        if (diff !== 0) return diff;
        return new Date(b.created_at) - new Date(a.created_at);
    });
}


/* =====================================================
   UPDATE SURPRISE
===================================================== */

export function updateSurpriseController() {
    const id = us_id.value;
    const file = us_header_file.files[0];
    const galleryImage = us_header_image.value;

    const formData = new FormData();

    formData.append("title", us_title.value.trim());
    formData.append("description", us_desc.value.trim());
    formData.append("size", us_size.value.trim());

    if (us_deadline.value) formData.append("deadline", us_deadline.value);

    if (us_urgent.value === "true") formData.append("is_urgent", "1");
    if (us_urgent.value === "false") formData.append("is_urgent", "0");

    if (file) formData.append("header_image", file);
    else if (galleryImage) formData.append("header_image", galleryImage);

    formData.append("_method", "PUT");

    const token = localStorage.getItem("token");

    fetch(API + `/api/surprises/${id}`, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json"
        },
        body: formData
    })
        .then(async r => {
            const text = await r.text();
            if (!r.ok) throw new Error(text);
            return text;
        })
        .then(msg => {
            showMsg("Actualizado ✔");
            loadCreatorDashboardController();
        })
        .catch(err => showMsg(err.message));
}


/* =====================================================
   LIST ITEM ACTIONS
===================================================== */

export function fillUpdateSurpriseById(id) {
    const index = createdSurprises.findIndex(s => s.id === id);
    if (index === -1) return showMsg("No encontrada");
    fillUpdateSurpriseForm(index);
}

export function cancelSurpriseController(id) {
    const token = localStorage.getItem("token");
    if (!confirm("¿Cancelar esta sorpresa?")) return;

    api("POST", `/api/surprises/${id}/cancel`, {}, token)
        .then(r => {
            showMsg(r.text);
            loadCreatorDashboardController();
        });
}


/* =====================================================
   FORM FILL
===================================================== */

export function fillUpdateSurpriseForm(index) {
    const s = createdSurprises[index];
    if (!s) return showMsg("No encontrada");

    showAppSection("update");

    us_id.value = s.id || "";
    us_title.value = s.title || "";
    us_desc.value = s.description || "";
    us_price.value = s.price || "";
    us_deadline.value = s.deadline || "";
    us_size.value = s.size || "";

    us_urgent.value =
        s.is_urgent === 1 || s.is_urgent === true || s.is_urgent === "1"
            ? "true"
            : "false";

    us_header_image.value = s.header_image || "";

    if (s.header_image) {
        us_header_preview.src = getImageUrl(s.header_image);
        us_header_preview.style.display = "block";
    } else {
        us_header_preview.style.display = "none";
    }
}


/* =====================================================
   LISTENERS
===================================================== */

export function initCreateSurpriseListeners() {
    const skillInput = document.getElementById("cs_skill");
    const headerInput = document.getElementById("cs_header_image");
    const preview = document.getElementById("preview_header");
    const fileInput = document.getElementById("cs_header_file");

    if (skillInput) {
        skillInput.onchange = function () {
            const skill = this.value;
            if (!skill) return;

            const imagePath =
                `https://api.surpriser.app/storage/surprise_headers/category_${skill}.png`;

            headerInput.value = imagePath;
            preview.src = imagePath;
        };
    }

    if (fileInput) {
        fileInput.addEventListener("change", previewCreateHeaderImage);
    }
}

export function previewCreateHeaderImage() {

    const input = document.getElementById("cs_header_file");
    const preview = document.getElementById("preview_header");

    if (!input || !preview) return;

    const file = input.files?.[0];

    if (!file) {
        preview.src = "";
        preview.style.display = "none";
        return;
    }

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
}