// 主页JavaScript逻辑

let selectedRoom = null;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 创建聊天室表单处理
    const createRoomForm = document.getElementById('createRoomForm');
    createRoomForm.addEventListener('submit', handleCreateRoom);
    
    // 加入聊天室表单处理
    const joinForm = document.getElementById('joinForm');
    joinForm.addEventListener('submit', handleJoinRoom);
    
    // 模态框关闭处理
    const modal = document.getElementById('joinModal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // 主题切换处理
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // 加载保存的主题
    loadTheme();
});

// 处理创建聊天室
async function handleCreateRoom(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const roomName = formData.get('room_name').trim();
    const roomDescription = formData.get('description').trim();
    
    if (!roomName) {
        alert('请输入聊天室名称');
        return;
    }
    
    try {
        const response = await fetch('/create-room', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('聊天室创建成功！');
            // 刷新页面显示新聊天室
            window.location.reload();
        } else {
            alert(result.message || '创建聊天室失败');
        }
    } catch (error) {
        console.error('创建聊天室错误:', error);
        alert('创建聊天室失败，请重试');
    }
}

// 加入聊天室
function joinRoom(roomName) {
    selectedRoom = roomName;
    const modal = document.getElementById('joinModal');
    modal.classList.add('modal-open');
    
    // 聚焦到用户名输入框
    setTimeout(() => {
        document.getElementById('username').focus();
    }, 100);
}

// 处理加入聊天室表单提交
function handleJoinRoom(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    
    if (!username) {
        alert('请输入您的昵称');
        return;
    }
    
    if (username.length > 20) {
        alert('昵称长度不能超过20个字符');
        return;
    }
    
    if (!selectedRoom) {
        alert('请选择一个聊天室');
        return;
    }
    
    // 将用户名保存到localStorage
    localStorage.setItem('chatUsername', username);
    
    // 跳转到聊天室页面
    window.location.href = `/chat/${encodeURIComponent(selectedRoom)}`;
}

// 关闭模态框
function closeModal() {
    const modal = document.getElementById('joinModal');
    modal.classList.remove('modal-open');
    selectedRoom = null;
    
    // 清空表单
    document.getElementById('username').value = '';
}

// 键盘事件处理
document.addEventListener('keydown', function(e) {
    // ESC键关闭模态框
    if (e.key === 'Escape') {
        closeModal();
    }
});

// 主题切换功能
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const isForestTheme = body.classList.contains('forest-theme');
    
    if (isForestTheme) {
        body.classList.remove('forest-theme');
        themeToggle.querySelector('.theme-toggle-icon').textContent = '🌸';
        themeToggle.querySelector('.theme-toggle-text').textContent = '森林';
        localStorage.setItem('chatTheme', 'dreamy');
    } else {
        body.classList.add('forest-theme');
        themeToggle.querySelector('.theme-toggle-icon').textContent = '🌳';
        themeToggle.querySelector('.theme-toggle-text').textContent = '梦幻';
        localStorage.setItem('chatTheme', 'forest');
    }
}

// 加载保存的主题
function loadTheme() {
    const savedTheme = localStorage.getItem('chatTheme');
    const themeToggle = document.getElementById('themeToggle');
    
    if (savedTheme === 'forest') {
        document.body.classList.add('forest-theme');
        if (themeToggle) {
            themeToggle.querySelector('.theme-toggle-icon').textContent = '🌳';
            themeToggle.querySelector('.theme-toggle-text').textContent = '梦幻';
        }
    }
} 