import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
// ĐĂNG NHẬP & PHÂN QUYỀN
// ==========================================
onAuthStateChanged(auth, async (user) => {
    const isLoginPage = window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/");
    if (user) {
        try {
            const userSnap = await getDocs(doc(db, "users", user.uid));
            window.currentUser = userSnap.exists() ? { uid: user.uid, ...userSnap.data() } : { uid: user.uid, role: "user", name: "Thành viên" };
        } catch (e) { window.currentUser = { uid: user.uid, role: "user" }; }
        if (isLoginPage) window.location.href = "dashboard.html";
        else {
            const defaultPage = window.location.hash.replace('#', '') || 'home';
            if (typeof window.showPage === 'function') window.showPage(defaultPage);
        }
    } else if (!isLoginPage) {
        window.location.href = "index.html";
    }
});

// Hàm đăng nhập (Đổi tên thành handleLogin để khớp HTML)
window.handleLogin = async function(event) {
    if (event) event.preventDefault();
    const inputCode = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('error');
    
    try {
        await signInWithEmailAndPassword(auth, `${inputCode}@doraadmin.com`, password);
    } catch (error) {
        if (errorDiv) {
            errorDiv.innerText = "❌ Mã tài khoản hoặc mật khẩu không chính xác!";
            errorDiv.style.display = 'block';
        }
    }
};

window.logout = function() {
    signOut(auth).then(() => { window.location.href = "index.html"; });
};

// ==========================================
// RENDER GIAO DIỆN (Sử dụng window.showPage)
// ==========================================
window.showPage = function(page) {
    const container = document.getElementById('pageContent');
    if (!container) return;
    if (unsubscribeDocs) { unsubscribeDocs(); unsubscribeDocs = null; }
    if (unsubscribeTests) { unsubscribeTests(); unsubscribeTests = null; }
    const userRole = (window.currentUser && window.currentUser.role) || 'user';

    // Nội dung chuyển trang (giữ nguyên logic của bồ)
    if (page === 'home') {
        container.innerHTML = `<h2>Tổng quan hệ thống</h2><div class="cards">...</div>`;
    } else if (page === 'documents') {
        container.innerHTML = `<h2>📄 Quản lý Công văn</h2>...`;
        window.loadDocuments();
    } else if (page === 'tests') {
        container.innerHTML = `<h2>✏️ Kiểm tra định kỳ</h2>...`;
        window.loadTests();
    }
};

// Các hàm xử lý dữ liệu (Document & Tests) giữ nguyên như code cũ của bồ...
// Đảm bảo các hàm này đều có window. ở phía trước như:
window.handleCreateDocument = async function(event) { /* ... */ };
window.loadDocuments = function() { /* ... */ };
window.handleCreateTest = async function(event) { /* ... */ };
window.loadTests = function() { /* ... */ };
window.startTakingTest = function(id, title, content) { /* ... */ };
window.handleSubmitAnswer = async function(event) { /* ... */ };
window.handleDeleteData = async function(col, id) { /* ... */ };
