export function initNavigation() {

  document.addEventListener("click", (e) => {

    // =========================
    // CAMBIO DE SECCIÓN
    // =========================
    const sectionBtn = e.target.closest("[data-section]");

    if (sectionBtn) {
      showAppSection(sectionBtn.dataset.section);
      return;
    }

    // =========================
    // ACCIONES GLOBALES
    // =========================
    const actionBtn = e.target.closest("[data-action]");

    if (!actionBtn) return;

    const action = actionBtn.dataset.action;

    // DEBUG
    console.log("ACTION:", action);

    // =========================
    // ACTION ROUTER
    // =========================

    if (action === "logout") {
      logoutController();
      return;
    }

    if (action === "create-surprise") {
      createSurpriseController();
      return;
    }

    if (action === "purchase-plan") {
      purchaseCreatorPlan(actionBtn.dataset.plan);
      return;
    }

    if (action === "purchase-package") {
      purchaseCreatorPackage(actionBtn.dataset.package);
      return;
    }

    if (action === "update-surprise") {
      updateSurpriseController();
      return;
    }
  });
}

export function showSection(sectionName) {

  document.querySelectorAll(".app-section")
    .forEach(section => {
      section.style.display = "none";
    });

  const active = document.getElementById(`section-${sectionName}`);

  if (active) {
    active.style.display = "block";
  }
}

// =========================
// APP SECTION CONTROLLER
// =========================

export function showAppSection(name) {

  document.querySelectorAll(".app-section")
    .forEach(section => {
      section.style.display = "none";
    });

  const section = document.getElementById(`section-${name}`);

  if (section) {
    section.style.display = "block";
  }

  // =========================
  // LAZY LOAD POR SECCIÓN
  // =========================
  if (name === "creator") {
    loadCreatorDashboardController();
  }

  if (name === "genius") {
    loadGeniusDashboardController();
  }

  if (name === "shopping") {
    loadShoppingController();
  }
}