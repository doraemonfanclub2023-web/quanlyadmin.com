// 1. CẤU HÌNH CLOUD FIREBASE CỦA BẠN
const firebaseConfig = {
  apiKey: "AIzaSyC-U9L1plaQ6pcP7Iecg4RO0GirBjunISM",
  authDomain: "admin-27099.firebaseapp.com",
  databaseURL: "https://admin-27099-default-rtdb.firebaseio.com", // Đã bổ sung URL kết nối data đám mây
  projectId: "admin-27099",
  storageBucket: "admin-27099.firebasestorage.app",
  messagingSenderId: "510976750235",
  appId: "1:510976750235:web:78d3e138d302235a788c3e",
  measurementId: "G-GG545GEB8M"
};

// Khởi tạo các module kết nối trực tiếp của Firebase qua CDN đám mây
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ====================================================
   2. KHỞI TẠO TÀI KHOẢN GỐC TRÊN CLOUD (CHẠY DUY NHẤT 1 LẦN ĐẦU)
   ==================================================== */
async function initDatabase() {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, 'users'));
    if (!snapshot.exists()) {
        const defaultUsers = {
            "BQT001": { username: 'BQT001', password: '123', name: 'Nguyễn Tuấn Khải', role: 'Ban Quản Trị' },
            "BQT002": { username: 'BQT002', password: '123', name: 'Cao Ngọc Duyên', role: 'Admin' }
        };
        await set(ref(db, 'users'), defaultUsers);
    }
}
initDatabase();

/* ====================================================
   3. XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT (BẢO MẬT PHIÊN BẰNG SESSION)
   ==================================================== */
window.login = async function() {
    const userInp = document.getElementById('username')?.value.trim();
    const passInp = document.getElementById('password')?.value.trim();
    const errorDiv = document.getElementById('error');

    if (!userInp || !passInp) return;

    const snapshot = await get(ref(db, `users/${userInp}`));
    if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.password === passInp) {
            sessionStorage.setItem('currentUser', JSON.stringify(userData));
            window.location.href = "dashboard.html";
            return;
        }
    }
    if (errorDiv) errorDiv.style.display = 'block';
}

window.logout = function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = "index.html";
}

/* ====================================================
   4. SPA ROUTER & RENDER HTML GIAO DIỆN ĐỘNG
   ==================================================== */
window.getPageContent = function(pageId, userRole) {
    const pages = {
        home: `
            <h2>Tổng quan hệ thống</h2>
            <div class="cards">
                <div class="card"><h3>👥 Thành viên</h3><h1 id="countMembers">7</h1></div>
                <div class="card"><h3>🎁 Mini Game</h3><h1>0</h1></div>
                <div class="card"><h3>📢 Thông báo</h3><h1 id="countNotices">0</h1></div>
            </div>
            <div class="activity">
                <h3>📋 Hoạt động hệ thống gần đây</h3>
                <ul id="homeNoticeList">Đang kết nối Cloud...</ul>
            </div>
        `,
        members: `
            <h2>Quản lý thành viên (Tài khoản)</h2><br>
            <div class="account-form-box">
                <h3>➕ Thêm tài khoản quản trị mới</h3>
                <div class="inline-form">
                    <input type="text" id="newUsername" placeholder="Mã tài khoản...">
                    <input type="password" id="newPassword" placeholder="Mật khẩu...">
                    <select id="newRole"><option value="Admin">Admin</option><option value="Ban Quản Trị">Ban Quản Trị</option></select>
                    <button onclick="addAccount()" class="btn-create">Tạo tài khoản</button>
                </div>
            </div>
            <div class="table-container">
                <table class="table">
                    <thead><tr><th>Mã Tài Khoản</th><th>Chức vụ</th><th>Thao tác</th></tr></thead>
                    <tbody id="userTableBody"></tbody>
                </table>
            </div>
        `,
        notice: `
            <h2>Quản lý thông báo</h2><br>
            ${userRole === 'Admin' ? '' : `
            <div class="account-form-box">
                <h3>📝 Soạn thông báo mới</h3>
                <div class="inline-form" style="display: flex; flex-direction: column; gap: 15px;">
                    <input type="text" id="noticeTitle" placeholder="Nhập tiêu đề thông báo...">
                    <textarea id="noticeContent" placeholder="Nhập nội dung..."></textarea>
                    <button onclick="addNotice()" class="btn-create">Đăng thông báo</button>
                </div>
            </div>
            `}
            <div class="table-container">
                <table class="table">
                    <thead><tr><th>Ngày đăng</th><th>Tiêu đề</th><th>Nội dung</th><th>Thao tác</th></tr></thead>
                    <tbody id="noticeTableBody"></tbody>
                </table>
            </div>
        `
    };
    return pages[pageId] || '<h2>Chức năng đang phát triển</h2>';
}

window.showPage = function(pageId) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) return;

    if (currentUser.role === 'Admin' && pageId === 'setting') {
        alert('⛔ Bạn không có quyền truy cập vào Cài đặt hệ thống!');
        return;
    }

    const contentDiv = document.getElementById('pageContent');
    if (contentDiv) {
        contentDiv.innerHTML = getPageContent(pageId, currentUser.role);
        
        if (pageId === 'home') listenToHomeData();
        if (pageId === 'notice') listenToNoticeTable();
        if (pageId === 'members') listenToUserTable();
    }
}

/* ====================================================
   5. ĐỒNG BỘ REALTIME DỮ LIỆU TỰ ĐỘNG TỪ CLOUD (KHÔNG CẦN F5)
   ==================================================== */
function listenToHomeData() {
    onValue(ref(db, 'notices'), (snapshot) => {
        const homeNoticeUl = document.getElementById('homeNoticeList');
        const countNoticesEl = document.getElementById('countNotices');
        if (!homeNoticeUl) return;

        homeNoticeUl.innerHTML = '';
        if (!snapshot.exists()) {
            homeNoticeUl.innerHTML = '<li>Chưa có thông báo nào trên hệ thống đám mây.</li>';
            if (countNoticesEl) countNoticesEl.innerText = '0';
            return;
        }

        const notices = [];
        snapshot.forEach((childSnapshot) => {
            notices.unshift({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        if (countNoticesEl) countNoticesEl.innerText = notices.length;
        notices.forEach(n => {
            homeNoticeUl.innerHTML += `<li><strong>[${n.date}] ${n.title}:</strong> ${n.content}</li>`;
        });
    });
}

function listenToNoticeTable() {
    onValue(ref(db, 'notices'), (snapshot) => {
        const tbody = document.getElementById('noticeTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!snapshot.exists()) return;

        snapshot.forEach((childSnapshot) => {
            const key = childSnapshot.key;
            const n = childSnapshot.val();
            tbody.innerHTML = `
                <tr>
                    <td>${n.date}</td>
                    <td><strong>${n.title}</strong></td>
                    <td>${n.content}</td>
                    <td><button onclick="deleteNotice('${key}')" class="btn-delete">Xóa</button></td>
                </tr>
            ` + tbody.innerHTML;
        });
    });
}

window.addNotice = async function() {
    const title = document.getElementById('noticeTitle')?.value.trim();
    const content = document.getElementById('noticeContent')?.value.trim();
    if (!title || !content) return alert('Vui lòng điền đủ tiêu đề và nội dung!');

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    await push(ref(db, 'notices'), { title, content, date: dateStr });
    alert('Đăng thành công lên Cloud toàn hệ thống!');
}

window.deleteNotice = async function(key) {
    if (confirm('Xóa thông báo này trên Cloud?')) {
        await remove(ref(db, `notices/${key}`));
    }
}

function listenToUserTable() {
    onValue(ref(db, 'users'), (snapshot) => {
        const tbody = document.getElementById('userTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        snapshot.forEach((childSnapshot) => {
            const u = childSnapshot.val();
            let actionHTML = `<button onclick="deleteAccount('${u.username}')" class="btn-delete">Xóa</button>`;
            if (u.username === 'BQT001' || u.username === 'BQT002') actionHTML = `<span>Hệ thống</span>`;

            tbody.innerHTML += `<tr><td><strong>${u.username}</strong></td><td>${u.role}</td><td>${actionHTML}</td></tr>`;
        });
    });
}

window.addAccount = async function() {
    const username = document.getElementById('newUsername')?.value.trim();
    const password = document.getElementById('newPassword')?.value.trim();
    const role = document.getElementById('newRole')?.value;
    if (!username || !password) return alert('Thiếu thông tin tạo tài khoản!');

    await set(ref(db, `users/${username}`), { username, password, role });
    alert('Thêm tài khoản đồng bộ thành công!');
}

window.deleteAccount = async function(username) {
    if (confirm('Xóa tài khoản này khỏi hệ thống đám mây?')) {
        await remove(ref(db, `users/${username}`));
    }
}

// 6. KHỞI CHẠY KHI TẢI TRANG
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const isLoginPage = document.getElementById('username') !== null;

    if (currentUser) {
        if (isLoginPage) window.location.href = "dashboard.html";
        else showPage('home');
    } else {
        if (!isLoginPage) window.location.href = "index.html";
    }
});
