/* ====================================================
   1. KHỞI TẠO DỮ LIỆU BAN ĐẦU TRONG LOCALSTORAGE
   ==================================================== */
// Khởi tạo cố định đúng 2 tài khoản phân quyền khác nhau
if (!localStorage.getItem('users')) {
    const defaultUsers = [
        { username: 'BQT001', password: '123', name: 'Nguyễn Tuấn Khải', role: 'Ban Quản Trị' },
        { username: 'BQT002', password: '123', name: 'Cao Ngọc Duyên', role: 'Admin' }
    ];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
}

/* ====================================================
   2. HÀM XỬ LÝ ĐĂNG NHẬP & ĐĂNG XUẤT
   ==================================================== */
function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('error');

    const userList = JSON.parse(localStorage.getItem('users')) || [];
    const validUser = userList.find(u => u.username === userInp && u.password === passInp);

    if (validUser) {
        localStorage.setItem('currentUser', JSON.stringify(validUser));
        if (errorDiv) errorDiv.style.display = 'none';
        window.location.href = "dashboard.html";
    } else {
        if (errorDiv) errorDiv.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = "index.html";
}

/* ====================================================
   3. CƠ CHẾ ĐỔ DỮ LIỆU ĐỘNG (SPA) + PHÂN QUYỀN TRUY CẬP
   ==================================================== */
const pages = {
    home: `
        <h2>Tổng quan hệ thống</h2>
        <div class="cards">
            <div class="card">
                <h3>👥 Thành viên</h3>
                <h1 id="countMembers">2</h1>
            </div>
            <div class="card">
                <h3>🎁 Mini Game</h3>
                <h1>0</h1>
            </div>
            <div class="card">
                <h3>📢 Thông báo</h3>
                <h1>2</h1>
            </div>
        </div>
        <div class="activity">
            <h3>📋 Hoạt động hệ thống gần đây</h3>
            <ul>
                <li>Hệ thống vận hành ổn định trên nền tảng LocalStorage thời gian thực.</li>
                <li>Cập nhật và đồng bộ hóa tự động dữ liệu nội bộ Dora Fanclub Việt Nam.</li>
            </ul>
        </div>
    `,
    members: `
        <h2>Quản lý thành viên (Tài khoản)</h2>
        <br>
        <div class="account-form-box">
            <h3>➕ Thêm tài khoản quản trị mới</h3>
            <div class="inline-form">
                <input type="text" id="newUsername" placeholder="Mã tài khoản...">
                <input type="password" id="newPassword" placeholder="Mật khẩu...">
                <input type="text" id="newName" placeholder="Họ và tên...">
                <select id="newRole">
                    <option value="Admin">Admin</option>
                    <option value="Ban Quản Trị">Ban Quản Trị</option>
                </select>
                <button onclick="addAccount()" class="btn-create">Tạo tài khoản</button>
            </div>
        </div>

        <div class="table-container">
            <h3>📋 Danh sách tài khoản hệ thống</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Mã Tài Khoản</th>
                        <th>Họ và Tên</th>
                        <th>Chức vụ</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody id="userTableBody">
                    <!-- Dữ liệu render ở đây -->
                </tbody>
            </table>
        </div>
    `,
    game: `
        <h2>Quản lý Mini Game</h2>
        <div class="activity" style="margin-top: 20px;">
            <p>Chức năng quản lý các mini-game Doraemon đang được thiết lập cấu trúc dữ liệu...</p>
        </div>
    `,
    notice: `
        <h2>Quản lý thông báo</h2>
        <div class="activity" style="margin-top: 20px;">
            <p>Chức năng cập nhật, gửi thông báo fanpage đang được kết nối API nội bộ...</p>
        </div>
    `,
    setting: `
        <h2>Cài đặt hệ thống</h2>
        <div class="activity" style="margin-top: 20px;">
            <p>Cấu hình hệ thống sâu, bảo mật biểu mẫu, và dọn dẹp bộ nhớ đệm cache LocalStorage.</p>
        </div>
    `
};

// Hàm hiển thị trang có tích hợp KIỂM TRA QUYỀN TRUY CẬP
function showPage(pageId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Nếu tài khoản hiện tại là Admin mà cố tình bấm vào "Cài đặt hệ thống" (setting)
    if (currentUser && currentUser.role === 'Admin' && pageId === 'setting') {
        alert('⛔ CẢNH BÁO BẢO MẬT:\nTài khoản cấp độ "Admin" không có quyền truy cập vào mục Cài đặt hệ thống!\nVui lòng liên hệ Ban Quản Trị.');
        return; // Chặn đứng hành động, không cho đổi trang
    }

    const contentDiv = document.getElementById('pageContent');
    if (contentDiv && pages[pageId]) {
        contentDiv.innerHTML = pages[pageId];
        
        if (pageId === 'members') { renderUserTable(); }
        if (pageId === 'home') { updateHomeCount(); }
    }
}

/* ====================================================
   4. LOGIC XỬ LÝ QUẢN LÝ TÀI KHOẢN (LOCALSTORAGE)
   ==================================================== */
function renderUserTable() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    
    const userList = JSON.parse(localStorage.getItem('users')) || [];
    tbody.innerHTML = '';

    userList.forEach(user => {
        let actionHTML = `<button onclick="deleteAccount('${user.username}')" class="btn-delete">Xóa</button>`;
        if (user.username === 'BQT001' || user.username === 'BQT002') {
            actionHTML = `<span class="badge-default">Hệ thống</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>${user.username}</strong></td>
                <td>${user.name}</td>
                <td>${user.role}</td>
                <td>${actionHTML}</td>
            </tr>
        `;
    });
}

function addAccount() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const name = document.getElementById('newName').value.trim();
    const role = document.getElementById('newRole').value;

    if (!username || !password || !name) {
        alert('Vui lòng điền đầy đủ thông tin tài khoản!');
        return;
    }

    let userList = JSON.parse(localStorage.getItem('users')) || [];
    if (userList.some(user => user.username === username)) {
        alert('Mã tài khoản này đã tồn tại trên hệ thống!');
        return;
    }

    userList.push({ username, password, name, role });
    localStorage.setItem('users', JSON.stringify(userList));
    alert(`Đã tạo thành công tài khoản ${username}!`);
    renderUserTable();
}

function deleteAccount(username) {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản ${username}?`)) {
        let userList = JSON.parse(localStorage.getItem('users')) || [];
        userList = userList.filter(user => user.username !== username);
        localStorage.setItem('users', JSON.stringify(userList));
        renderUserTable();
    }
}

function updateHomeCount() {
    const countEl = document.getElementById('countMembers');
    if (countEl) {
        const userList = JSON.parse(localStorage.getItem('users')) || [];
        countEl.innerText = userList.length;
    }
}

/* ====================================================
   5. KHỞI CHẠY KHI TẢI TRANG
   ==================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const nameSpan = document.getElementById('userName');
    if (nameSpan) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            nameSpan.innerText = `${currentUser.name} (${currentUser.role})`;
            showPage('home');
        } else {
            window.location.href = "index.html";
        }
    }
});
