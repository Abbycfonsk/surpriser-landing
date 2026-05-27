// ======================
// REGISTER
// ======================
function registerController() {
    const name = reg_name.value.trim();
    const email = reg_email.value.trim();
    const password = reg_pass.value.trim();
    const password_confirmation = reg_pass2.value.trim();
    const is_genius = reg_is_genius.checked ? 1 : 0;

    api("POST", "/api/register", {
        name,
        email,
        password,
        password_confirmation,
        is_genius
    })
    .then(r => {
        if (!r.ok) throw new Error(r.text);
        showMsg(r.text);
    })
    .catch(err => showMsg(err.message));
}


// ======================
// FORGOT PASSWORD
// ======================
function forgotPasswordController() {
    const email = fp_email.value.trim();

    api("POST", "/api/forgot-password", { email })
        .then(r => {
            if (!r.ok) throw new Error(r.text);
            showMsg(r.text);
        })
        .catch(err => showMsg(err.message));
}


// ======================
// RESET PASSWORD
// ======================
function resetPasswordController() {
    const token = rp_token.value.trim();
    const email = rp_email.value.trim();
    const password = rp_pass.value.trim();
    const password_confirmation = rp_pass2.value.trim();

    api("POST", "/api/reset-password", {
        token,
        email,
        password,
        password_confirmation
    })
    .then(r => {
        if (!r.ok) throw new Error(r.text);
        showMsg(r.text);
    })
    .catch(err => showMsg(err.message));
}


// ======================
// LOGOUT
// ======================
function logoutController() {
    const token = localStorage.getItem("token");

    api("POST", "/api/logout", null, token)
        .finally(() => {
            localStorage.removeItem("token");
            location.href = "login.html";
        });
}


// ======================
// INDEX CONTROLLER
// ======================
function indexController() {
    const token = localStorage.getItem("token");
    const box = document.getElementById("sessionBox");

    if (!box) return;

    if (!token) {
        box.textContent = "No has iniciado sesión.";
        return;
    }

    box.innerHTML = `
        <p>Ya has iniciado sesión.</p>
        <a class="btn" href="dashboard.html">Ir al Dashboard</a>
        <br><br>
        <button class="btn" onclick="logoutController()">Logout</button>
    `;
}


// ======================
// LOGIN
// ======================
function loginController() {

    const email = document.getElementById("log_email").value.trim();
    const password = document.getElementById("log_pass").value.trim();

    api("POST", "/api/login", { email, password })
        .then(r => {

            if (!r.ok) {
                const out = document.getElementById("output");
                if (out) out.textContent = r.text;
                return;
            }

            const data = r.json;

            if (data?.token) {
                localStorage.setItem("token", data.token);
                location.href = "dashboard.html";
                return;
            }

            const out = document.getElementById("output");
            if (out) out.textContent = JSON.stringify(data, null, 2);
        })
        .catch(err => {
            const out = document.getElementById("output");
            if (out) out.textContent = "Error: " + err.message;
        });
}