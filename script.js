// Khởi tạo tài khoản mẫu
const defaultUsers = [
    { username: 'BQT001', password: '123', name: 'Nguyễn Tuấn Khải', role: 'Ban Quản Trị' },
    { username: 'BQT002', password: '123', name: 'Cao Ngọc Duyên', role: 'Admin' }
];

// Hàm xử lý đăng nhập
function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('error');

    // Tìm kiếm tài khoản khớp thông tin
    const validUser = defaultUsers.find(u => u.username === userInp && u.password === passInp);

    if (validUser) {
        localStorage.setItem('currentUser', JSON.stringify(validUser));
        if (errorDiv) errorDiv.style.display = 'none';
        window.location.href = "dashboard.html";
    } else {
        if (errorDiv) errorDiv.style.display = 'block';
    }
}

// Hiển thị lời chào khi vào trang quản trị
document.addEventListener('DOMContentLoaded', () => {
    const nameSpan = document.getElementById('userName');
    if (nameSpan) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            nameSpan.innerText = `${currentUser.name} (${currentUser.role})`;
        } else {
            // Nếu chưa đăng nhập mà cố tình vào dashboard, đá ngược ra trang login
            window.location.href = "index.html";
        }
    }
});

// Đăng xuất
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = "index.html";
}
