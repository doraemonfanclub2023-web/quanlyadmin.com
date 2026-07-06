import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    set,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyC-U9L1plaQ6pcP7Iecg4RO0GirBjunISM",
    authDomain: "admin-27099.firebaseapp.com",
    databaseURL: "https://admin-27099-default-rtdb.firebaseio.com",
    projectId: "admin-27099",
    storageBucket: "admin-27099.firebasestorage.app",
    messagingSenderId: "510976750235",
    appId: "1:510976750235:web:78d3e138d302235a788c3e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function createDefaultAccounts() {

    const snapshot = await get(ref(db, "users"));

    if (!snapshot.exists()) {

        await set(ref(db, "users"), {

            BQT001: {
                username: "BQT001",
                password: "123",
                name: "Nguyễn Tuấn Khải",
                role: "Ban Quản Trị"
            },

            BQT002: {
                username: "BQT002",
                password: "123",
                name: "Cao Ngọc Duyên",
                role: "Admin"
            }

        });
    }
}

createDefaultAccounts();

window.login = async function () {

    const username =
        document.getElementById("username")?.value.trim();

    const password =
        document.getElementById("password")?.value.trim();

    const error =
        document.getElementById("error");

    if (!username || !password) {
        return;
    }

    try {

        const snapshot =
            await get(ref(db, `users/${username}`));

        if (!snapshot.exists()) {

            if (error) {
                error.style.display = "block";
            }

            return;
        }

        const user = snapshot.val();

        if (user.password !== password) {

            if (error) {
                error.style.display = "block";
            }

            return;
        }

        localStorage.setItem(
            "currentUser",
            JSON.stringify(user)
        );

        window.location.href = "dashboard.html";

    } catch (err) {

        console.error(err);

        alert("Lỗi kết nối Firebase");
    }
};

window.logout = function () {

    localStorage.removeItem("currentUser");

    window.location.href = "index.html";
};

window.addAccount = async function () {

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) {
        return alert("Chưa đăng nhập");
    }

    if (currentUser.role === "Admin") {
        return alert("Không đủ quyền");
    }

    const username =
        document.getElementById("newUsername")?.value.trim();

    const name =
        document.getElementById("newName")?.value.trim();

    const password =
        document.getElementById("newPassword")?.value.trim();

    const role =
        document.getElementById("newRole")?.value;

    if (!username || !password) {
        return alert("Thiếu thông tin");
    }

    const check =
        await get(ref(db, `users/${username}`));

    if (check.exists()) {
        return alert("Tài khoản đã tồn tại");
    }

    await set(ref(db, `users/${username}`), {

        username,
        name,
        password,
        role

    });

    alert("Tạo thành công");
};

window.deleteAccount = async function (username) {

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) return;

    if (currentUser.role === "Admin") {
        return alert("Không đủ quyền");
    }

    if (!confirm("Xóa tài khoản?")) {
        return;
    }

    await remove(ref(db, `users/${username}`));

    alert("Đã xóa");
};

window.loadUsers = function () {

    const tbody =
        document.getElementById("userTableBody");

    if (!tbody) return;

    onValue(ref(db, "users"), (snapshot) => {

        tbody.innerHTML = "";

        snapshot.forEach((child) => {

            const u = child.val();

            tbody.innerHTML += `
                <tr>
                    <td>${u.username}</td>
                    <td>${u.name}</td>
                    <td>${u.role}</td>
                    <td>
                        <button onclick="deleteAccount('${u.username}')">
                            Xóa
                        </button>
                    </td>
                </tr>
            `;
        });
    });
};

document.addEventListener("DOMContentLoaded", () => {

    const userTable =
        document.getElementById("userTableBody");

    if (userTable) {
        loadUsers();
    }
});
