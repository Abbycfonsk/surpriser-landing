import { renderSimpleSurprise } from "../sections/home.js";

export function showMsg(message) {
    alert(message);
}
export function renderSimpleSurpriseList(containerId, list) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = list.map(renderSimpleSurprise).join('');
}