import { state } from "./state/appState.js";
import { loadSection } from "./main.js";
import { initSurpriseCreate } from "./sections/surpriseCreate.js";
import { loadNotificationsView } from "./sections/notifications.js";
import { loadGeniusDashboardController } from "./sections/genius.js";

export function initNavigation() {
  document.addEventListener("click", async (event) => {
    const sectionButton = event.target.closest("[data-section]");

    if (sectionButton) {
      event.preventDefault();

      await showAppSection(sectionButton.dataset.section);

      return;
    }

    const actionButton = event.target.closest("[data-action]");

    if (!actionButton) return;

    event.preventDefault();

    const action = actionButton.dataset.action;

    if (action === "owner-chat") {
      await window.openConversationForSurprise?.(
        actionButton.dataset.surpriseId,
      );
      return;
    }

    if (action === "logout") {
      await window.logoutController?.();
      return;
    }

    if (action === "purchase-plan") {
      await window.purchaseCreatorPlan?.(actionButton.dataset.plan);
      return;
    }

    if (action === "purchase-package") {
      await window.purchaseCreatorPackage?.(actionButton.dataset.package);
      return;
    }

    if (action === "surprise-detail") {
      await window.openSurpriseDetail?.(actionButton.dataset.surpriseId);
      return;
    }

    if (action === "open-offer-modal") {
      window.openOfferModal?.(actionButton.dataset.surpriseId);
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
      await window.openConversation?.(actionButton.dataset.conversationId);
      return;
    }

    if (action === "delete-current-conversation") {
      await window.deleteCurrentConversation?.();
      return;
    }

    if (action === "dashboard-update-profile") {
      await window.updateDashboardProfile?.();
      return;
    }

    if (action === "purchase-genius-plan") {
      await window.purchaseGeniusPlan?.(actionButton.dataset.plan);
      return;
    }

    if (action === "purchase-genius-package") {
      await window.purchaseGeniusPackage?.(actionButton.dataset.package);
      return;
    }

    if (action === "offer-from-detail") {
      await window.offerFromDetail?.(actionButton.dataset.surpriseId);
      return;
    }

    if (action === "creator-detail") {
      await window.openCreatorDetail?.(actionButton.dataset.creatorId);
      return;
    }

    if (action === "owner-surprise-detail") {
      await window.openOwnerSurpriseDetail?.(actionButton.dataset.surpriseId);
      return;
    }

    if (action === "owner-offers") {
      await window.openOwnerOffers?.(actionButton.dataset.surpriseId);
      return;
    }

    if (action === "owner-cancel-surprise") {
      await window.cancelOwnerSurprise?.(actionButton.dataset.surpriseId);
      return;
    }

    if (action === "owner-save-surprise") {
      await window.saveOwnerSurprise?.(actionButton.dataset.surpriseId);
      return;
    }

    if (action === "owner-delete-file") {
      await window.deleteOwnerFile?.(actionButton.dataset.fileId);
      return;
    }

    if (action === "owner-preview-image") {
      window.previewOwnerHeaderImage?.();
      return;
    }

    if (action === "update-surprise") {
      await window.updateSurpriseController?.();
    }
  });
}

export async function showSection(sectionName) {
  await showAppSection(sectionName);
}

export async function showAppSection(name) {
  document.querySelectorAll(".app-section").forEach((section) => {
    section.style.display = "none";
  });

  const section = document.getElementById(`section-${name}`);

  if (!section) {
    console.warn(`No existe la sección: section-${name}`);
    return;
  }

  if (!section.dataset.loaded) {
    await loadSection(name);
    section.dataset.loaded = "true";
  }

  section.style.display = "block";

  if (name === "home") {
    await window.loadHome?.();
  }

  if (name === "creator") {
    await window.loadOwnerSurprises?.();
  }

  if (name === "create-surprise") {
    await initSurpriseCreate();
  }

  if (name === "notifications") {
    await loadNotificationsView(
      state.user,
      state.token || localStorage.getItem("token"),
    );
  }

  if (name === "conversations") {
    await window.loadConversations?.();
  }

  if (name === "user-dashboard") {
    await window.loadUserDashboard?.();
  }

  if (name === "genius") {
    await loadGeniusDashboardController();
  }

  if (name === "shopping") {
    await window.loadShoppingController?.();
  }

  if (name === "profile") {
    await window.loadProfile?.();
  }
}
