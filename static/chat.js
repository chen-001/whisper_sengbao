// 聊天室JavaScript逻辑

class ChatClient {
    constructor() {
        this.ws = null;
        this.username = null;
        this.userId = null;
        this.roomName = window.chatData.roomName;
        this.isConnected = false;
        this.longPressTimer = null;
        this.longPressDelay = 500; // 长按500毫秒触发
        this.hasMoreMessages = true;
        this.loadingMore = false;
        this.earliestTimestamp = null;
        this.notificationsEnabled = false;
        this.isPageVisible = true;
        
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
        this.notificationToggle = document.getElementById('notificationToggle');
        this.notificationStatus = document.getElementById('notificationStatus');
        this.emojiButton = document.getElementById('emojiButton');
        this.emojiPicker = document.getElementById('emojiPicker');
        this.emojiGrid = document.getElementById('emojiGrid');
        this.imageButton = document.getElementById('imageButton');
        this.imageInput = document.getElementById('imageInput');
        this.uploadProgressContainer = document.getElementById('uploadProgressContainer');
        this.uploadPreview = document.getElementById('uploadPreview');
        this.uploadFilename = document.getElementById('uploadFilename');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // 引用功能相关
        this.quotedMessage = null;
        
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化通知设置
        this.initNotifications();
        
        // 监听页面可见性变化
        this.initPageVisibility();
        
        // 初始化表情选择器
        this.initEmojiPicker();
        
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
                // 这里暂时只关闭菜单，后续会重新实现引用功能
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

        // 通知开关事件
        if (this.notificationToggle) {
            this.notificationToggle.addEventListener('click', () => {
                this.toggleNotifications();
            });
        }

        // 表情按钮事件
        if (this.emojiButton) {
            this.emojiButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleEmojiPicker();
            });
        }

        // 点击其他地方关闭表情选择器
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.message-input-container')) {
                this.hideEmojiPicker();
            }
        });

        // 图片上传事件
        if (this.imageButton && this.imageInput) {
            this.imageButton.addEventListener('click', () => {
                this.imageInput.click();
            });

            this.imageInput.addEventListener('change', (e) => {
                const files = e.target.files;
                if (files.length > 0) {
                    // 目前只支持单文件上传
                    this.uploadImage(files[0]);
                }
                // 清空输入，允许重复选择同一文件
                e.target.value = '';
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
                this.emojiButton.disabled = false;
                this.imageButton.disabled = false;
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
                this.emojiButton.disabled = true;
                
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
                // 如果不是自己发送的消息且页面不在前台，发送通知
                if (data.username !== this.username && this.notificationsEnabled && !this.isPageVisible) {
                    this.showNotification(data.username, data.message);
                }
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
        
        // 清空输入框和引用预览
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
            let quotedContent = '';
            if (data.quotedMessage.message_type === 'image') {
                quotedContent = `<img src="${data.quotedMessage.file_path}" alt="${this.escapeHtml(data.quotedMessage.message)}" class="quoted-image">`;
            } else {
                quotedContent = this.escapeHtml(data.quotedMessage.message);
            }
            
            messageContent += `
                <div class="quoted-message clickable-quote" data-quoted-id="${data.quotedMessage.id}" onclick="window.chatClient.scrollToMessage('${data.quotedMessage.id}')">
                    <div class="quoted-header">
                        <span class="quoted-label">回复</span>
                        <span class="quoted-username">@${this.escapeHtml(data.quotedMessage.username)}</span>
                    </div>
                    <div class="quoted-content">${quotedContent}</div>
                </div>
            `;
        }
        
        // 根据消息类型构建内容
        if (data.message_type === 'image') {
            // 图片消息
            messageContent += `
                ${!isOwnMessage ? `<div class="message-username">${this.escapeHtml(data.username)}</div>` : ''}
                <img src="${data.file_path}" alt="${this.escapeHtml(data.message)}" class="message-image" loading="lazy">
                <div class="message-image-filename">${this.escapeHtml(data.message)}</div>
                ${timeString ? `<div class="message-time">${timeString}</div>` : ''}
            `;
        } else {
            // 文本消息
            messageContent += `
                ${!isOwnMessage ? `<div class="message-username">${this.escapeHtml(data.username)}</div>` : ''}
                <div class="message-text">${this.escapeHtml(data.message)}</div>
                ${timeString ? `<div class="message-time">${timeString}</div>` : ''}
            `;
        }
        
        // 添加引用按钮容器
        messageContent += '<div class="message-actions"><button class="quote-btn" title="引用此消息">💬</button></div>';
        
        messageEl.innerHTML = messageContent;
        
        // 绑定引用按钮事件
        const quoteBtn = messageEl.querySelector('.quote-btn');
        if (quoteBtn) {
            // 阻止鼠标事件冒泡到消息元素
            quoteBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
            
            quoteBtn.addEventListener('mouseup', (e) => {
                e.stopPropagation();
            });
            
            quoteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleQuoteMessage(data);
            });
        }
        
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

    // 绑定消息事件（长按和图片点击）
    bindMessageEvents(messageEl) {
        let startX, startY;
        
        // 图片点击事件
        const imageEl = messageEl.querySelector('.message-image');
        if (imageEl) {
            imageEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openImageViewer(imageEl.src, imageEl.alt);
            });
        }
        
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

    // 初始化通知设置
    initNotifications() {
        // 从本地存储加载通知设置
        const savedSetting = localStorage.getItem('chatNotificationsEnabled');
        this.notificationsEnabled = savedSetting === 'true';
        this.updateNotificationUI();
    }

    // 初始化页面可见性监听
    initPageVisibility() {
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
        });

        // 监听窗口焦点变化
        window.addEventListener('focus', () => {
            this.isPageVisible = true;
        });

        window.addEventListener('blur', () => {
            this.isPageVisible = false;
        });
    }

    // 切换通知状态
    async toggleNotifications() {
        if (!this.notificationsEnabled) {
            // 请求通知权限
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    alert('需要开启通知权限才能使用消息通知功能');
                    return;
                }
            } else if (Notification.permission === 'denied') {
                alert('通知权限已被禁止，请在浏览器设置中开启通知权限');
                return;
            }
            
            this.notificationsEnabled = true;
        } else {
            this.notificationsEnabled = false;
        }

        // 保存设置到本地存储
        localStorage.setItem('chatNotificationsEnabled', this.notificationsEnabled.toString());
        
        // 更新UI
        this.updateNotificationUI();
    }

    // 更新通知开关UI
    updateNotificationUI() {
        if (!this.notificationToggle || !this.notificationStatus) return;

        if (this.notificationsEnabled) {
            this.notificationToggle.classList.add('enabled');
            this.notificationStatus.textContent = '开启';
        } else {
            this.notificationToggle.classList.remove('enabled');
            this.notificationStatus.textContent = '关闭';
        }
    }

    // 显示浏览器通知
    showNotification(username, message) {
        if (Notification.permission !== 'granted' || !this.notificationsEnabled) {
            return;
        }

        // 限制消息长度
        const truncatedMessage = message.length > 50 ? message.substring(0, 47) + '...' : message;
        
        const notification = new Notification(`${username} 在 ${this.roomName}`, {
            body: truncatedMessage,
            icon: '/static/favicon.ico', // 如果有图标的话
            tag: 'chat-message', // 相同tag的通知会相互替换
            badge: '💬',
            silent: false
        });

        // 点击通知时聚焦到窗口
        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // 3秒后自动关闭通知
        setTimeout(() => {
            notification.close();
        }, 3000);
    }

    // 初始化表情选择器
    initEmojiPicker() {
        // 表情数据按分类组织
        this.emojiData = {
            smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
            people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤞', '✌️', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃'],
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜'],
            food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞'],
            activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛴', '🚁', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️'],
            travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚁', '🛩️', '✈️', '🛫', '🛬', '🪂', '💺', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚦'],
            objects: ['💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧲', '💣', '🧨', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭'],
            symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐']
        };
        
        this.currentCategory = 'smileys';
        this.renderEmojiGrid();
    }

    // 渲染表情网格
    renderEmojiGrid() {
        if (!this.emojiGrid) return;
        
        const emojis = this.emojiData[this.currentCategory] || [];
        this.emojiGrid.innerHTML = '';
        
        emojis.forEach(emoji => {
            const button = document.createElement('button');
            button.className = 'emoji-item';
            button.textContent = emoji;
            button.addEventListener('click', () => {
                this.insertEmoji(emoji);
            });
            this.emojiGrid.appendChild(button);
        });
    }

    // 切换表情分类
    switchEmojiCategory(category) {
        this.currentCategory = category;
        this.renderEmojiGrid();
        
        // 更新分类按钮状态
        document.querySelectorAll('.emoji-category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
    }

    // 显示/隐藏表情选择器
    toggleEmojiPicker() {
        if (this.emojiPicker.classList.contains('show')) {
            this.hideEmojiPicker();
        } else {
            this.showEmojiPicker();
        }
    }

    showEmojiPicker() {
        this.emojiPicker.classList.add('show');
        
        // 绑定分类按钮事件
        document.querySelectorAll('.emoji-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchEmojiCategory(btn.dataset.category);
            });
        });
    }

    hideEmojiPicker() {
        this.emojiPicker.classList.remove('show');
    }

    // 插入表情到输入框
    insertEmoji(emoji) {
        const input = this.messageInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        
        // 在光标位置插入表情
        const before = text.substring(0, start);
        const after = text.substring(end);
        input.value = before + emoji + after;
        
        // 移动光标到表情后面
        const newPosition = start + emoji.length;
        input.setSelectionRange(newPosition, newPosition);
        
        // 聚焦输入框
        input.focus();
        
        // 隐藏表情选择器
        this.hideEmojiPicker();
    }

    // 图片上传相关方法
    async uploadImage(file) {
        // 验证文件大小 (20MB)
        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('图片大小超过20MB限制！');
            return;
        }

        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('不支持的文件格式！请选择JPG、PNG、GIF或WEBP格式的图片。');
            return;
        }

        // 显示上传预览
        this.showUploadPreview(file);

        try {
            // 创建FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('room_name', this.roomName);
            formData.append('username', this.username);

            // 使用XMLHttpRequest实现上传进度显示
            const xhr = new XMLHttpRequest();
            
            // 上传进度事件
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    this.updateUploadProgress(percentComplete);
                }
            });

            // 上传完成事件
            xhr.addEventListener('load', () => {
                this.hideUploadProgress();
                
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.status === 'success') {
                        // 通过WebSocket通知其他用户
                        this.ws.send(JSON.stringify({
                            type: 'message',
                            message_type: 'image',
                            file_path: response.file_path,
                            filename: response.filename,
                            timestamp: new Date().toISOString()
                        }));
                    } else {
                        alert('上传失败：' + response.message);
                    }
                } else {
                    const error = JSON.parse(xhr.responseText);
                    alert('上传失败：' + (error.detail || '服务器错误'));
                }
            });

            // 上传错误事件
            xhr.addEventListener('error', () => {
                this.hideUploadProgress();
                alert('上传失败：网络错误');
            });

            // 发送请求
            xhr.open('POST', '/upload-image');
            xhr.send(formData);

        } catch (error) {
            this.hideUploadProgress();
            console.error('上传图片错误:', error);
            alert('上传失败：' + error.message);
        }
    }

    showUploadPreview(file) {
        // 显示预览图片
        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // 显示文件名
        this.uploadFilename.textContent = file.name;
        
        // 重置进度
        this.updateUploadProgress(0);
        
        // 显示上传容器
        this.uploadProgressContainer.style.display = 'block';
    }

    updateUploadProgress(percent) {
        this.progressFill.style.width = percent + '%';
        this.progressText.textContent = percent + '%';
    }

    hideUploadProgress() {
        this.uploadProgressContainer.style.display = 'none';
    }

    // 图片查看器
    openImageViewer(imageSrc, imageAlt) {
        // 创建图片查看器模态框
        const viewer = document.createElement('div');
        viewer.className = 'image-viewer-modal';
        viewer.innerHTML = `
            <div class="image-viewer-backdrop" onclick="this.parentElement.remove()">
                <div class="image-viewer-content" onclick="event.stopPropagation()">
                    <img src="${imageSrc}" alt="${imageAlt}" class="viewer-image">
                    <div class="image-viewer-controls">
                        <span class="image-viewer-filename">${imageAlt}</span>
                        <button class="image-viewer-close" onclick="this.closest('.image-viewer-modal').remove()">×</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(viewer);

        // ESC键关闭
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                viewer.remove();
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
    }

    // 引用功能相关方法
    handleQuoteMessage(messageData) {
        // 检查传入的数据
        if (!messageData || !messageData.username || !messageData.message) {
            console.error('引用消息数据不完整:', messageData);
            return;
        }
        
        // 保存被引用的消息信息
        this.quotedMessage = {
            id: messageData.id || Date.now(),
            username: messageData.username,
            message: messageData.message,
            message_type: messageData.message_type || 'text',
            file_path: messageData.file_path
        };

        // 显示引用预览
        this.showQuotePreview();
        
        // 聚焦到输入框
        this.messageInput.focus();
        
        // 滚动到输入框区域
        this.messageInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    showQuotePreview() {
        // 检查是否有引用消息
        if (!this.quotedMessage) {
            return;
        }

        // 只清除现有的DOM元素，不清除quotedMessage数据
        const existingPreview = document.querySelector('.quote-preview');
        if (existingPreview) {
            existingPreview.remove();
        }

        const quotePreview = document.createElement('div');
        quotePreview.className = 'quote-preview';
        
        let quotedContent = '';
        if (this.quotedMessage.message_type === 'image') {
            quotedContent = `<img src="${this.quotedMessage.file_path}" alt="${this.escapeHtml(this.quotedMessage.message)}" class="quoted-image">`;
        } else {
            quotedContent = this.escapeHtml(this.quotedMessage.message);
        }
        
        quotePreview.innerHTML = `
            <div class="quoted-message">
                <div class="quoted-header">
                    <span class="quoted-label">回复</span>
                    <span class="quoted-username">@${this.escapeHtml(this.quotedMessage.username)}</span>
                    <button class="clear-quote-btn" onclick="window.chatClient.clearQuote()">✕</button>
                </div>
                <div class="quoted-content">${quotedContent}</div>
            </div>
        `;

        // 简单直接的方法：插入到消息输入框的正上方
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            // 获取消息输入框的父容器
            const inputContainer = messageInput.closest('form') || messageInput.parentElement;
            if (inputContainer && inputContainer.parentElement) {
                // 在输入容器之前插入引用预览
                inputContainer.parentElement.insertBefore(quotePreview, inputContainer);
            } else {
                // 如果找不到合适位置，就插入到输入框前面
                messageInput.parentElement.insertBefore(quotePreview, messageInput);
            }
        } else {
            console.error('找不到消息输入框');
        }
    }

    clearQuote() {
        this.quotedMessage = null;
        const quotePreview = document.querySelector('.quote-preview');
        if (quotePreview) {
            quotePreview.remove();
        }
    }

    // 跳转到指定消息
    scrollToMessage(messageId) {
        const targetMessage = document.querySelector(`[data-message-id="${messageId}"]`);
        if (targetMessage) {
            // 平滑滚动到目标消息
            targetMessage.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
            
            // 添加高亮效果
            targetMessage.classList.add('message-highlighted');
            
            // 3秒后移除高亮
            setTimeout(() => {
                targetMessage.classList.remove('message-highlighted');
            }, 3000);
        } else {
            console.warn(`找不到ID为${messageId}的消息`);
            // 可以在这里添加提示，比如"消息不在当前页面，可能需要加载更多历史消息"
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