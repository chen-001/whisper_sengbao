// 聊天室JavaScript逻辑

class ChatClient {
    constructor() {
        this.ws = null;
        this.username = null;
        this.userId = null;
        this.roomName = window.chatData.roomName;
        this.isConnected = false;
        this.quotedMessage = null;
        this.longPressTimer = null;
        this.longPressDelay = 500; // 长按500毫秒触发
        this.hasMoreMessages = true;
        this.loadingMore = false;
        this.earliestTimestamp = null;
        
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
        this.themeToggle = document.getElementById('themeToggle');
        this.messageContextMenu = document.getElementById('messageContextMenu');
        this.loadMoreContainer = document.getElementById('loadMoreContainer');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        
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

        // 主题切换
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // 上下文菜单事件
        if (this.messageContextMenu) {
            this.messageContextMenu.addEventListener('click', (e) => {
                const action = e.target.closest('.context-menu-item')?.dataset.action;
                if (action === 'quote') {
                    this.handleQuoteMessage();
                }
                this.hideContextMenu();
            });
        }

        // 点击其他地方隐藏上下文菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.message-context-menu')) {
                this.hideContextMenu();
            }
        });

        // 加载更多消息按钮事件
        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', () => {
                this.loadMoreMessages();
            });
        }

        // 加载保存的主题
        this.loadTheme();
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

        // 构建消息对象
        const messageData = {
            type: 'message',
            message: message,
            timestamp: new Date().toISOString()
        };

        // 如果有引用消息，添加引用信息
        if (this.quotedMessage) {
            messageData.quotedMessage = this.quotedMessage;
        }
        
        // 发送消息
        this.ws.send(JSON.stringify(messageData));
        
        // 清空输入框和引用
        this.messageInput.value = '';
        this.clearQuote();
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
        // 清空现有消息（保留加载更多按钮）
        const loadMoreContainer = this.loadMoreContainer;
        this.messagesContainer.innerHTML = '';
        if (loadMoreContainer) {
            this.messagesContainer.appendChild(loadMoreContainer);
        }
        
        // 显示历史消息
        messages.forEach(messageData => {
            const messageEl = this.createMessageElement(messageData);
            this.messagesContainer.appendChild(messageEl);
            
            // 记录最早的时间戳
            if (!this.earliestTimestamp || messageData.timestamp < this.earliestTimestamp) {
                this.earliestTimestamp = messageData.timestamp;
            }
        });
        
        // 检查是否需要显示加载更多按钮
        this.checkShowLoadMore(messages.length);
        
        this.scrollToBottom();
    }
    
    createMessageElement(data) {
        const messageEl = document.createElement('div');
        const isOwnMessage = data.username === this.username;
        
        messageEl.className = `message ${isOwnMessage ? 'message-user' : 'message-other'}`;
        messageEl.dataset.messageId = data.id || Date.now();
        messageEl.dataset.username = data.username;
        messageEl.dataset.messageText = data.message;
        
        const timeString = data.timestamp ? this.formatTime(data.timestamp) : '';
        
        // 构建消息内容
        let messageContent = '';
        
        // 如果有引用消息，显示引用内容
        if (data.quotedMessage) {
            messageContent += `
                <div class="quoted-message">
                    <div class="quoted-username">${this.escapeHtml(data.quotedMessage.username)}</div>
                    <div class="quoted-text">${this.escapeHtml(data.quotedMessage.message)}</div>
                </div>
            `;
        }
        
        messageContent += `
            ${!isOwnMessage ? `<div class="message-username">${this.escapeHtml(data.username)}</div>` : ''}
            <div class="message-text">${this.escapeHtml(data.message)}</div>
            ${timeString ? `<div class="message-time">${timeString}</div>` : ''}
        `;
        
        messageEl.innerHTML = messageContent;
        
        // 绑定长按事件
        this.bindMessageEvents(messageEl);
        
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

    // 主题切换功能
    toggleTheme() {
        const body = document.body;
        const isForestTheme = body.classList.contains('forest-theme');
        
        if (isForestTheme) {
            body.classList.remove('forest-theme');
            this.themeToggle.querySelector('.theme-toggle-icon').textContent = '🌸';
            this.themeToggle.querySelector('.theme-toggle-text').textContent = '森林';
            localStorage.setItem('chatTheme', 'dreamy');
        } else {
            body.classList.add('forest-theme');
            this.themeToggle.querySelector('.theme-toggle-icon').textContent = '🌳';
            this.themeToggle.querySelector('.theme-toggle-text').textContent = '梦幻';
            localStorage.setItem('chatTheme', 'forest');
        }
    }

    // 加载保存的主题
    loadTheme() {
        const savedTheme = localStorage.getItem('chatTheme');
        if (savedTheme === 'forest') {
            document.body.classList.add('forest-theme');
            if (this.themeToggle) {
                this.themeToggle.querySelector('.theme-toggle-icon').textContent = '🌳';
                this.themeToggle.querySelector('.theme-toggle-text').textContent = '梦幻';
            }
        }
    }

    // 绑定消息事件（长按）
    bindMessageEvents(messageEl) {
        let startX, startY;
        
        // 移动端长按
        messageEl.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            
            this.longPressTimer = setTimeout(() => {
                messageEl.classList.add('long-pressing');
                this.showContextMenu(e, messageEl);
            }, this.longPressDelay);
        });

        messageEl.addEventListener('touchmove', (e) => {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const distance = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
            
            // 如果移动距离超过阈值，取消长按
            if (distance > 10) {
                this.cancelLongPress(messageEl);
            }
        });

        messageEl.addEventListener('touchend', () => {
            this.cancelLongPress(messageEl);
        });

        // 桌面端右键点击
        messageEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, messageEl);
        });

        // 桌面端长按（按住鼠标）
        messageEl.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // 左键
                this.longPressTimer = setTimeout(() => {
                    messageEl.classList.add('long-pressing');
                    this.showContextMenu(e, messageEl);
                }, this.longPressDelay);
            }
        });

        messageEl.addEventListener('mouseup', () => {
            this.cancelLongPress(messageEl);
        });

        messageEl.addEventListener('mouseleave', () => {
            this.cancelLongPress(messageEl);
        });
    }

    // 取消长按
    cancelLongPress(messageEl) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        messageEl.classList.remove('long-pressing');
    }

    // 显示上下文菜单
    showContextMenu(event, messageEl) {
        const menu = this.messageContextMenu;
        if (!menu) return;

        // 存储当前选中的消息
        this.selectedMessage = {
            username: messageEl.dataset.username,
            message: messageEl.dataset.messageText,
            element: messageEl
        };

        // 显示菜单
        menu.style.display = 'block';
        
        // 计算位置
        let x, y;
        if (event.touches) {
            // 移动端
            x = event.touches[0].clientX;
            y = event.touches[0].clientY;
        } else {
            // 桌面端
            x = event.clientX;
            y = event.clientY;
        }

        // 调整位置以防止菜单超出屏幕
        const menuRect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (x + menuRect.width > windowWidth) {
            x = windowWidth - menuRect.width - 10;
        }
        if (y + menuRect.height > windowHeight) {
            y = windowHeight - menuRect.height - 10;
        }

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
    }

    // 隐藏上下文菜单
    hideContextMenu() {
        if (this.messageContextMenu) {
            this.messageContextMenu.style.display = 'none';
        }
        this.selectedMessage = null;
    }

    // 处理引用消息
    handleQuoteMessage() {
        if (!this.selectedMessage) return;

        this.quotedMessage = {
            username: this.selectedMessage.username,
            message: this.selectedMessage.message
        };

        // 在输入框上方显示引用预览
        this.showQuotePreview();
        
        // 聚焦到输入框
        this.messageInput.focus();
    }

    // 显示引用预览
    showQuotePreview() {
        // 移除现有的引用预览
        this.clearQuote();

        const quotePreview = document.createElement('div');
        quotePreview.className = 'quote-preview';
        quotePreview.innerHTML = `
            <div class="quoted-message">
                <div class="quoted-username">${this.escapeHtml(this.quotedMessage.username)}</div>
                <div class="quoted-text">${this.escapeHtml(this.quotedMessage.message)}</div>
                <button class="clear-quote-btn" onclick="window.chatClient.clearQuote()">✕</button>
            </div>
        `;

        // 插入到消息输入容器的开头
        const inputContainer = document.querySelector('.message-input-container');
        inputContainer.insertBefore(quotePreview, inputContainer.firstChild);
    }

    // 清除引用
    clearQuote() {
        this.quotedMessage = null;
        const quotePreview = document.querySelector('.quote-preview');
        if (quotePreview) {
            quotePreview.remove();
        }
    }

    // 检查是否显示加载更多按钮
    checkShowLoadMore(messageCount) {
        if (!this.loadMoreContainer) return;
        
        // 如果消息数量达到限制（默认50条），显示加载更多按钮
        if (messageCount >= 50 && this.hasMoreMessages) {
            this.loadMoreContainer.style.display = 'block';
        } else {
            this.loadMoreContainer.style.display = 'none';
        }
    }

    // 加载更多历史消息
    async loadMoreMessages() {
        if (this.loadingMore || !this.hasMoreMessages || !this.earliestTimestamp) {
            return;
        }

        this.loadingMore = true;
        this.setLoadMoreLoading(true);

        try {
            const response = await fetch(`/api/messages/${encodeURIComponent(this.roomName)}?before=${encodeURIComponent(this.earliestTimestamp)}&limit=50`);
            const data = await response.json();

            if (data.status === 'success') {
                const olderMessages = data.messages;
                
                if (olderMessages.length === 0) {
                    // 没有更多消息了
                    this.hasMoreMessages = false;
                    this.loadMoreContainer.style.display = 'none';
                } else {
                    // 将新消息插入到现有消息之前
                    this.prependMessages(olderMessages);
                    
                    // 更新最早时间戳
                    if (olderMessages.length > 0) {
                        this.earliestTimestamp = olderMessages[0].timestamp;
                    }
                    
                    // 如果返回的消息数量少于请求数量，说明没有更多了
                    if (olderMessages.length < 50) {
                        this.hasMoreMessages = false;
                        this.loadMoreContainer.style.display = 'none';
                    }
                }
            } else {
                console.error('加载更多消息失败:', data.message);
                alert('加载更多消息失败，请重试');
            }
        } catch (error) {
            console.error('加载更多消息错误:', error);
            alert('加载更多消息失败，请重试');
        } finally {
            this.loadingMore = false;
            this.setLoadMoreLoading(false);
        }
    }

    // 在消息列表前面插入历史消息
    prependMessages(messages) {
        const scrollContainer = this.messagesContainer;
        const scrollHeight = scrollContainer.scrollHeight;
        const scrollTop = scrollContainer.scrollTop;

        // 创建消息元素并插入到加载更多按钮之后
        messages.forEach(messageData => {
            const messageEl = this.createMessageElement(messageData);
            
            // 插入到加载更多按钮之后
            if (this.loadMoreContainer && this.loadMoreContainer.nextSibling) {
                this.messagesContainer.insertBefore(messageEl, this.loadMoreContainer.nextSibling);
            } else {
                this.messagesContainer.appendChild(messageEl);
            }
        });

        // 保持滚动位置（避免跳动）
        const newScrollHeight = scrollContainer.scrollHeight;
        scrollContainer.scrollTop = scrollTop + (newScrollHeight - scrollHeight);
    }

    // 设置加载更多按钮的加载状态
    setLoadMoreLoading(loading) {
        if (!this.loadMoreBtn) return;

        const loadMoreText = this.loadMoreBtn.querySelector('.load-more-text');
        const loadMoreLoading = this.loadMoreBtn.querySelector('.load-more-loading');

        if (loading) {
            loadMoreText.style.display = 'none';
            loadMoreLoading.style.display = 'inline-flex';
            this.loadMoreBtn.disabled = true;
        } else {
            loadMoreText.style.display = 'inline';
            loadMoreLoading.style.display = 'none';
            this.loadMoreBtn.disabled = false;
        }
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