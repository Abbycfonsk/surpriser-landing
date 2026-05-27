export const API = "https://api.surpriser.app";

export function api(method, route, body = null, token = null) {
    const headers = {
        "Accept": "application/json"
    };

    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    const isFormData = body instanceof FormData;

    let finalBody = body;

    if (!isFormData && body !== null && body !== undefined) {
        headers["Content-Type"] = "application/json";
        finalBody = JSON.stringify(body);
    }

    return fetch(`${API}${route}`, {
        method,
        headers,
        body: finalBody,
        mode: "cors",
        credentials: "omit"
    })
    .then(async res => {
        const text = await res.text();

       return {
    ok: res.ok,
    status: res.status,
    text,
    json: safeJSON(text)
};
    });
}

function safeJSON(text) {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}