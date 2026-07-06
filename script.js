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
import { getDatabase, ref, set, get, child, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
                <div class="card" onclick="window.location.hash='members'; window.showPage('members');" style="cursor:pointer;"><h3>👥 Thành viên quản trị</h3><h1 id="countMembers">...</h1></div>
                <div class="card" onclick="window.location.hash='minigame'; window.showPage('minigame');" style="cursor:pointer;"><h3>🎁 Mini Game</h3><h1 id="countGames">...</h1></div>
                <div class="card" onclick="window.location.hash='notice'; window.showPage('notice');" style="cursor:pointer;"><h3>📢 Thông báo</h3><h1 id="countNotices">...</h1></div>
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
                <div class="inline-form" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <input type="text" id="newUsername" placeholder="Mã tài khoản (VD: BQTFP-08-014)..." style="flex: 1; min-width: 180px;">
                    <input type="text" id="newName" placeholder="Họ và tên..." style="flex: 1; min-width: 150px;">
                    <input type="password" id="newPassword" placeholder="Mật khẩu..." style="flex: 1; min-width: 120px;">
                    <select id="newRole" style="width: 120px;"><option value="Admin">Admin</option><option value="Ban Quản Trị">Ban Quản Trị</option></select>
                    <button onclick="addAccount()" class="btn-create">Tạo tài khoản</button>
                </div>
            </div>
            `}
            <div class="table-container">
                <table class="table">
                    <thead><tr><th>Mã Tài Khoản</th><th>Tên</th><th>Chức vụ</th><th>Thao tác</th></tr></thead>
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
        minigame: `
            <h2>Quản lý cấu trúc Mini Game</h2><br>
            ${userRole === 'Admin' ? '' : `
            <div class="account-form-box" style="margin-bottom: 25px;">
                <h3>➕ Tạo chiến dịch Mini Game mới</h3>
                <div class="inline-form" style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <input type="text" id="gameTitle" placeholder="Tên Mini Game (VD: Vui cùng Doraemon...)" style="flex: 2; min-width: 200px;">
                        <input type="date" id="gameStartDate" style="flex: 1; min-width: 130px;" title="Ngày bắt đầu">
                    </div>
                    <textarea id="gameContent" placeholder="Nội dung giới thiệu chi tiết về sự kiện..."></textarea>
                    <textarea id="gameBtc" placeholder="Danh sách thành viên Ban Tổ Chức (Mỗi người một dòng hoặc ngăn cách dấu phẩy)..."></textarea>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <input type="url" id="gameDocumentUrl" placeholder="Link Công văn thành lập BTC (Drive, Postimg... nếu có)" style="flex: 1; min-width: 200px;">
                        <input type="url" id="gameRulesUrl" placeholder="Link Thể lệ chi tiết chương trình (nếu có)" style="flex: 1; min-width: 200px;">
                    </div>
                    <button onclick="addMiniGame()" class="btn-create" style="align-self: flex-start;">Phát hành Mini Game</button>
                </div>
            </div>
            `}
            
            <div class="game-status-container">
                <h3 style="color: #0284c7; margin-bottom: 10px;">🔥 ĐANG DIỄN RA</h3>
                <div id="activeGamesList" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px;">Đang tải dữ liệu...</div>
                
                <h3 style="color: #64748b; margin-bottom: 10px;">⏳ SẮP DIỄN RA</h3>
                <div id="upcomingGamesList" style="display: flex; flex-direction: column; gap: 15px;">Đang tải dữ liệu...</div>
            </div>
        `,
        gamedetail: `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <button onclick="window.location.hash='minigame'; window.showPage('minigame');" class="btn-create" style="background: #64748b; padding: 6px 12px;">⬅ Quay lại danh sách</button>
                <h2>Chi tiết Mini Game & Ban Tổ Chức</h2>
            </div>
            <div id="gameDetailContent">Đang cấu trúc dữ liệu...</div>
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
                    <button onclick="saveSysSettingOnly()" class="btn-create" style="padding: 8px 15px;">Lưu trạng thái</button>
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
                    <button onclick="saveClubConfigOnly()" class="btn-create" style="align-self: flex-start;">Cập nhật thông tin cấu hình</button>
                </div>
            </div>
            <div class="account-form-box">
                <h3>💾 Sao lưu dữ liệu an toàn (Backup)</h3><br>
                <p style="font-size: 14px; color: #64748b; margin-bottom: 15px;">Tải toàn bộ dữ liệu máy chủ về máy tính dưới định dạng file dữ liệu .json để lưu trữ nội bộ.</p>
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
                        <label style="font-size: 13px; color: #475569;">Họ và tên:</label>
                        <input type="text" id="profileName" placeholder="Nhập họ và tên cá nhân..." style="width: 100%;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 13px; color: #475569;">Chức vụ hệ thống:</label>
                        <input type="text" id="profileRole" readonly style="background-color: #f1f5f9; cursor: not-allowed; width: 100%;">
                    </div>
                    <button onclick="updateProfileName()" class="btn-create" style="margin-top: 5px; align-self: flex-start;">Cập nhật họ tên</button>
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
        if (pageId === 'minigame') window.listenToMiniGames();
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

    onValue(ref(db, 'minigames'), (snapshot) => {
        const countGamesEl = document.getElementById('countGames');
        if (countGamesEl) {
            countGamesEl.innerText = snapshot.exists() ? Object.keys(snapshot.val()).length : '0';
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
    if (currentUser && currentUser.role === 'Admin') return alert('⛔ Bạn không có quyền xóa thông báo này!');
    if (confirm('Xóa thông báo này trên Cloud?')) {
        await remove(ref(db, `notices/${key}`));
    }
}

/* ====================================================
   5B. LOGIC XỬ LÝ MINI GAME (MỚI TÍCH HỢP)
   ==================================================== */
window.addMiniGame = async function() {
    const title = document.getElementById('gameTitle')?.value.trim();
    const startDate = document.getElementById('gameStartDate')?.value;
    const content = document.getElementById('gameContent')?.value.trim();
    const btc = document.getElementById('gameBtc')?.value.trim();
    const docUrl = document.getElementById('gameDocumentUrl')?.value.trim();
    const rulesUrl = document.getElementById('gameRulesUrl')?.value.trim();

    if (!title || !startDate || !content) return alert('Vui lòng nhập tên game, ngày bắt đầu và nội dung giới thiệu!');

    await push(ref(db, 'minigames'), {
        title, startDate, content, btc, docUrl, rulesUrl
    });
    alert('Khởi tạo chiến dịch Mini Game thành công!');
    window.showPage('minigame');
}

window.listenToMiniGames = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userRole = currentUser ? currentUser.role : '';

    onValue(ref(db, 'minigames'), (snapshot) => {
        const activeDiv = document.getElementById('activeGamesList');
        const upcomingDiv = document.getElementById('upcomingGamesList');
        
        if (!activeDiv || !upcomingDiv) return;
        activeDiv.innerHTML = '';
        upcomingDiv.innerHTML = '';

        if (!snapshot.exists()) {
            activeDiv.innerHTML = '<p style="color: #94a3b8; font-style: italic;">Chưa có game nào đang diễn ra.</p>';
            upcomingDiv.innerHTML = '<p style="color: #94a3b8; font-style: italic;">Chưa có game nào sắp diễn ra.</p>';
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        let hasActive = false;
        let hasUpcoming = false;

        snapshot.forEach((childSnapshot) => {
            const key = childSnapshot.key;
            const g = childSnapshot.val();

            const parts = g.startDate.split('-');
            const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : g.startDate;

            const deleteButton = userRole === 'Ban Quản Trị' 
                ? `<button onclick="event.stopPropagation(); deleteMiniGame('${key}')" class="btn-delete" style="padding: 4px 10px; font-size: 11px; background: #ef4444;">Gỡ game</button>` 
                : '';

            const cardHTML = `
                <div class="account-form-box" onclick="window.viewGameDetail('${key}')" style="cursor: pointer; border-left: 4px solid ${g.startDate <= todayStr ? '#0284c7' : '#94a3b8'}; transition: 0.2s; background: #fff;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h4 style="color: #1e293b; font-size: 16px;">🎁 ${g.title}</h4>
                            <p style="font-size: 12px; color: #64748b; margin-top: 4px;">📅 Ngày bắt đầu phát hành: ${formattedDate}</p>
                        </div>
                        ${deleteButton}
                    </div>
                </div>
            `;

            if (g.startDate <= todayStr) {
                activeDiv.innerHTML += cardHTML;
                hasActive = true;
            } else {
                upcomingDiv.innerHTML += cardHTML;
                hasUpcoming = true;
            }
        });

        if (!hasActive) activeDiv.innerHTML = '<p style="color: #94a3b8; font-style: italic;">Chưa có game nào đang diễn ra.</p>';
        if (!hasUpcoming) upcomingDiv.innerHTML = '<p style="color: #94a3b8; font-style: italic;">Chưa có game nào sắp diễn ra.</p>';
    });
}

window.deleteMiniGame = async function(key) {
    if (confirm('Bạn có chắc chắn muốn xóa Mini Game này hoàn toàn trên Cloud đám mây?')) {
        await remove(ref(db, `minigames/${key}`));
    }
}

window.viewGameDetail = async function(key) {
    window.location.hash = `gamedetail?id=${key}`;
    const contentDiv = document.getElementById('pageContent');
    if (!contentDiv) return;

    contentDiv.innerHTML = window.getPageContent('gamedetail');
    const detailBox = document.getElementById('gameDetailContent');

    const snapshot = await get(ref(db, `minigames/${key}`));
    if (!snapshot.exists()) {
        if (detailBox) detailBox.innerHTML = '<p>Dữ liệu Mini Game không tồn tại hoặc đã bị gỡ bỏ.</p>';
        return;
    }

    const g = snapshot.val();
    const parts = g.startDate.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : g.startDate;

    let btcHTML = '<p style="color: #94a3b8; font-style: italic;">Chưa cấu hình danh sách BTC</p>';
    if (g.btc) {
        const btcList = g.btc.split(/[\n,]+/).map(item => item.trim()).filter(item => item);
        btcHTML = `<ul style="margin-left: 20px; color: #334155; line-height: 1.6;">` + 
                  btcList.map(name => `<li>👤 ${name}</li>`).join('') + `</ul>`;
    }

    let docBtn = g.docUrl ? `<a href="${g.docUrl}" target="_blank" class="btn-create" style="background:#10b981; text-decoration:none; display:inline-block; text-align:center;">📋 Xem Công văn thành lập BTC</a>` : '';
    let rulesBtn = g.rulesUrl ? `<a href="${g.rulesUrl}" target="_blank" class="btn-create" style="background:#3b82f6; text-decoration:none; display:inline-block; text-align:center;">📜 Xem Thể lệ chương trình</a>` : '';

    if (detailBox) {
        detailBox.innerHTML = `
            <div class="account-form-box" style="margin-bottom: 20px;">
                <span style="font-size: 12px; background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-weight: bold;">THÔNG TIN SỰ KIỆN</span>
                <h3 style="margin-top: 10px; color: #1e293b; font-size: 20px;">🏆 ${g.title}</h3>
                <p style="font-size: 13px; color: #64748b; margin: 6px 0 15px 0;">📅 Kế hoạch triển khai: ${formattedDate}</p>
                <div style="color: #334155; white-space: pre-line; line-height: 1.6; background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">${g.content}</div>
            </div>

            <div class="account-form-box" style="margin-bottom: 20px;">
                <span style="font-size: 12px; background: #fef3c7; color: #b45309; padding: 4px 8px; border-radius: 4px; font-weight: bold;">BAN TỔ CHỨC (BTC)</span>
                <div style="margin-top: 15px;">${btcHTML}</div>
            </div>

            ${(docBtn || rulesBtn) ? `
            <div class="account-form-box">
                <span style="font-size: 12px; background: #dcfce7; color: #15803d; padding: 4px 8px; border-radius: 4px; font-weight: bold;">TÀI LIỆU ĐÍNH KÈM CHÍNH THỨC</span>
                <div style="display: flex; gap: 12px; margin-top: 15px; flex-wrap: wrap;">
                    ${docBtn}
                    ${rulesBtn}
                </div>
            </div>` : ''}
        `;
    }
}

/* ====================================================
   6. CÁC HÀM XỬ LÝ TRƯỚC ĐÓ ĐƯỢC GIỮ NGUYÊN
   ==================================================== */
window.listenToUserTable = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userRole = currentUser ? currentUser.role : '';

    onValue(ref(db, 'users'), (snapshot) => {
        const tbody = document.getElementById('userTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        snapshot.forEach((childSnapshot) => {
            const u = childSnapshot.val();
            const displayName = u.name || '';
            let actionHTML = '';
            
            if (userRole === 'Admin') {
                actionHTML = `<span class="badge-default" style="color: #94a3b8; font-style: italic;">Không có quyền</span>`;
            } else if (u.username === 'BQT001' || u.username === 'BQT002') {
                actionHTML = `<span style="color: #64748b;">Hệ thống</span>`;
            } else {
                actionHTML = `
                    <div style="display: flex; gap: 6px;">
                        <button onclick="changeUserPassword('${u.username}')" class="btn-create" style="background: #f59e0b; padding: 4px 10px; font-size: 12px;">Đổi MK</button>
                        <button onclick="deleteAccount('${u.username}')" class="btn-delete" style="padding: 4px 10px; font-size: 12px;">Xóa</button>
                    </div>
                `;
            }

            tbody.innerHTML += `
                <tr>
                    <td><strong>${u.username}</strong></td>
                    <td>${displayName}</td>
                    <td>${u.role}</td>
                    <td>${actionHTML}</td>
                </tr>
            `;
        });
    });
}

window.addAccount = async function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.role === 'Admin') return alert('⛔ Bạn không có quyền thêm thành viên mới!');
    const username = document.getElementById('newUsername')?.value.trim();
    const name = document.getElementById('newName')?.value.trim();
    const password = document.getElementById('newPassword')?.value.trim();
    const role = document.getElementById('newRole')?.value;
    if (!username || !password) return alert('Thiếu thông tin tạo tài khoản!');
    await set(ref(db, `users/${username}`), { username, name: name || username, password, role });
    alert('Thêm tài khoản đồng bộ thành công!');
}

window.deleteAccount = async function(username) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.role === 'Admin') return alert('⛔ Bạn không có quyền xóa thành viên này!');
    if (confirm('Xóa tài khoản này khỏi hệ thống đám mây?')) {
        await remove(ref(db, `users/${username}`));
    }
}

window.changeUserPassword = async function(username) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.role === 'Admin') return alert('⛔ Bạn không có quyền chỉnh sửa tài khoản!');
    const newPass = prompt(`Nhập mật khẩu mới cho tài khoản [ ${username} ]:`);
    if (newPass === null) return;
    const cleanPass = newPass.trim();
    if (!cleanPass) return alert('Mật khẩu không được để trống!');
    try {
        await update(ref(db, `users/${username}`), { password: cleanPass });
        alert(`🟢 Đã đổi mật khẩu cho tài khoản ${username} thành công trên Cloud!`);
    } catch (err) { alert('🔴 Lỗi đồng bộ mật khẩu: ' + err.message); }
}

window.loadProfileData = async function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    try {
        const snapshot = await get(ref(db, `users/${currentUser.username}`));
        if (snapshot.exists()) {
            const newestData = snapshot.val();
            if (document.getElementById('profileUsername')) document.getElementById('profileUsername').value = newestData.username;
            if (document.getElementById('profileName')) document.getElementById('profileName').value = newestData.name || '';
            if (document.getElementById('profileRole')) document.getElementById('profileRole').value = newestData.role;
            localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, ...newestData }));
        }
    } catch (err) {
        if (document.getElementById('profileUsername')) document.getElementById('profileUsername').value = currentUser.username;
        if (document.getElementById('profileName')) document.getElementById('profileName').value = currentUser.name || '';
        if (document.getElementById('profileRole')) document.getElementById('profileRole').value = currentUser.role;
    }
}

window.updateProfileName = async function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    const newName = document.getElementById('profileName')?.value.trim();
    if (!newName) return alert('Họ và tên không được để trống!');
    try {
        await update(ref(db, `users/${currentUser.username}`), { name: newName });
        currentUser.name = newName;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        alert('🟢 Đã cập nhật họ và tên cá nhân thành công lên Cloud!');
        const userDisplayEl = document.getElementById('userDisplayName') || document.querySelector('.user-info span');
        if (userDisplayEl) userDisplayEl.innerText = newName;
    } catch (err) { alert('🔴 Lỗi cập nhật dữ liệu: ' + err.message); }
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
    } catch (err) { console.error("Lỗi tải cấu hình hệ thống:", err); }
}

window.saveSysSettingOnly = async function() {
    const maintenance = document.getElementById('sysMaintenance')?.value;
    try {
        await update(ref(db, 'system_config'), { maintenance: maintenance, maintenanceLastUpdated: new Date().toLocaleString() });
        alert('🟢 Đã cập nhật trạng thái bảo trì hệ thống thành công lên Cloud!');
    } catch (err) { alert('🔴 Lỗi cập nhật trạng thái bảo trì: ' + err.message); }
}

window.saveClubConfigOnly = async function() {
    const clubName = document.getElementById('sysClubName')?.value.trim();
    const clubLink = document.getElementById('sysClubLink')?.value.trim();
    if (!clubName || !clubLink) return alert('❌ Vui lòng điền đầy đủ Tên dự án và Đường dẫn Fanpage!');
    try {
        await update(ref(db, 'system_config'), { clubName: clubName, clubLink: clubLink, configLastUpdated: new Date().toLocaleString() });
        alert('🟢 Đã cập nhật cấu hình thông tin Fanclub chung thành công!');
    } catch (err) { alert('🔴 Lỗi cập nhật cấu hình Fanclub: ' + err.message); }
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
        } else { alert('Không có dữ liệu trên Cloud để sao lưu!'); }
    } catch (err) { alert('Lỗi sao lưu hệ thống: ' + err.message); }
}

/* ====================================================
   7. KHỞI CHẠY KHI TẢI TRANG & ĐĂNG KÝ CẤU HÌNH HỆ THỐNG
   ==================================================== */

// Gán các hàm vào window để HTML có thể gọi được qua onclick="..."
window.showPage = showPage;
window.logout = logout;
window.login = login;
window.addAccount = addAccount;
window.deleteAccount = deleteAccount;
window.addNotice = addNotice;
window.deleteNotice = deleteNotice;
window.addMiniGame = addMiniGame;
window.deleteMiniGame = deleteMiniGame;
window.viewGameDetail = viewGameDetail;
window.updateProfileName = updateProfileName;
window.saveSysSettingOnly = saveSysSettingOnly;
window.saveClubConfigOnly = saveClubConfigOnly;
window.backupSystemData = backupSystemData;
window.changeUserPassword = changeUserPassword;

// Khởi chạy các tác vụ khi trang load xong
document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = document.getElementById('username') !== null;
    
    // Nếu không phải trang đăng nhập thì mới chạy các logic dashboard
    if (!isLoginPage) {
        // Tự động load trang chủ khi vào dashboard
        showPage('home'); 

        // Lắng nghe cấu hình hệ thống từ Firebase (Maintenance, Tên club, Favicon...)
        onValue(ref(db, 'system_config'), (snapshot) => {
            if (!snapshot.exists()) return;
            const config = snapshot.val();
            
            const isMaintenance = config.maintenance;
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            // Kiểm tra bảo trì
            if (isMaintenance === 'on' && currentUser && currentUser.role !== 'Ban Quản Trị') {
                alert('🔴 Hệ thống đang trong chế độ bảo trì công cộng. Vui lòng quay lại sau!');
                localStorage.removeItem('currentUser');
                window.location.href = "index.html";
                return;
            }

            // Cập nhật tên thương hiệu trên sidebar
            const brandEl = document.querySelector('.sidebar .brand h3');
            if (brandEl && config.clubName) {
                brandEl.innerHTML = config.clubName.toUpperCase() + "<br>ADMIN";
            }

            // Cập nhật tiêu đề trang web
            if (config.clubName) {
                document.title = `${config.clubName} - Hệ thống quản trị`;
            }

            // Cập nhật Favicon
            const defaultFavicon = "https://i.postimg.cc/Z57X57Gp/Chua-co-ten-(Logo)-(1).png";
            let faviconEl = document.querySelector("link[rel*='icon']");
            if (!faviconEl) {
                faviconEl = document.createElement('link');
                faviconEl.rel = 'shortcut icon';
                faviconEl.type = 'image/x-icon';
                document.head.appendChild(faviconEl);
            }
            faviconEl.href = config.clubIconUrl || defaultFavicon;
        });
    }
});
