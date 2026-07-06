import { db, ref, get } from "./firebase.js";

// ===== ĐĂNG NHẬP =====
window.login = async function() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorBox = document.getElementById("errorBox");

    if (!username || !password) {
        errorBox.textContent = "⚠️ Vui lòng nhập đầy đủ thông tin!";
        return;
    }

    try {
        const snapshot = await get(ref(db, `users/${username}`));

        if (!snapshot.exists()) {
            errorBox.textContent = "❌ Sai tài khoản hoặc mật khẩu!";
            return;
        }

        const user = snapshot.val();

        if (user.password !== password) {
            errorBox.textContent = "❌ Sai tài khoản hoặc mật khẩu!";
            return;
        }

        localStorage.setItem("currentUser", JSON.stringify(user));
        window.location.href = "dashboard.html";

    } catch (err) {
        console.error("Lỗi đăng nhập:", err);
        errorBox.textContent = "⚠️ Không thể kết nối Firebase!";
    }
};

// ===== ĐĂNG XUẤT =====
window.logout = function() {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
};

// ===== XỬ LÝ ENTER =====
document.addEventListener("DOMContentLoaded", function() {
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
        passwordInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                document.getElementById("loginBtn")?.click();
            }
        });
    }

    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", window.login);
    }
});
