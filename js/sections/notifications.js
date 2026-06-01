export function renderNotifications(notifications) {
    const box = document.getElementById("notifications_list");
    if (!box) return;

    box.innerHTML = notifications.length
        ? notifications.map(n => `
            <div class="mini-item">
                <strong>${n.title}</strong>
                <span>${n.message}</span>
            </div>
        `).join("")
        : "<div>No notifications</div>";
}