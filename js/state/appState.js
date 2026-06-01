export const state = {

    user: null,
    token: localStorage.getItem("token"),

    surprises: [],
    notifications: [],
    genius: null,
    skills: [],

    ui: {
        countdownInterval: null
    }
};