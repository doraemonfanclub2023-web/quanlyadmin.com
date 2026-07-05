import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// CẤU HÌNH FIREBASE
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

// HÀM ĐĂNG NHẬP (Dùng cho index.html)
window.handleLogin = async function(event) {
    if (event) event.preventDefault();
    const inputCode = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('error');
    
    try {
        await signInWithEmailAndPassword(auth, `${inputCode}@doraadmin.com`, password);
    } catch (error) {
        if (errorDiv) {
            errorDiv.innerText = "❌ Sai mã tài khoản hoặc mật khẩu!";
            errorDiv.style.display = 'block';
        }
    }
};

// HÀM ĐĂNG XUẤT
window.logout = function() {
    signOut(auth).then(() => { window.location.href = "index.html"; });
};

// KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP
onAuthStateChanged(auth, async (user) => {
    const isLoginPage = window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/");
    if (user) {
        if (isLoginPage) window.location.href = "dashboard.html";
    } else {
        if (!isLoginPage) window.location.href = "index.html";
    }
});

// Các hàm khác của bồ giữ nguyên tại đây...
// (Ví dụ: window.showPage, window.loadDocuments, window.loadTests, v.v...)
