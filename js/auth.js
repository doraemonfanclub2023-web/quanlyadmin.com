import {
    db,
    ref,
    get
} from "./firebase.js";

window.login = async function () {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    try {

        const snapshot =
            await get(ref(db, `users/${username}`));

        if (!snapshot.exists()) {
            alert("Sai tài khoản hoặc mật khẩu!");
            return;
        }

        const user = snapshot.val();

        if (user.password !== password) {
            alert("Sai tài khoản hoặc mật khẩu!");
            return;
        }

        localStorage.setItem(
            "currentUser",
            JSON.stringify(user)
        );

        window.location.href =
            "dashboard.html";

    } catch (err) {

        console.error(err);

        alert(
            "Không thể kết nối Firebase!"
        );
    }
};
