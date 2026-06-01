import { api } from "../api.js";

/* =========================
   FILES
========================= */

export function downloadFile(fileId, token) {
    return api("GET", `/api/files/${fileId}/download`, null, token);
}

export function downloadMessageFile(fileId, token) {
    return api("GET", `/api/messages/file/${fileId}`, null, token);
}

export async function uploadSurpriseFile(surpriseId, file, token) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`https://api.surpriser.app/api/surprises/${surpriseId}/files`, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json"
        },
        body: formData
    });

    const text = await res.text();

    let json = null;

    try {
        json = JSON.parse(text);
    } catch {
        json = text;
    }

    return {
        status: res.status,
        ok: res.ok,
        text,
        json
    };
}

export async function deleteSurpriseFile(fileId, token) {
    const res = await fetch(`https://api.surpriser.app/api/files/${fileId}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json"
        }
    });

    const text = await res.text();

    let json = null;

    try {
        json = JSON.parse(text);
    } catch {
        json = text;
    }

    return {
        status: res.status,
        ok: res.ok,
        text,
        json
    };
}