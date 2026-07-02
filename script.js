/* ====================================================
   1. KHỞI TẠO DỮ LIỆU BAN ĐẦU TRONG LOCALSTORAGE
   ==================================================== */
if (!localStorage.getItem('users')) {
    const defaultUsers = [
        { username: 'BQT001', password: '123', name: 'Nguyễn Tuấn Khải', role: 'Ban Quản Trị' },
        { username: 'BQT002', password: '123', name: 'Cao Ngọc Duyên', role: 'Admin' }
    ];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
}

if (!localStorage.getItem('notices')) {
    const defaultNotices = [
        { id: 1, title: 'Cập nhật hệ thống vận hành', content: 'Hệ thống vận hành ổn định trên nền tảng LocalStorage thời gian thực.', date: '02/07/2026' },
        { id: 2, title: 'Đồng bộ hóa dữ liệu', content: 'Cập nhật và đồng bộ hóa tự động dữ liệu nội bộ Dora Fanclub Việt Nam.', date: '02/07/2026' }
    ];
    localStorage.setItem('notices', JSON.stringify(defaultNotices));
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
                <h1 id="countMembers">7</h1>
            </div>
            <div class="card">
                <h3>🎁 Mini Game</h3>
                <h1>0</h1>
            </div>
            <div class="card">
                <h3>📢 Thông báo</h3>
                <h1 id="countNotices">2</h1>
            </div>
        </div>
        <div class="activity">
            <h3>📋 Hoạt động hệ thống gần đây</h3>
            <ul id="homeNoticeList">
                <!-- Thông báo động hiển thị tại đây -->
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
        <br>
        <div class="account-form-box">
            <h3>📝 Soạn thông báo mới</h3>
            <div class="inline-form" style="display: flex; flex-direction: column; gap: 15px;">
                <input type="text" id="noticeTitle" placeholder="Nhập tiêu đề thông báo..." style="width: 100%;">
                <textarea id="noticeContent" placeholder="Nhập nội dung chi tiết thông báo..." style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; min-height: 80px; font-family: inherit;"></textarea>
                <button onclick="addNotice()" class="btn-create" style="align-self: flex-start; min-width: 150px;">Đăng thông báo</button>
            </div>
        </div>

        <div class="table-container">
            <h3>📋 Nhật ký thông báo đã đăng</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th style="width: 25%;">Ngày đăng</th>
                        <th style="width: 30%;">Tiêu đề</th>
                        <th style="width: 35%;">Nội dung</th>
                        <th style="width: 10%;">Thao tác</th>
                    </tr>
                </thead>
                <tbody id="noticeTableBody">
                    <!-- Danh sách bài đăng thông báo hiển thị ở đây -->
                </tbody>
            </table>
        </div>
    `,
    setting: `
        <h2>Cài đặt hệ thống</h2>
        <div class="activity" style="margin-top: 20px;">
            <p>Cấu hình hệ thống sâu, bảo mật biểu mẫu, và dọn dẹp bộ nhớ đệm cache LocalStorage.</p>
        </div>
    `
};

function showPage(pageId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Chặn quyền Admin vào Cài đặt hệ thống
    if (currentUser && currentUser.role === 'Admin' && pageId === 'setting') {
        alert('⛔ CẢNH BÁO BẢO MẬT:\nTài khoản cấp độ "Admin" không có quyền truy cập vào mục Cài đặt hệ thống!\nVui lòng liên hệ Ban Quản Trị.');
        return;
    }

    const contentDiv = document.getElementById('pageContent');
    if (contentDiv && pages[pageId]) {
        contentDiv.innerHTML = pages[pageId];
        
        if (pageId === 'members') { renderUserTable(); }
        if (pageId === 'home') { renderHomeData(); }
        if (pageId === 'notice') { 
            renderNoticeTable(); 
            
            // XÓA HẲN BIỂU MẪU ĐĂNG NẾU LÀ TÀI KHOẢN ADMIN (Theo ảnh image_6e199e.png)
            if (currentUser && currentUser.role === 'Admin') {
                const formBox = document.querySelector('.account-form-box');
                if (formBox) {
                    formBox.remove();
                }
            }
        }
    }
}

/* ====================================================
   4. LOGIC QUẢN LÝ TÀI KHOẢN
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
                <td>${user.role}</td>
                <td>${actionHTML}</td>
            </tr>
        `;
    });
}

function addAccount() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const role = document.getElementById('newRole').value;

    if (!username || !password) {
        alert('Vui lòng điền đầy đủ Mã tài khoản và Mật khẩu!');
        return;
    }

    let userList = JSON.parse(localStorage.getItem('users')) || [];
    if (userList.some(user => user.username === username)) {
        alert('Mã tài khoản này đã tồn tại trên hệ thống!');
        return;
    }

    userList.push({ username, password, name: 'Thành viên BQT', role });
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

/* ====================================================
   5. LOGIC THÔNG BÁO ĐỘNG
   ==================================================== */
function renderNoticeTable() {
    const tbody = document.getElementById('noticeTableBody');
    if (!tbody) return;

    const noticeList = JSON.parse(localStorage.getItem('notices')) || [];
    tbody.innerHTML = '';

    noticeList.forEach(notice => {
        tbody.innerHTML += `
            <tr>
                <td>${notice.date}</td>
                <td><strong>${notice.title}</strong></td>
                <td>${notice.content}</td>
                <td><button onclick="deleteNotice(${notice.id})" class="btn-delete">Xóa</button></td>
            </tr>
        `;
    });
}

function addNotice() {
    const title = document.getElementById('noticeTitle').value.trim();
    const content = document.getElementById('noticeContent').value.trim();

    if (!title || !content) {
        alert('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!');
        return;
    }

    let noticeList = JSON.parse(localStorage.getItem('notices')) || [];
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    const newNotice = {
        id: Date.now(),
        title: title,
        content: content,
        date: dateStr
    };

    noticeList.unshift(newNotice);
    localStorage.setItem('notices', JSON.stringify(noticeList));
    
    alert('Đăng thông báo hệ thống thành công!');
    renderNoticeTable();
}

function deleteNotice(id) {
    if (confirm('Bạn có chắc muốn xóa thông báo này?')) {
        let noticeList = JSON.parse(localStorage.getItem('notices')) || [];
        noticeList = noticeList.filter(n => n.id !== id);
        localStorage.setItem('notices', JSON.stringify(noticeList));
        renderNoticeTable();
    }
}

function renderHomeData() {
    const countMembersEl = document.getElementById('countMembers');
    if (countMembersEl) countMembersEl.innerText = '7';

    const noticeList = JSON.parse(localStorage.getItem('notices')) || [];
    const countNoticesEl = document.getElementById('countNotices');
    if (countNoticesEl) countNoticesEl.innerText = noticeList.length;

    const homeNoticeUl = document.getElementById('homeNoticeList');
    if (homeNoticeUl) {
        homeNoticeUl.innerHTML = '';
        if (noticeList.length === 0) {
            homeNoticeUl.innerHTML = '<li>Chưa có hoạt động hay thông báo nào trên hệ thống.</li>';
        } else {
            noticeList.forEach(notice => {
                homeNoticeUl.innerHTML += `<li><strong>[${notice.date}] ${notice.title}:</strong> ${notice.content}</li>`;
            });
        }
    }
}

/* ====================================================
   6. KHỞI CHẠY KHI TẢI TRANG (TỐI ƯU CHO GITHUB PAGES)
   ==================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isLoginPage = document.getElementById('username') !== null;

    if (currentUser) {
        if (isLoginPage) {
            window.location.href = "dashboard.html";
        } else {
            showPage('home'); 
        }
    } else {
        if (!isLoginPage) {
            window.location.href = "index.html"; 
        }
    }
});
