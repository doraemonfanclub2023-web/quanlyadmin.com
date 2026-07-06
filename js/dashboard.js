import { db, ref, get, onValue } from "./firebase.js";

// ===== KIỂM TRA ĐĂNG NHẬP =====
function checkAuth() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
        window.location.href = "index.html";
        return null;
    }
    return user;
}

// ===== HIỂN THỊ TRANG =====
window.showPage = function(pageId) {
    const user = checkAuth();
    if (!user) return;

    // Kiểm tra quyền
    if (pageId === "settings" && user.role !== "Ban Quản Trị") {
        alert("⛔ Bạn không có quyền truy cập Cài đặt!");
        return;
    }

    // Cập nhật active menu
    document.querySelectorAll(".sidebar nav a").forEach(el => el.classList.remove("active"));
    const menuItem = document.querySelector(`.sidebar nav a[data-page="${pageId}"]`);
    if (menuItem) menuItem.classList.add("active");

    // Render nội dung
    const content = document.getElementById("pageContent");
    if (!content) return;

    const pages = {
        home: getHomePage(),
        users: getUsersPage(user),
        notices: getNoticesPage(user),
        settings: getSettingsPage(user),
        profile: getProfilePage(user)
    };

    content.innerHTML = pages[pageId] || "<h2>Trang đang phát triển</h2>";

    // Gọi hàm khởi tạo sau khi render
    if (pageId === "home") loadHomeData();
    if (pageId === "users") loadUsers();
    if (pageId === "notices") loadNotices();
    if (pageId === "settings") loadSettings();
    if (pageId === "profile") loadProfile();
};

// ===== TRANG CHỦ =====
function getHomePage() {
    return `
        <h2>📊 Tổng quan hệ thống</h2>
        <div class="cards">
            <div class="card" onclick="window.showPage('users')" style="cursor:pointer;">
                <h3>👥 Thành viên</h3>
                <h1 id="totalUsers">...</h1>
            </div>
            <div class="card" onclick="window.showPage('notices')" style="cursor:pointer;">
                <h3>📢 Thông báo</h3>
                <h1 id="totalNotices">...</h1>
            </div>
            <div class="card">
                <h3>📄 Văn bản</h3>
                <h1 id="totalDocs">0</h1>
            </div>
        </div>
        <div class="account-form-box">
            <h3>📋 Hoạt động gần đây</h3>
            <div id="recentActivities">Đang tải...</div>
        </div>
    `;
}

function loadHomeData() {
    // Đếm users
    onValue(ref(db, "users"), (snapshot) => {
        const el = document.getElementById("totalUsers");
        if (el) el.textContent = snapshot.exists() ? Object.keys(snapshot.val()).length : "0";
    });

    // Đếm notices
    onValue(ref(db, "notices"), (snapshot) => {
        const el = document.getElementById("totalNotices");
        if (el) el.textContent = snapshot.exists() ? Object.keys(snapshot.val()).length : "0";
    });

    // Hoạt động gần đây
    const activityEl = document.getElementById("recentActivities");
    if (activityEl) {
        activityEl.innerHTML = `
            <p style="color: #64748b; font-size: 14px;">
                🟢 Hệ thống đang hoạt động bình thường<br />
                🔵 Kết nối Firebase: <span style="color:#0284c7;">Thành công</span>
            </p>
        `;
    }
}

// ===== QUẢN LÝ THÀNH VIÊN =====
function getUsersPage(user) {
    const canManage = user.role !== "Admin";

    return `
        <h2>👥 Quản lý thành viên</h2>

        ${canManage ? `
        <div class="account-form-box">
            <h3>➕ Thêm tài khoản mới</h3>
            <div class="inline-form">
                <input type="text" id="newUsername" placeholder="Mã tài khoản" />
                <input type="text" id="newName" placeholder="Họ và tên" />
                <input type="password" id="newPassword" placeholder="Mật khẩu" />
                <select id="newRole">
                    <option value="Admin">Admin</option>
                    <option value="Ban Quản Trị">Ban Quản Trị</option>
                </select>
                <button onclick="window.addAccount()" class="btn-create">Tạo</button>
            </div>
        </div>
        ` : `<p style="color:#94a3b8; margin-bottom:16px;">🔒 Bạn ở chế độ chỉ xem.</p>`}

        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Mã</th>
                        <th>Tên</th>
                        <th>Chức vụ</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody id="userTableBody">
                    <tr><td colspan="4">Đang tải...</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function loadUsers() {
    const tbody = document.getElementById("userTableBody");
    if (!tbody) return;

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const isAdmin = currentUser?.role === "Admin";

    onValue(ref(db, "users"), (snapshot) => {
        tbody.innerHTML = "";

        if (!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="4">Chưa có tài khoản</td></tr>`;
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const u = childSnapshot.val();
            const key = childSnapshot.key;

            let actions = "";
            if (isAdmin) {
                actions = `<span class="badge-default">Chỉ xem</span>`;
            } else if (u.username === "BQT001" || u.username === "BQT002") {
                actions = `<span style="color:#94a3b8;">Hệ thống</span>`;
            } else {
                actions = `
                    <button onclick="window.changePassword('${key}')" class="btn-edit">Đổi MK</button>
                    <button onclick="window.deleteAccount('${key}')" class="btn-delete">Xóa</button>
                `;
            }

            tbody.innerHTML += `
                <tr>
                    <td><strong>${u.username}</strong></td>
                    <td>${u.name || u.username}</td>
                    <td>${u.role || "Admin"}</td>
                    <td>${actions}</td>
                </tr>
            `;
        });
    });
}

// ===== THÊM TÀI KHOẢN =====
window.addAccount = async function() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role === "Admin") {
        alert("⛔ Bạn không có quyền thêm tài khoản!");
        return;
    }

    const username = document.getElementById("newUsername")?.value.trim();
    const name = document.getElementById("newName")?.value.trim();
    const password = document.getElementById("newPassword")?.value.trim();
    const role = document.getElementById("newRole")?.value;

    if (!username || !password) {
        alert("⚠️ Vui lòng nhập Mã và Mật khẩu!");
        return;
    }

    try {
        const check = await get(ref(db, `users/${username}`));
        if (check.exists()) {
            alert("❌ Mã tài khoản đã tồn tại!");
            return;
        }

        await set(ref(db, `users/${username}`), {
            username,
            name: name || username,
            password,
            role: role || "Admin"
        });

        alert("✅ Tạo tài khoản thành công!");

        document.getElementById("newUsername").value = "";
        document.getElementById("newName").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("newRole").value = "Admin";

    } catch (err) {
        console.error(err);
        alert("⚠️ Lỗi khi tạo tài khoản!");
    }
};

// ===== XÓA TÀI KHOẢN =====
window.deleteAccount = async function(username) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role === "Admin") {
        alert("⛔ Bạn không có quyền xóa!");
        return;
    }

    if (username === "BQT001" || username === "BQT002") {
        alert("⛔ Không thể xóa tài khoản hệ thống!");
        return;
    }

    if (!confirm(`Xóa tài khoản "${username}"?`)) return;

    try {
        await remove(ref(db, `users/${username}`));
        alert("✅ Đã xóa thành công!");
    } catch (err) {
        console.error(err);
        alert("⚠️ Lỗi khi xóa!");
    }
};

// ===== ĐỔI MẬT KHẨU =====
window.changePassword = async function(username) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role === "Admin") {
        alert("⛔ Bạn không có quyền đổi mật khẩu!");
        return;
    }

    const newPass = prompt(`Nhập mật khẩu mới cho "${username}":`);
    if (newPass === null) return;

    const cleanPass = newPass.trim();
    if (!cleanPass) {
        alert("⚠️ Mật khẩu không được để trống!");
        return;
    }

    try {
        await update(ref(db, `users/${username}`), { password: cleanPass });
        alert("✅ Đổi mật khẩu thành công!");
    } catch (err) {
        console.error(err);
        alert("⚠️ Lỗi khi đổi mật khẩu!");
    }
};

// ===== THÔNG BÁO =====
function getNoticesPage(user) {
    const canManage = user.role !== "Admin";

    return `
        <h2>📢 Quản lý thông báo</h2>

        ${canManage ? `
        <div class="account-form-box">
            <h3>📝 Đăng thông báo mới</h3>
            <div class="inline-form" style="flex-direction:column; align-items:stretch;">
                <input type="text" id="noticeTitle" placeholder="Tiêu đề..." />
                <textarea id="noticeContent" placeholder="Nội dung..."></textarea>
                <button onclick="window.addNotice()" class="btn-create" style="align-self:flex-start;">Đăng</button>
            </div>
        </div>
        ` : `<p style="color:#94a3b8; margin-bottom:16px;">🔒 Chế độ chỉ xem.</p>`}

        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Tiêu đề</th>
                        <th>Nội dung</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody id="noticeTableBody">
                    <tr><td colspan="4">Đang tải...</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function loadNotices() {
    const tbody = document.getElementById("noticeTableBody");
    if (!tbody) return;

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const isAdmin = currentUser?.role === "Admin";

    onValue(ref(db, "notices"), (snapshot) => {
        tbody.innerHTML = "";

        if (!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="4">Chưa có thông báo</td></tr>`;
            return;
        }

        const notices = [];
        snapshot.forEach((child) => {
            notices.push({ key: child.key, ...child.val() });
        });

        notices.reverse().forEach((n) => {
            const actions = isAdmin
                ? `<span class="badge-default">Chỉ xem</span>`
                : `<button onclick="window.deleteNotice('${n.key}')" class="btn-delete">Xóa</button>`;

            tbody.innerHTML += `
                <tr>
                    <td>${n.date || "N/A"}</td>
                    <td><strong>${n.title}</strong></td>
                    <td>${n.content || ""}</td>
                    <td>${actions}</td>
                </tr>
            `;
        });
    });
}

// ===== ĐĂNG THÔNG BÁO =====
window.addNotice = async function() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role === "Admin") {
        alert("⛔ Bạn không có quyền đăng thông báo!");
        return;
    }

    const title = document.getElementById("noticeTitle")?.value.trim();
    const content = document.getElementById("noticeContent")?.value.trim();

    if (!title || !content) {
        alert("⚠️ Vui lòng nhập tiêu đề và nội dung!");
        return;
    }

    try {
        const today = new Date();
        const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

        await push(ref(db, "notices"), {
            title,
            content,
            date: dateStr,
            author: currentUser.name || currentUser.username
        });

        alert("✅ Đăng thông báo thành công!");
        document.getElementById("noticeTitle").value = "";
        document.getElementById("noticeContent").value = "";

    } catch (err) {
        console.error(err);
        alert("⚠️ Lỗi khi đăng thông báo!");
    }
};

// ===== XÓA THÔNG BÁO =====
window.deleteNotice = async function(key) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || currentUser.role === "Admin") {
        alert("⛔ Bạn không có quyền xóa!");
        return;
    }

    if (!confirm("Xóa thông báo này?")) return;

    try {
        await remove(ref(db, `notices/${key}`));
        alert("✅ Đã xóa!");
    } catch (err) {
        console.error(err);
        alert("⚠️ Lỗi khi xóa!");
    }
};

// ===== CÀI ĐẶT =====
function getSettingsPage(user) {
    if (user.role !== "Ban Quản Trị") {
        return `<h2>⛔ Bạn không có quyền truy cập trang này</h2>`;
    }

    return `
        <h2>⚙️ Cài đặt hệ thống</h2>
        <div class="account-form-box">
            <h3>🛡️ Bảo trì hệ thống</h3>
            <div class="inline-form">
                <select id="maintenanceSelect">
                    <option value="off">🟢 Bình thường</option>
                    <option value="on">🔴 Bảo trì</option>
                </select>
                <button onclick="window.saveSettings()" class="btn-create">Lưu</button>
            </div>
        </div>
        <div class="account-form-box">
            <h3>💾 Sao lưu dữ liệu</h3>
            <button onclick="window.backupData()" class="btn-create" style="background:#3b82f6;">📥 Xuất file backup</button>
        </div>
    `;
}

function loadSettings() {
    const select = document.getElementById("maintenanceSelect");
    if (!select) return;

    get(ref(db, "system_config/maintenance")).then((snapshot) => {
        if (snapshot.exists()) {
            select.value = snapshot.val();
        }
    }).catch(() => {});
}

// ===== LƯU CÀI ĐẶT =====
window.saveSettings = async function() {
    const maintenance = document.getElementById("maintenanceSelect")?.value;

    try {
        await update(ref(db, "system_config"), {
            maintenance: maintenance || "off",
            lastUpdated: new Date().toLocaleString()
        });
        alert("✅ Đã lưu cài đặt!");
    } catch (err) {
        console.error(err);
        alert("⚠️ Lỗi khi lưu!");
    }
};

// ===== BACKUP =====
window.backupData = async function() {
    try {
        const snapshot = await get(ref(db));
        if (!snapshot.exists()) {
            alert("Không có dữ liệu để backup!");
            return;
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
            JSON.stringify(snapshot.val(), null, 4)
        );

        const a = document.createElement("a");
        a.href = dataStr;
        a.download = `backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();

    } catch (err) {
        console.error(err);
        alert("⚠️ Lỗi backup!");
    }
};

// ===== HỒ SƠ CÁ NHÂN =====
function getProfilePage(user) {
    return `
        <h2>👤 Hồ sơ cá nhân</h2>
        <div class="account-form-box" style="max-width:500px;">
            <div class="form-group">
                <label>Mã tài khoản</label>
                <input type="text" id="profileUsername" value="${user.username}" readonly style="background:#f1f5f9;" />
            </div>
            <div class="form-group">
                <label>Họ và tên</label>
                <input type="text" id="profileName" value="${user.name || ""}" />
            </div>
            <div class="form-group">
                <label>Chức vụ</label>
                <input type="text" id="profileRole" value="${user.role}" readonly style="background:#f1f5f9;" />
            </div>
            <button onclick="window.updateProfile()" class="btn-create">Cập nhật</button>
        </div>
    `;
}

function loadProfile() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;

    const nameInput = document.getElementById("profileName");
    if (nameInput) nameInput.value = currentUser.name || "";
}

// ===== CẬP NHẬT HỒ SƠ =====
window.updateProfile = async function() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;

    const name = document.getElementById("profileName")?.value.trim();
    if (!name) {
        alert("⚠️ Họ và tên không được để trống!");
        return;
    }

    try {
        await update(ref(db, `users/${currentUser.username}`), { name });

        currentUser.name = name;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));

        alert("✅ Cập nhật thành công!");

        // Cập nhật hiển thị trên sidebar
        const nameEl = document.querySelector(".user-info .name");
        if (nameEl) nameEl.textContent = name;

    } catch (err) {
        console.error(err);
        alert("⚠️ Lỗi khi cập nhật!");
    }
};

// ===== KHỞI ĐỘNG =====
document.addEventListener("DOMContentLoaded", function() {
    const user = checkAuth();
    if (!user) return;

    // Hiển thị thông tin user trên sidebar
    const nameEl = document.querySelector(".user-info .name");
    const roleEl = document.querySelector(".user-info .role");
    if (nameEl) nameEl.textContent = user.name || user.username;
    if (roleEl) roleEl.textContent = user.role || "Admin";

    // Tự động mở trang chủ
    window.showPage("home");
});
