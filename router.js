import { state } from "./state/appState.js";

export function initNavigation() {
  document.addEventListener("click", (e) => {
    const sectionBtn = e.target.closest("[data-section]");

    if (sectionBtn) {
      e.preventDefault();
      showAppSection(sectionBtn.dataset.section);
      return;
    }

    const actionBtn = e.target.closest("[data-action]");

    if (!actionBtn) return;

    e.preventDefault();

    const action = actionBtn.dataset.action;

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

    if (action === "surprise-detail") {
      window.openSurpriseDetail?.(actionBtn.dataset.surpriseId);
      return;
    }

    if (action === "open-offer-modal") {
      window.openOfferModal?.(actionBtn.dataset.surpriseId);
      return;
    }

    if (action === "close-offer-modal") {
      window.closeOfferModal?.();
      return;
    }
if (action === "close-owner-cancel-modal") {
  window.closeOwnerCancelModal?.();
  return;
}
if (action === "open-conversation") {
  window.openConversation?.(actionBtn.dataset.conversationId);
  return;
}

if (action === "delete-current-conversation") {
  window.deleteCurrentConversation?.();
  return;
}

if (action === "dashboard-update-profile") {
  window.updateDashboardProfile?.();
  return;
}

if (action === "purchase-genius-plan") {
  window.purchaseGeniusPlan?.(actionBtn.dataset.plan);
  return;
}

if (action === "purchase-genius-package") {
  window.purchaseGeniusPackage?.(actionBtn.dataset.package);
  return;
}
    if (action === "offer-from-detail") {
      window.offerFromDetail?.(actionBtn.dataset.surpriseId);
      return;
    }

    if (action === "creator-detail") {
      window.openCreatorDetail?.(actionBtn.dataset.creatorId);
      return;
    }

    if (action === "owner-surprise-detail") {
      window.openOwnerSurpriseDetail?.(actionBtn.dataset.surpriseId);
      return;
    }

    if (action === "owner-cancel-surprise") {
      window.cancelOwnerSurprise?.(actionBtn.dataset.surpriseId);
      return;
    }

    if (action === "owner-save-surprise") {
      window.saveOwnerSurprise?.(actionBtn.dataset.surpriseId);
      return;
    }

    if (action === "owner-delete-file") {
      window.deleteOwnerFile?.(actionBtn.dataset.fileId);
      return;
    }

    if (action === "owner-preview-image") {
      window.previewOwnerHeaderImage?.();
      return;
    }

    if (action === "update-surprise") {
      updateSurpriseController();
      return;
    }
  });
}

export function showSection(sectionName) {
  showAppSection(sectionName);
}

export function showAppSection(name) {
  document.querySelectorAll(".app-section").forEach(section => {
    section.style.display = "none";
  });

  const section = document.getElementById(`section-${name}`);

  if (section) {
    section.style.display = "block";
  }

  if (name === "creator" && state.user) {
    window.loadOwnerSurprises?.();
  }
if (name === "conversations") {
  window.loadConversations?.();
}

if (name === "user-dashboard") {
  window.loadUserDashboard?.();
}
  if (name === "genius") {
    window.loadGeniusDashboardController?.();
  }

  if (name === "notifications") {
    window.loadNotificationsSection?.();
  }

  if (name === "shopping") {
    window.loadShoppingController?.();
  }
}

export function loadHome() {
  showAppSection("home");
}
