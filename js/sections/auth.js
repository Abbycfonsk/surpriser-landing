import {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword
} from "../services/auth.service.js";


// ======================
// REGISTER
// ======================
export function registerController() {

    const name = reg_name.value.trim();
    const email = reg_email.value.trim();
    const password = reg_pass.value.trim();
    const password_confirmation = reg_pass2.value.trim();
    const is_genius = reg_is_genius.checked ? 1 : 0;

    register({
        name,
        email,
        password,
        password_confirmation,
        is_genius
    })
    .then(r => {

        if (!r.ok) {
            throw new Error(r.text);
        }

        showMsg(r.text || "Registro correcto");

    })
    .catch(err => showMsg(err.message));
}

// ======================
// FORGOT PASSWORD
// ======================
export function forgotPasswordController() {
    const email = fp_email.value.trim();

    forgotPassword( { email })
        .then(r => {
            if (!r.ok) throw new Error(r.text);
            showMsg(r.text);
        })
        .catch(err => showMsg(err.message));
}


// ======================
// RESET PASSWORD
// ======================
export function resetPasswordController() {

    const token = rp_token.value.trim();
    const email = rp_email.value.trim();
    const password = rp_pass.value.trim();
    const password_confirmation = rp_pass2.value.trim();

    resetPassword({
        token,
        email,
        password,
        password_confirmation
    })
    .then(r => {

        if (!r.ok) {
            throw new Error(r.text);
        }

        showMsg(r.text);

    })
    .catch(err => showMsg(err.message));
}


// ======================
// LOGOUT
// ======================
export function logoutController() {

    const token = localStorage.getItem("token");

    logout(token)
        .catch(err => {
            console.error(err);
        })
        .finally(() => {

            localStorage.removeItem("token");
            location.href = "login.html";

        });
}





// ======================
// LOGIN
// ======================
export function loginController() {

    const out = document.getElementById("output");

    const email = document.getElementById("log_email").value.trim();
    const password = document.getElementById("log_pass").value.trim();

    login({ email, password })

        .then(r => {

            if (!r.ok) {
                if (out) out.textContent = r.text;
                return;
            }

            const data = r.json;

            if (data?.token) {

                localStorage.setItem("token", data.token);

                location.href = "dashboard.html";

                return;
            }

            if (out) {
                out.textContent = JSON.stringify(data, null, 2);
            }

        })

        .catch(err => {

            if (out) {
                out.textContent = "Error: " + err.message;
            }

        });
}