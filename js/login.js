import { loginController } from "./sections/auth.js";



// ======================
// LOGIN
// ======================
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("loginBtn");

    if (btn) {
        btn.addEventListener("click", loginController);
    }
});