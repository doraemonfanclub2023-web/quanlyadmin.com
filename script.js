import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ==========================================
// 1. CẤU HÌNH FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyC-U9L1plaQ6pcP7Iecg4RO0GirBjunISM",
    authDomain: "admin-27099.firebaseapp.com",
    projectId: "admin-27099",
    storageBucket: "admin-27099.firebasestorage.app",
    messagingSenderId: "510976750235",
    appId: "1:510976750235:web:78d3e138d302235a788c3e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.currentUser = null;
let unsubscribeDocs = null;
let unsubscribeTests = null;

// ==========================================
// 2. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP & PHÂN QUYỀN
// ==========================================
onAuthStateChanged(auth, async (user) => {
    const isLoginPage = window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/");

    if (user) {
        try {
            const userDoc = await getDocs(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                window.currentUser = { uid: user.uid, ...userDoc.data() };
            } else {
                window.currentUser = { uid: user.uid, email: user.email, role: "user", name: user.displayName || "Thành viên" };
            }
        } catch (e) {
            window.currentUser = { uid: user.uid, email: user.email, role: "user", name: "Thành viên" };
        }

        if (isLoginPage) {
            window.location.href = "dashboard.html";
        } else {
            const defaultPage = window.location.hash.replace('#', '') || 'home';
            window.showPage(defaultPage);
        }
    } else {
        if (!isLoginPage) {
            window.location.href = "index.html";
        }
    }
});

// Hàm đăng xuất
window.logout = function() {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    }).catch((error) => {
        alert("Đăng xuất thất bại: " + error.message);
    });
};

// ==========================================
// 3. ĐIỀU HƯỚNG SPA & RENDER GIAO DIỆN CHÍNH
// ==========================================
window.showPage = function(page) {
    const container = document.getElementById('pageContent');
    if (!container) return;

    if (unsubscribeDocs) { unsubscribeDocs(); unsubscribeDocs = null; }
    if (unsubscribeTests) { unsubscribeTests(); unsubscribeTests = null; }

    const userRole = (window.currentUser && window.currentUser.role) || 'user';

    switch (page) {
        case 'home':
            container.innerHTML = `
                <h2>Tổng quan hệ thống</h2>
                <div class="cards">
                    <div class="card"><h3>👥 Thành viên</h3><h1 id="countMembers">-</h1></div>
                    <div class="card" style="border-top-color: #10b981;"><h3>🎁 Mini Game</h3><h1 id="countGames">-</h1></div>
                    <div class="card" style="border-top-color: #f59e0b;"><h3>📄 Công văn</h3><h1 id="countDocs">-</h1></div>
                    <div class="card" style="border-top-color: #ec4899;"><h3>✏️ Bài kiểm tra</h3><h1 id="countTests">-</h1></div>
                </div>
                <div class="activity">
                    <h3>📋 Hoạt động hệ thống gần đây</h3>
                    <ul>
                        <li><b>[Chính thức]</b> Chào mừng bạn đến với Hệ thống Quản trị Đám mây Doraemon Fanclub.</li>
                    </ul>
                </div>
            `;
            break;

        case 'documents':
            container.innerHTML = `
                <h2>📄 Quản lý Công văn</h2>
                ${userRole === 'dev' ? `
                <div class="account-form-box">
                    <h3>Tạo công văn mới (Quyền: Dev)</h3>
                    <form id="docForm" class="inline-form" onsubmit="window.handleCreateDocument(event)">
                        <input type="text" id="docTitle" placeholder="Tiêu đề công văn..." required>
                        <input type="url" id="docLink" placeholder="Liên kết tài liệu (Drive/Spreadsheet)..." required>
                        <button type="submit" class="btn-create">Phát hành</button>
                    </form>
                </div>
                ` : '<p style="color: #64748b; font-style: italic; margin-bottom: 15px;">📌 Danh sách công văn và quyết định chính thức từ Ban quản trị.</p>'}

                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Tiêu đề Công văn</th>
                                <th>Ngày phát hành</th>
                                <th>Liên kết</th>
                                ${userRole === 'dev' ? '<th style="text-align: center;">Thao tác</th>' : ''}
                            </tr>
                        </thead>
                        <tbody id="documentTableBody">
                            <tr><td colspan="${userRole === 'dev' ? 4 : 3}">Đang tải dữ liệu...</td></tr>
                        </tbody>
                    </table>
                </div>
            `;
            window.loadDocuments();
            break;

        case 'tests':
            container.innerHTML = `
                <h2>✏️ Kiểm tra định kỳ</h2>
                ${userRole === 'dev' ? `
                <div class="account-form-box">
                    <h3>Tạo đề kiểm tra mới (Quyền: Dev)</h3>
                    <form id="testForm" class="inline-form" onsubmit="window.handleCreateTest(event)" style="flex-direction: column; gap: 12px; align-items: flex-start;">
                        <input type="text" id="testTitle" placeholder="Tên bài kiểm tra (Ví dụ: Đề dịch thuật số 1)..." required style="width: 100%;">
                        <textarea id="testContent" placeholder="Nhập nội dung đề bài hoặc các câu hỏi tại đây..." rows="5" required style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; resize: vertical;"></textarea>
                        <button type="submit" class="btn-create">Tạo đề bài</button>
                    </form>
                </div>
                ` : '<p style="color: #64748b; font-style: italic; margin-bottom: 15px;">📝 Thành viên chọn bài kiểm tra thích hợp trong danh sách để làm trực tiếp.</p>'}

                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Tên bài kiểm tra</th>
                                <th>Ngày tạo</th>
                                <th style="text-align: center;">Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="testTableBody">
                            <tr><td colspan="3">Đang tải danh sách đề...</td></tr>
                        </tbody>
                    </table>
                </div>

                <div id="examWorkspace" class="account-form-box" style="display: none; margin-top: 35px; border-top: 4px solid #3b82f6;">
                    <h3 id="workspaceTitle" style="color: #2563eb; margin-bottom: 10px;">Đang làm bài</h3>
                    <div style="font-weight: 600; color: #475569; margin-bottom: 5px;"> Đề bài:</div>
                    <div id="workspaceContent" style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px; white-space: pre-wrap; line-height: 1.6; border: 1px solid #e2e8f0;"></div>
                    
                    <form id="submitAnswerForm" onsubmit="window.handleSubmitAnswer(event)">
                        <input type="hidden" id="activeTestId">
                        <div style="font-weight: 600; color: #475569; margin-bottom: 5px;">Bài làm của bạn:</div>
                        <textarea id="userAnswer" placeholder="Nhập câu trả lời hoặc dán phần dịch thuật của bồ vào đây..." rows="8" required style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 15px; font-family: inherit; font-size: 14px; resize: vertical;"></textarea>
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" class="btn-create" style="background: #10b981;">Nộp bài ngay</button>
                            <button type="button" class="btn-delete" style="background: #64748b;" onclick="document.getElementById('examWorkspace').style.display='none'">Thu nhỏ / Hủy</button>
                        </div>
                    </form>
                </div>
            `;
            window.loadTests();
            break;

        default:
            container.innerHTML = `<h2>Trang đang được phát triển</h2>`;
            break;
    }
};

window.addEventListener('hashchange', () => {
    const page = window.location.hash.replace('#', '') || 'home';
    window.showPage(page);
});

// ==========================================
// 4. XỬ LÝ DỮ LIỆU CÔNG VĂN (DOCUMENTS)
// ==========================================
window.handleCreateDocument = async function(event) {
    event.preventDefault();
    const title = document.getElementById('docTitle').value.trim();
    const link = document.getElementById('docLink').value.trim();

    try {
        await addDoc(collection(db, "documents"), {
            title: title,
            link: link,
            createdAt: new Date()
        });
        alert("🎉 Phát hành công văn thành công!");
        document.getElementById('docForm').reset();
    } catch (e) {
        alert("Lỗi khi tạo công văn: " + e.message);
    }
};

window.loadDocuments = function() {
    const tbody = document.getElementById('documentTableBody');
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const userRole = (window.currentUser && window.currentUser.role) || 'user';

    unsubscribeDocs = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="${userRole === 'dev' ? 4 : 3}" style="text-align:center; color:#94a3b8;">Chưa có công văn nào được phát hành.</td></tr>`;
            return;
        }

        let html = "";
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const dateStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : "-";
            
            html += `
                <tr>
                    <td style="font-weight: 500;">${data.title}</td>
                    <td>${dateStr}</td>
                    <td><a href="${data.link}" target="_blank" style="color:#2563eb; text-decoration:underline;">Xem tài liệu 🌐</a></td>
                    ${userRole === 'dev' ? `
                    <td style="text-align: center;">
                        <button class="btn-delete" onclick="window.handleDeleteData('documents', '${docSnap.id}')">Xóa</button>
                    </td>
                    ` : ''}
                </tr>
            `;
        });
        tbody.innerHTML = html;
    });
};

// ==========================================
// 5. XỬ LÝ DỮ LIỆU KIỂM TRA ĐỊNH KỲ (TESTS)
// ==========================================
window.handleCreateTest = async function(event) {
    event.preventDefault();
    const title = document.getElementById('testTitle').value.trim();
    const content = document.getElementById('testContent').value.trim();

    try {
        await addDoc(collection(db, "tests"), {
            title: title,
            content: content,
            createdAt: new Date()
        });
        alert("🎉 Tạo đề kiểm tra thành công!");
        document.getElementById('testForm').reset();
    } catch (e) {
        alert("Lỗi khi tạo đề: " + e.message);
    }
};

window.loadTests = function() {
    const tbody = document.getElementById('testTableBody');
    const q = query(collection(db, "tests"), orderBy("createdAt", "desc"));
    const userRole = (window.currentUser && window.currentUser.role) || 'user';

    unsubscribeTests = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Hiện tại chưa có bài kiểm tra nào.</td></tr>`;
            return;
        }

        let html = "";
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const dateStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : "-";
            
            const safeContent = encodeURIComponent(data.content);
            const safeTitle = encodeURIComponent(data.title);

            html += `
                <tr>
                    <td style="font-weight: 500;">${data.title}</td>
                    <td>${dateStr}</td>
                    <td style="text-align: center; display: flex; gap: 8px; justify-content: center;">
                        <button class="btn-create" style="background:#3b82f6; padding: 6px 12px; font-size:12px;" 
                            onclick="window.startTakingTest('${docSnap.id}', '${safeTitle}', '${safeContent}')">
                            Làm bài ✍️
                        </button>
                        ${userRole === 'dev' ? `
                        <button class="btn-delete" onclick="window.handleDeleteData('tests', '${docSnap.id}')">Xóa đề</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    });
};

window.startTakingTest = function(testId, encodedTitle, encodedContent) {
    const workspace = document.getElementById('examWorkspace');
    if (!workspace) return;

    const title = decodeURIComponent(encodedTitle);
    const content = decodeURIComponent(encodedContent);
    
    workspace.style.display = 'block';
    document.getElementById('workspaceTitle').innerText = `✍️ Đang làm bài: ${title}`;
    document.getElementById('workspaceContent').innerText = content;
    document.getElementById('activeTestId').value = testId;
    document.getElementById('userAnswer').value = ''; 
    
    workspace.scrollIntoView({ behavior: 'smooth' });
};

window.handleSubmitAnswer = async function(event) {
    event.preventDefault();
    const testId = document.getElementById('activeTestId').value;
    const answer = document.getElementById('userAnswer').value.trim();
    
    if (!answer) {
        alert("Hãy điền câu trả lời trước khi nộp bồ ơi!");
        return;
    }

    try {
        await addDoc(collection(db, "test_submissions"), {
            testId: testId,
            userId: window.currentUser.uid,
            userName: window.currentUser.name,
            userEmail: window.currentUser.email,
            answer: answer,
            submittedAt: new Date()
        });
        
        alert("🎉 Bài làm của bồ đã được nộp thành công lên đám mây!");
        document.getElementById('examWorkspace').style.display = 'none';
    } catch (e) {
        alert("Lỗi khi nộp bài: " + e.message);
    }
};

window.handleDeleteData = async function(collectionName, id) {
    if (!confirm("Bồ có chắc chắn muốn xóa vĩnh viễn mục này không?")) return;
    try {
        await deleteDoc(doc(doc(db, collectionName, id)));
        alert("Đã xóa thành công!");
    } catch (e) {
        alert("Lỗi khi xóa dữ liệu: " + e.message);
    }
};

// ==========================================
// 7. XỬ LÝ ĐĂNG NHẬP BẰNG MÃ TÀI KHOẢN NỘI BỘ (ĐÃ FIX THEO Ý BỒ)
// ==========================================
window.handleLogin = async function(event) {
    event.preventDefault();
    
    const inputCode = document.getElementById('username').value.trim().toLowerCase(); // Tự động chuyển chữ thường cho chuẩn
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('error');
    
    if (errorDiv) errorDiv.style.display = 'none';

    // TỰ ĐỘNG THÊM ĐUÔI ẢO ĐỂ LỪA FIREBASE AUTH
    const fakeEmail = `${inputCode}@doraadmin.com`;

    try {
        await signInWithEmailAndPassword(auth, fakeEmail, password);
        alert("🎉 Đăng nhập hệ thống thành công!");
    } catch (error) {
        console.error("Lỗi đăng nhập:", error.message);
        if (errorDiv) {
            errorDiv.innerText = "❌ Mã tài khoản hoặc mật khẩu không chính xác!";
            errorDiv.style.display = 'block';
        }
    }
};
