// ============================================================
// IMPORT FIREBASE
// ============================================================
import { db, ref, get } from "./firebase.js";

// ============================================================
// XỬ LÝ "NHỚ TÔI" - TỰ ĐỘNG ĐIỀN USERNAME
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    // Kiểm tra có username đã lưu không
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
        const usernameInput = document.getElementById("username");
        if (usernameInput) {
            usernameInput.value = savedUsername;
        }
        // Đánh dấu checkbox
        const rememberCheckbox = document.getElementById("rememberMe");
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
        // Tự động focus vào ô mật khẩu
        const passwordInput = document.getElementById("password");
        if (passwordInput) {
            setTimeout(() => passwordInput.focus(), 100);
        }
    }

    // Xử lý phím Enter
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
        passwordInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                document.getElementById("loginBtn")?.click();
            }
        });
    }

    // Gắn sự kiện click cho nút đăng nhập
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", window.login);
    }
});

// ============================================================
// HÀM ĐĂNG NHẬP (CÓ XỬ LÝ "NHỚ TÔI")
// ============================================================
window.login = async function() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const rememberMe = document.getElementById("rememberMe")?.checked || false;
    const errorBox = document.getElementById("errorBox");

    // Reset thông báo lỗi
    if (errorBox) {
        errorBox.textContent = "";
        errorBox.style.display = "none";
    }

    if (!username || !password) {
        if (errorBox) {
            errorBox.textContent = "⚠️ Vui lòng nhập đầy đủ thông tin!";
            errorBox.style.display = "block";
        }
        return;
    }

    try {
        const snapshot = await get(ref(db, `users/${username}`));

        if (!snapshot.exists()) {
            if (errorBox) {
                errorBox.textContent = "❌ Sai tài khoản hoặc mật khẩu!";
                errorBox.style.display = "block";
            }
            return;
        }

        const user = snapshot.val();

        if (user.password !== password) {
            if (errorBox) {
                errorBox.textContent = "❌ Sai tài khoản hoặc mật khẩu!";
                errorBox.style.display = "block";
            }
            return;
        }

        // === XỬ LÝ "NHỚ TÔI" ===
        if (rememberMe) {
            localStorage.setItem("rememberedUsername", username);
        } else {
            localStorage.removeItem("rememberedUsername");
        }

        // Lưu thông tin user hiện tại
        localStorage.setItem("currentUser", JSON.stringify(user));

        // Chuyển đến dashboard
        window.location.href = "dashboard.html";

    } catch (err) {
        console.error("Lỗi đăng nhập:", err);
        if (errorBox) {
            errorBox.textContent = "⚠️ Không thể kết nối Firebase! Vui lòng kiểm tra kết nối mạng.";
            errorBox.style.display = "block";
        }
    }
};

// ============================================================
// ĐĂNG XUẤT (DÙNG CHUNG)
// ============================================================
window.logout = function() {
    localStorage.removeItem("currentUser");
    // Không xóa rememberedUsername để vẫn nhớ username
    window.location.href = "index.html";
};

console.log("✅ auth.js đã tải thành công!");
console.log("🔍 Hàm login đã sẵn sàng!");
