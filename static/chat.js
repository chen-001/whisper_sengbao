// 聊天室JavaScript逻辑

class ChatClient {
    constructor() {
        this.ws = null;
        this.username = null;
        this.userId = null;
        this.roomName = window.chatData.roomName;
        this.isConnected = false;
        
        this.init();
    }
    
    init() {
        // 生成唯一用户ID
        this.userId = this.generateUserId();
        
        // 获取DOM元素
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.usersList = document.getElementById('usersList');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.usernameDisplay = document.getElementById('username-display');
        this.usernameModal = document.getElementById('usernameModal');
        this.usernameForm = document.getElementById('usernameForm');
        this.messageForm = document.getElementById('messageForm');
        
        // 绑定事件
        this.bindEvents();
        
        // 尝试从localStorage获取用户名
        const savedUsername = localStorage.getItem('chatUsername');
        if (savedUsername) {
            this.setUsername(savedUsername);
        }
    }
    
    bindEvents() {
        // 用户名表单提交
        this.usernameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('usernameInput').value.trim();
            if (username) {
                this.setUsername(username);
            }
        });
        
        // 消息表单提交
        this.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        
        // 回车发送消息
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    setUsername(username) {
        this.username = username;
        this.usernameDisplay.textContent = username;
        localStorage.setItem('chatUsername', username);
        
        // 隐藏用户名模态框
        this.usernameModal.classList.remove('modal-open');
        
        // 连接WebSocket
        this.connectWebSocket();
    }
    
    connectWebSocket() {
        // 构建WebSocket URL
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${location.host}/ws/${encodeURIComponent(this.roomName)}`;
        
        this.updateConnectionStatus('连接中...', false);
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket连接已建立');
                this.isConnected = true;
                this.updateConnectionStatus('已连接', true);
                
                // 发送用户信息
                this.ws.send(JSON.stringify({
                    username: this.username,
                    user_id: this.userId
                }));
                
                // 启用消息输入
                this.messageInput.disabled = false;
                this.sendButton.disabled = false;
                this.messageInput.focus();
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket连接已关闭');
                this.isConnected = false;
                this.updateConnectionStatus('连接断开', false);
                
                // 禁用消息输入
                this.messageInput.disabled = true;
                this.sendButton.disabled = true;
                
                // 尝试重连
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.connectWebSocket();
                    }
                }, 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket错误:', error);
                this.updateConnectionStatus('连接错误', false);
            };
            
        } catch (error) {
            console.error('创建WebSocket连接失败:', error);
            this.updateConnectionStatus('连接失败', false);
        }
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'message':
                this.displayMessage(data);
                break;
            case 'system':
                this.displaySystemMessage(data.message);
                break;
            case 'user_list':
                this.updateUsersList(data.users);
                break;
            case 'history':
                this.displayHistoryMessages(data.messages);
                break;
        }
    }
    
    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !this.isConnected) {
            return;
        }
        
        // 发送消息
        this.ws.send(JSON.stringify({
            type: 'message',
            message: message,
            timestamp: new Date().toISOString()
        }));
        
        // 清空输入框
        this.messageInput.value = '';
        this.messageInput.focus();
    }
    
    displayMessage(data) {
        const messageEl = this.createMessageElement(data);
        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    displaySystemMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message message-system';
        messageEl.innerHTML = `<div class="message-text">${this.escapeHtml(message)}</div>`;
        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }
    
    displayHistoryMessages(messages) {
        // 清空现有消息
        this.messagesContainer.innerHTML = '';
        
        // 显示历史消息
        messages.forEach(messageData => {
            const messageEl = this.createMessageElement(messageData);
            this.messagesContainer.appendChild(messageEl);
        });
        
        this.scrollToBottom();
    }
    
    createMessageElement(data) {
        const messageEl = document.createElement('div');
        const isOwnMessage = data.username === this.username;
        
        messageEl.className = `message ${isOwnMessage ? 'message-user' : 'message-other'}`;
        
        const timeString = data.timestamp ? this.formatTime(data.timestamp) : '';
        
        messageEl.innerHTML = `
            ${!isOwnMessage ? `<div class="message-username">${this.escapeHtml(data.username)}</div>` : ''}
            <div class="message-text">${this.escapeHtml(data.message)}</div>
            ${timeString ? `<div class="message-time">${timeString}</div>` : ''}
        `;
        
        return messageEl;
    }
    
    updateUsersList(users) {
        this.usersList.innerHTML = '';
        users.forEach(username => {
            const userEl = document.createElement('li');
            userEl.textContent = username;
            if (username === this.username) {
                userEl.style.fontWeight = 'bold';
                userEl.title = '这是您';
            }
            this.usersList.appendChild(userEl);
        });
    }
    
    updateConnectionStatus(status, isConnected) {
        this.connectionStatus.textContent = status;
        this.connectionStatus.className = `status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}`;
    }
    
    scrollToBottom() {
        // 使用requestAnimationFrame确保DOM已更新
        requestAnimationFrame(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        });
    }
    
    formatTime(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// 页面加载完成后初始化聊天客户端
document.addEventListener('DOMContentLoaded', function() {
    window.chatClient = new ChatClient();
});

// 页面卸载时关闭WebSocket连接
window.addEventListener('beforeunload', function() {
    if (window.chatClient && window.chatClient.ws) {
        window.chatClient.ws.close();
    }
}); 