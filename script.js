function showPage(pageId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // 1. Chặn quyền Admin truy cập vào Cài đặt hệ thống
    if (currentUser && currentUser.role === 'Admin' && pageId === 'setting') {
        alert('⛔ CẢNH BÁO BẢO MẬT:\nTài khoản cấp độ "Admin" không có quyền truy cập vào mục Cài đặt hệ thống!\nVui lòng liên hệ Ban Quản Trị.');
        return;
    }

    const contentDiv = document.getElementById('pageContent');
    if (contentDiv && pages[pageId]) {
        contentDiv.innerHTML = pages[pageId];
        
        // 2. Xử lý render dữ liệu cho từng trang
        if (pageId === 'members') { 
            renderUserTable(); 
        }
        if (pageId === 'home') { 
            renderHomeData(); 
        }
        if (pageId === 'notice') { 
            renderNoticeTable(); 
            
            // XÓA BIỂU MẪU ĐĂNG THÔNG BÁO NẾU LÀ TÀI KHOẢN ADMIN
            if (currentUser && currentUser.role === 'Admin') {
                const formBox = document.querySelector('.account-form-box');
                if (formBox) {
                    formBox.remove(); // Xóa hẳn block "Soạn thông báo mới" khỏi giao diện của Admin
                }
            }
        }
    }
}
