import { createSurprise, updateSurprise, getCreatedSurprises, cancelSurprise } from "../services/surpriseService.js";
import { restartCountdowns } from "../main.js";

let createdSurprises = [];

/* =========================
   CREATE
========================= */

export function createSurpriseController() {
    const token = localStorage.getItem("token");
    if (!token) return showMsg("No hay sesión.");

    const formData = new FormData();

    formData.append("creator_id", cs_creator.value);
    formData.append("title", cs_title.value);
    formData.append("description", cs_desc.value);
    formData.append("skill_id", cs_skill.value);
    formData.append("size", cs_size.value);

    const file = cs_header_file?.files?.[0];
    const galleryImage = cs_header_image?.value?.trim();

    if (file) formData.append("header_image", file);
    else if (galleryImage) formData.append("header_image", galleryImage);

    createSurprise(formData, token)
        .then(r => {
            if (r.status !== 200) throw new Error(r.text);
            showMsg("Sorpresa creada ✔");
        })
        .catch(err => showMsg(err.message));
}

/* =========================
   LOAD CREATED
========================= */

export function loadCreatedSurprisesControllerV2(currentUser, token) {
    if (!currentUser) return;

    getCreatedSurprises(currentUser.id, token)
        .then(r => {
            createdSurprises = r.json?.data || [];

            renderSurpriseCards(
                "created_surprises_list",
                createdSurprises,
                { mode: "creator" }
            );

            restartCountdowns();
        })
        .catch(err => showMsg(err.message));
}

/* =========================
   UPDATE
========================= */

export function updateSurpriseController() {
    const token = localStorage.getItem("token");

    const formData = new FormData();

    formData.append("title", us_title.value.trim());
    formData.append("description", us_desc.value.trim());
    formData.append("size", us_size.value.trim());

    const file = us_header_file.files[0];
    const galleryImage = us_header_image.value;

    if (file) formData.append("header_image", file);
    else if (galleryImage) formData.append("header_image", galleryImage);

    updateSurprise(us_id.value, formData, token)
        .then(r => {
            showMsg("Actualizado ✔");
        })
        .catch(err => showMsg(err.message));
}

/* =========================
   CANCEL
========================= */

export function cancelSurpriseController(id) {
    const token = localStorage.getItem("token");

    cancelSurprise(id, token)
        .then(r => {
            showMsg(r.text);
        })
        .catch(err => showMsg(err.message));
}

/* =========================
   LISTENERS
========================= */

export function initCreateSurpriseListeners() {
    cs_skill.onchange = function () {
        const imagePath =
            `https://api.surpriser.app/storage/surprise_headers/category_${this.value}.png`;

        cs_header_image.value = imagePath;
        preview_header.src = imagePath;
    };

    cs_header_file.addEventListener("change", previewCreateHeaderImage);
}

export function previewCreateHeaderImage() {
    const file = cs_header_file.files[0];

    if (!file) return;

    preview_header.src = URL.createObjectURL(file);
}