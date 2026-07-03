// 1. CẤU HÌNH CLOUD FIREBASE CỦA BẠN
const firebaseConfig = {
  apiKey: "AIzaSyC-U9L1plaQ6pcP7Iecg4RO0GirBjunISM",
  authDomain: "admin-27099.firebaseapp.com",
  databaseURL: "https://admin-27099-default-rtdb.firebaseio.com", 
  projectId: "admin-27099",
  storageBucket: "admin-27099.firebasestorage.app",
  messagingSenderId: "510976750235",
  appId: "1:510976750235:web:78d3e138d302235a788c3e",
  measurementId: "G-GG545GEB8M"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ====================================================
   2. KHỔI TẠO TÀI KHOẢN GỐC TRÊN CLOUD
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
   3. XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT
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
            
            // KIỂM TRA BẢO TRÌ TRƯỚC KHI CHO ĐĂNG NHẬP
            const configSnapshot = await get(ref(db, 'system_config/maintenance'));
            const isMaintenance = configSnapshot.val();
            
            if (isMaintenance === 'on' && userData.role !== 'Ban Quản Trị') {
                alert('🔴 Hệ thống đang bảo trì, tài khoản Admin tạm thời không thể truy cập!');
                return;
            }

            localStorage.setItem('currentUser', JSON.stringify(userData));
            window.location.href = "dashboard.html";
            return;
        }
    }
    if (errorDiv) errorDiv.style.display = 'block';
}

window.logout = function() {
    localStorage.removeItem('currentUser');
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
                <div class="card"><h3>👥 Thành viên quản trị</h3><h1 id="countMembers">...</h1></div>
                <div class="card"><h3>🎁 Mini Game</h3><h1>0</h1></div>
                <div class="card"><h3>📢 Thông báo</h3><h1 id="countNotices">...</h1></div>
            </div>
            <div class="activity">
                <h3>📋 Hoạt động hệ thống gần đây</h3>
                <ul id="homeNoticeList">Đang kết nối Cloud...</ul>
            </div>
        `,
        members: `
            <h2>Quản lý thành viên (Tài khoản)</h2><br>
            ${userRole === 'Admin' ? '' : `
            <div class="account-form-box">
                <h3>➕ Thêm tài khoản quản trị mới</h3>
                <div class="inline-form">
                    <input type="text" id="newUsername" placeholder="Mã tài khoản...">
                    <input type="password" id="newPassword" placeholder="Mật khẩu...">
                    <select id="newRole"><option value="Admin">Admin</option><option value="Ban Quản Trị">Ban Quản Trị</option></select>
                    <button onclick="addAccount()" class="btn-create">Tạo tài khoản</button>
                </div>
            </div>
            `}
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
        `,
        setting: `
            <h2>Cài đặt hệ thống (Chỉ dành cho Ban Quản Trị)</h2><br>
            <div class="account-form-box" style="margin-bottom: 25px;">
                <h3>🛡️ Trạng thái vận hành đám mây</h3><br>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <label style="font-weight: normal;">Chế độ bảo trì hệ thống công cộng:</label>
                    <select id="sysMaintenance" style="padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
                        <option value="off">🟢 Đang hoạt động bình thường</option>
                        <option value="on">🔴 Bật bảo trì toàn hệ thống</option>
                    </select>
                    <button onclick="saveSysSetting()" class="btn-create" style="padding: 8px 15px;">Lưu trạng thái</button>
                </div>
            </div>

            <div class="account-form-box" style="margin-bottom: 25px;">
                <h3>📝 Cấu hình thông tin Fanclub chung</h3><br>
                <div class="inline-form" style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 13px; color: #475569;">Tên dự án hiển thị:</label>
                        <input type="text" id="sysClubName" value="Doraemon Fanclub" style="width: 100%;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 13px; color: #475569;">Đường dẫn Fanpage chính thức (URL):</label>
                        <input type="text" id="sysClubLink" value="https://facebook.com/" style="width: 100%;">
                    </div>
                    <button onclick="saveSysSetting()" class="btn-create" style="align-self: flex-start;">Cập nhật thông tin cấu hình</button>
                </div>
            </div>

            <div class="account-form-box">
                <h3>💾 Sao lưu dữ liệu an toàn (Backup)</h3><br>
                <p style="font-size: 14px; color: #64748b; margin-bottom: 15px;">Tải toàn bộ dữ liệu máy chủ về máy tính dưới định dạng file dữ liệu .json để lưu trữ nội bộ phòng ngừa sự cố đám mây.</p>
                <button onclick="backupSystemData()" class="btn-create" style="background: #3b82f6;">📥 Xuất file Sao lưu hệ thống</button>
            </div>
        `,
        account: `
            <h2>Thông tin tài khoản cá nhân</h2><br>
            <div class="account-form-box" style="max-width: 500px;">
                <h3>👤 Hồ sơ cá nhân</h3><br>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 13px; color: #475569;">Mã tài khoản:</label>
                        <input type="text" id="profileUsername" readonly style="background-color: #f1f5f9; cursor: not-allowed; width: 100%; font-weight: bold;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 13px; color: #475569;">Chức vụ hệ thống:</label>
                        <input type="text" id="profileRole" readonly style="background-color: #f1f5f9; cursor: not-allowed; width: 100%;">
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 10px 0;">
                    <div style="padding: 10px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; color: #b45309; font-size: 13px;">
                        🔒 <strong>Lưu ý bảo mật:</strong> Để thay đổi thông tin mật khẩu hoặc chỉnh sửa tài khoản, vui lòng liên hệ trực tiếp với người quản lý cấp cao hoặc thực hiện thông qua trang quản trị Cloud.
                    </div>
                </div>
            </div>
        `
    };
    return pages[pageId] || '<h2>Chức năng đang phát triển</h2>';
}

window.showPage = function(pageId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    if (pageId === 'setting' && currentUser.role !== 'Ban Quản Trị') {
        alert('⛔ Bạn không có quyền truy cập vào Cài đặt hệ thống!');
        return;
    }

    const contentDiv = document.getElementById('pageContent');
    if (contentDiv) {
        contentDiv.innerHTML = window.getPageContent(pageId, currentUser.role);
        
        if (pageId === 'home') window.listenToHomeData();
        if (pageId === 'notice') window.listenToNoticeTable();
        if (pageId === 'members') window.listenToUserTable();
        if (pageId === 'setting') window.loadSystemSettings();
        if (pageId === 'account') window.loadProfileData(); 
    }
}

/* ====================================================
   5. ĐỒNG BỘ REALTIME DỮ LIỆU TỰ ĐỘNG TỪ CLOUD
   ==================================================== */
window.listenToHomeData = function() {
    onValue(ref(db, 'users'), (snapshot) => {
        const countMembersEl = document.getElementById('countMembers');
        if (countMembersEl) {
            countMembersEl.innerText = snapshot.exists() ? Object.keys(snapshot.val()).length : '0';
        }
    });

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

window.listenToNoticeTable = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userRole = currentUser ? currentUser.role : '';

    onValue(ref(db, 'notices'), (snapshot) => {
        const tbody = document.getElementById('noticeTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!snapshot.exists()) return;

        snapshot.forEach((childSnapshot) => {
            const key = childSnapshot.key;
            const n = childSnapshot.val();
            
            const actionHTML = userRole === 'Admin' 
                ? `<span class="badge-default" style="color: #94a3b8; font-style: italic;">Không có quyền</span>` 
                : `<button onclick="deleteNotice('${key}')" class="btn-delete">Xóa</button>`;

            tbody.innerHTML = `
                <tr>
                    <td>${n.date}</td>
                    <td><strong>${n.title}</strong></td>
                    <td>${n.content}</td>
                    <td>${actionHTML}</td>
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
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.role === 'Admin') {
        return alert('⛔ Bạn không có quyền xóa thông báo này!');
    }

    if (confirm('Xóa thông báo này trên Cloud?')) {
        await remove(ref(db, `notices/${key}`));
    }
}

window.listenToUserTable = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userRole = currentUser ? currentUser.role : '';

    onValue(ref(db, 'users'), (snapshot) => {
        const tbody = document.getElementById('userTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        snapshot.forEach((childSnapshot) => {
            const u = childSnapshot.val();
            
            let actionHTML = `<button onclick="deleteAccount('${u.username}')" class="btn-delete">Xóa</button>`;
            if (userRole === 'Admin') {
                actionHTML = `<span class="badge-default" style="color: #94a3b8; font-style: italic;">Không có quyền</span>`;
            } else if (u.username === 'BQT001' || u.username === 'BQT002') {
                actionHTML = `<span>Hệ thống</span>`;
            }

            tbody.innerHTML += `<tr><td><strong>${u.username}</strong></td><td>${u.role}</td><td>${actionHTML}</td></tr>`;
        });
    });
}

window.addAccount = async function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.role === 'Admin') {
        return alert('⛔ Bạn không có quyền thêm thành viên mới!');
    }

    const username = document.getElementById('newUsername')?.value.trim();
    const password = document.getElementById('newPassword')?.value.trim();
    const role = document.getElementById('newRole')?.value;
    if (!username || !password) return alert('Thiếu thông tin tạo tài khoản!');

    await set(ref(db, `users/${username}`), { username, password, role });
    alert('Thêm tài khoản đồng bộ thành công!');
}

window.deleteAccount = async function(username) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.role === 'Admin') {
        return alert('⛔ Bạn không có quyền xóa thành viên này!');
    }

    if (confirm('Xóa tài khoản này khỏi hệ thống đám mây?')) {
        await remove(ref(db, `users/${username}`));
    }
}

/* ====================================================
   6. CÁC HÀM XỬ LÝ RIÊNG CHO MỤC CÀI ĐẶT HỆ THỐNG & PROFILE
   ==================================================== */
window.loadProfileData = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    if (document.getElementById('profileUsername')) document.getElementById('profileUsername').value = currentUser.username;
    if (document.getElementById('profileRole')) document.getElementById('profileRole').value = currentUser.role;
}

window.loadSystemSettings = async function() {
    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, 'system_config'));
        if (snapshot.exists()) {
            const config = snapshot.val();
            if (document.getElementById('sysMaintenance')) document.getElementById('sysMaintenance').value = config.maintenance || 'off';
            if (document.getElementById('sysClubName')) document.getElementById('sysClubName').value = config.clubName || 'Doraemon Fanclub';
            if (document.getElementById('sysClubLink')) document.getElementById('sysClubLink').value = config.clubLink || 'https://facebook.com/';
        }
    } catch (err) {
        console.error("Lỗi tải cấu hình hệ thống:", err);
    }
}

window.saveSysSetting = async function() {
    const maintenance = document.getElementById('sysMaintenance')?.value;
    const clubName = document.getElementById('sysClubName')?.value.trim();
    const clubLink = document.getElementById('sysClubLink')?.value.trim();

    if (!clubName || !clubLink) {
        return alert('Vui lòng điền đầy đủ thông tin cấu hình!');
    }

    try {
        await set(ref(db, 'system_config'), {
            maintenance: maintenance,
            clubName: clubName,
            clubLink: clubLink,
            lastUpdated: new Date().toLocaleString()
        });
        alert('🟢 Đã đồng bộ và cập nhật cấu hình hệ thống thành công lên Cloud Firebase!');
    } catch (err) {
        alert('🔴 Lỗi cập nhật hệ thống: ' + err.message);
    }
}

window.backupSystemData = async function() {
    try {
        const snapshot = await get(ref(db));
        if (snapshot.exists()) {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot.val(), null, 4));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "doraemon_fanclub_backup.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        } else {
            alert('Không có dữ liệu trên Cloud để sao lưu!');
        }
    } catch (err) {
        alert('Lỗi sao lưu hệ thống: ' + err.message);
    }
}

/* ====================================================
   7. KHỞI CHẠY KHI TẢI TRANG & ĐĂNG KÝ SỰ KIỆN CLICK MENU ĐỘNG
   ==================================================== */
function forceRenderHomeDirectly() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const contentDiv = document.getElementById('pageContent');
    
    if (currentUser && contentDiv) {
        if (contentDiv.innerHTML.trim() === '' || contentDiv.innerHTML.includes('Đang kết nối Cloud...')) {
            contentDiv.innerHTML = window.getPageContent('home', currentUser.role);
            window.listenToHomeData(); 
            console.log("-> Đã kích hoạt cơ chế Ép Render Trang Chủ Thành Công!");
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = document.getElementById('username') !== null;

    if (isLoginPage) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            window.location.href = "dashboard.html";
            return;
        }
    } else {
        forceRenderHomeDirectly();
        setTimeout(forceRenderHomeDirectly, 100);
        setTimeout(forceRenderHomeDirectly, 400);

        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.addEventListener('click', (e) => {
                const target = e.target.closest('[onclick*="showPage"]');
                if (target) {
                    e.preventDefault();
                    const attr = target.getAttribute('onclick');
                    const match = attr.match(/showPage\(['"]([^'"]+)['"]\)/);
                    if (match && match[1]) {
                        window.showPage(match[1]);
                    }
                }
            });
        }

        onValue(ref(db, 'system_config/maintenance'), (snapshot) => {
            const isMaintenance = snapshot.val();
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            if (isMaintenance === 'on' && currentUser && currentUser.role !== 'Ban Quản Trị') {
                alert('🔴 Hệ thống đang trong chế độ bảo trì công cộng. Vui lòng quay lại sau!');
                localStorage.removeItem('currentUser');
                window.location.href = "index.html";
            }
        });
    }
});
