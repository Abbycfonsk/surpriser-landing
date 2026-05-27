import { initNavigation } from "./router.js";

import { initCreateSurpriseListeners } from "./sections/creator.js";
import { initUpdateSurpriseListeners } from "./sections/creator.js";

import { loadUserControllerV2 } from "./sections/profile.js";
import { loadAllSurprisesController } from "./sections/home.js";
import { loadDashboardSummaryController } from "./sections/genius.js";
import { loadNotificationsController } from "./sections/genius.js"; // o notifications.js si lo separas luego

import { showAppSection } from "./router.js";

const API = "https://api.surpriser.app";

let surpriseCountdownInterval = null;

document.addEventListener("DOMContentLoaded", dashboardInitV2);

async function dashboardInitV2() {

  const token = localStorage.getItem("token");

  if (!token) {
    location.href = "index.html";
    return;
  }

  // =========================
  // INIT GLOBAL APP BEHAVIOR
  // =========================
  initNavigation();

  initCreateSurpriseListeners();
  initUpdateSurpriseListeners();

  try {

    // =========================
    // LOAD USER FIRST
    // =========================
    await loadUserControllerV2();

    // =========================
    // LOAD INITIAL DATA
    // =========================
    await Promise.all([
      loadAllSurprisesController(),
      loadDashboardSummaryController(),
      loadNotificationsController()
    ]);

    // =========================
    // SHOW INITIAL VIEW
    // =========================
    showAppSection("home");

  } catch (err) {
    console.error(err);
  }
}

function restartCountdowns() {

  if (typeof updateSurpriseCountdowns !== "function") return;

  updateSurpriseCountdowns();

  if (surpriseCountdownInterval) {
    clearInterval(surpriseCountdownInterval);
  }

  surpriseCountdownInterval = setInterval(updateSurpriseCountdowns, 1000);
}