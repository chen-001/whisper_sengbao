// 主页JavaScript逻辑

let selectedRoom = null;
let selectedRoomHasPassword = false;
let currentSettingRoom = null;
let currentSettingRoomHasPassword = false;

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

    // 功能更新模态框关闭处理
    const updateModal = document.getElementById('updateModal');
    updateModal.addEventListener('click', function(e) {
        if (e.target === updateModal) {
            closeUpdateModal();
        }
    });

    // 密码设置模态框关闭处理
    const passwordModal = document.getElementById('passwordSettingsModal');
    passwordModal.addEventListener('click', function(e) {
        if (e.target === passwordModal) {
            closePasswordSettingsModal();
        }
    });

    // 密码设置表单处理
    const passwordForm = document.getElementById('passwordSettingsForm');
    passwordForm.addEventListener('submit', handlePasswordSettings);

    // 主题切换处理
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // 查看更新公告按钮处理
    const updateAnnouncementBtn = document.getElementById('updateAnnouncementBtn');
    if (updateAnnouncementBtn) {
        updateAnnouncementBtn.addEventListener('click', () => {
            showUpdateModalForce(); // 强制显示更新弹窗
        });
    }

    // 加载保存的主题
    loadTheme();

    // 显示功能更新弹窗
    showUpdateModal();
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
function joinRoom(roomName, hasPassword = false) {
    selectedRoom = roomName;
    selectedRoomHasPassword = hasPassword;
    const modal = document.getElementById('joinModal');
    const passwordGroup = document.getElementById('passwordGroup');
    const roomPasswordInput = document.getElementById('roomPassword');
    
    // 根据是否有密码显示/隐藏密码输入框
    if (hasPassword) {
        passwordGroup.style.display = 'block';
        roomPasswordInput.setAttribute('required', 'required');
    } else {
        passwordGroup.style.display = 'none';
        roomPasswordInput.removeAttribute('required');
        roomPasswordInput.value = '';
    }
    
    modal.classList.add('modal-open');
    
    // 聚焦到用户名输入框
    setTimeout(() => {
        document.getElementById('username').focus();
    }, 100);
}

// 处理加入聊天室表单提交
async function handleJoinRoom(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const roomPassword = document.getElementById('roomPassword').value;
    
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
    
    // 如果聊天室有密码，先验证密码
    if (selectedRoomHasPassword) {
        if (!roomPassword) {
            alert('请输入聊天室密码');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('room_name', selectedRoom);
            formData.append('password', roomPassword);
            
            const response = await fetch('/verify-room-password', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.status !== 'success') {
                alert(result.message || '密码错误');
                return;
            }
        } catch (error) {
            console.error('验证密码错误:', error);
            alert('密码验证失败，请重试');
            return;
        }
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
    selectedRoomHasPassword = false;
    
    // 清空表单
    document.getElementById('username').value = '';
    document.getElementById('roomPassword').value = '';
    
    // 隐藏密码输入框
    const passwordGroup = document.getElementById('passwordGroup');
    passwordGroup.style.display = 'none';
    document.getElementById('roomPassword').removeAttribute('required');
}

// 键盘事件处理
document.addEventListener('keydown', function(e) {
    // ESC键关闭所有模态框
    if (e.key === 'Escape') {
        closeModal();
        closeUpdateModal();
        closePasswordSettingsModal();
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

// 功能更新弹窗相关函数
function showUpdateModal() {
    const currentVersion = '2025.07.22.v1'; // 当前版本号
    const lastShownVersion = localStorage.getItem('lastShownUpdateVersion');
    const dontShowUpdates = localStorage.getItem('dontShowUpdates') === 'true';
    
    // 如果用户选择了不再显示更新或已经看过当前版本，则不显示
    if (dontShowUpdates || lastShownVersion === currentVersion) {
        return;
    }
    
    // 延迟显示弹窗，让页面先加载完成
    setTimeout(() => {
        const updateModal = document.getElementById('updateModal');
        updateModal.classList.add('modal-open');
        
        // 记录已显示过当前版本
        localStorage.setItem('lastShownUpdateVersion', currentVersion);
    }, 1000);
}

function closeUpdateModal() {
    const updateModal = document.getElementById('updateModal');
    updateModal.classList.remove('modal-open');
    
    // 重置复选框状态
    const dontShowCheckbox = document.getElementById('dontShowAgain');
    dontShowCheckbox.checked = false;
}

function toggleDontShowAgain() {
    const dontShowCheckbox = document.getElementById('dontShowAgain');
    if (dontShowCheckbox.checked) {
        localStorage.setItem('dontShowUpdates', 'true');
    } else {
        localStorage.removeItem('dontShowUpdates');
    }
}

// 手动显示功能更新弹窗的函数（调试用）
function showUpdateModalForce() {
    localStorage.removeItem('lastShownUpdateVersion');
    localStorage.removeItem('dontShowUpdates');
    showUpdateModal();
}

// 密码设置相关函数
function openPasswordSettings(roomName, hasPassword) {
    currentSettingRoom = roomName;
    currentSettingRoomHasPassword = hasPassword;
    
    const modal = document.getElementById('passwordSettingsModal');
    const modalTitle = document.getElementById('passwordModalTitle');
    const currentPasswordGroup = document.getElementById('currentPassword');
    const currentPasswordLabel = document.getElementById('currentPasswordLabel');
    
    // 根据是否已有密码调整界面
    if (hasPassword) {
        modalTitle.textContent = '修改聊天室密码';
        currentPasswordGroup.style.display = 'block';
        currentPasswordLabel.style.display = 'block';
        currentPasswordGroup.setAttribute('required', 'required');
    } else {
        modalTitle.textContent = '设置聊天室密码';
        currentPasswordGroup.style.display = 'none';
        currentPasswordLabel.style.display = 'none';
        currentPasswordGroup.removeAttribute('required');
    }
    
    modal.classList.add('modal-open');
    
    // 聚焦到合适的输入框
    setTimeout(() => {
        if (hasPassword) {
            document.getElementById('currentPassword').focus();
        } else {
            document.getElementById('newPassword').focus();
        }
    }, 100);
}

function closePasswordSettingsModal() {
    const modal = document.getElementById('passwordSettingsModal');
    modal.classList.remove('modal-open');
    currentSettingRoom = null;
    currentSettingRoomHasPassword = false;
    
    // 清空表单
    document.getElementById('passwordSettingsForm').reset();
}

async function handlePasswordSettings(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    
    // 验证表单
    if (currentSettingRoomHasPassword && !currentPassword) {
        alert('请输入当前密码');
        return;
    }
    
    if (newPassword && newPassword !== confirmPassword) {
        alert('新密码和确认密码不一致');
        return;
    }
    
    // 如果房间已有密码，先验证当前密码
    if (currentSettingRoomHasPassword) {
        try {
            const verifyFormData = new FormData();
            verifyFormData.append('room_name', currentSettingRoom);
            verifyFormData.append('password', currentPassword);
            
            const verifyResponse = await fetch('/verify-room-password', {
                method: 'POST',
                body: verifyFormData
            });
            
            const verifyResult = await verifyResponse.json();
            
            if (verifyResult.status !== 'success') {
                alert('当前密码错误');
                return;
            }
        } catch (error) {
            console.error('验证当前密码错误:', error);
            alert('验证密码失败，请重试');
            return;
        }
    }
    
    // 设置新密码
    try {
        const formData = new FormData();
        formData.append('room_name', currentSettingRoom);
        formData.append('new_password', newPassword);
        
        const response = await fetch('/set-room-password', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert(result.message);
            closePasswordSettingsModal();
            // 刷新页面以显示更新后的状态
            window.location.reload();
        } else {
            alert(result.message || '设置密码失败');
        }
    } catch (error) {
        console.error('设置密码错误:', error);
        alert('设置密码失败，请重试');
    }
} 