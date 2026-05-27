export function loadShoppingController() {
    const token = localStorage.getItem("token");
    if (!token) return;

    Promise.all([
        api("GET", "/api/creator/plan/current", null, token),
        api("GET", "/api/creator/package/current", null, token),
        api("GET", "/api/creator/ads/stats", null, token)
    ])
    .then(([planRes, packRes, statsRes]) => {

        const plan = planRes.json?.data || null;
        const pack = packRes.json?.data || null;
        const stats = statsRes.json?.data || null;

        const box = document.getElementById("shopping_status");
        if (!box) return;

        const adsLeft = pack
            ? (pack.ads_total ?? 0) - (pack.ads_used ?? 0)
            : null;

        box.innerHTML = `
            <h3>Estado actual</h3>

            <p>
                <strong>Plan:</strong>
                ${plan?.plan_type || "Sin plan activo"}
            </p>

            <p>
                <strong>Paquete:</strong>
                ${adsLeft !== null ? `${adsLeft} ads disponibles` : "Sin paquete activo"}
            </p>

            <p>
                <strong>Stats:</strong>
                ${stats ? JSON.stringify(stats) : "Sin datos"}
            </p>
        `;
    })
    .catch(err => showMsg(err.message));
}


export function purchaseCreatorPlan(planType) {
    const token = localStorage.getItem("token");
    if (!token) return;

    api("POST", "/api/creator/plan/purchase", {
        plan_type: planType
    }, token)
    .then(r => {
        showMsg(r.text);
        loadShoppingController();
    })
    .catch(err => showMsg(err.message));
}


export function purchaseCreatorPackage(packageType) {
    const token = localStorage.getItem("token");
    if (!token) return;

    api("POST", "/api/creator/package/purchase", {
        package_type: String(packageType)
    }, token)
    .then(r => {
        showMsg(r.text);
        loadShoppingController();
    })
    .catch(err => showMsg(err.message));
}