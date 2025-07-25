// 聊天室JavaScript逻辑

class ChatClient {
    constructor() {
        this.ws = null;
        this.username = null;
        this.userId = null;
        this.roomName = window.chatData.roomName;
        this.isConnected = false;
        this.messageCache = {};
        this.longPressTimer = null;
        this.longPressDelay = 500; // 长按500毫秒触发
        this.hasMoreMessages = true;
        this.loadingMore = false;
        this.earliestTimestamp = null;
        this.notificationsEnabled = false;
        this.isPageVisible = true;
        this.isMiniMode = true; // 默认启动为迷你模式
        this.isFullscreen = false;
        
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
        this.messageContextMenu = document.getElementById('messageContextMenu');
        this.loadMoreContainer = document.getElementById('loadMoreContainer');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        
        // 新的菜单相关元素
        this.menuTrigger = document.getElementById('menuTrigger');
        this.menuDropdown = document.getElementById('menuDropdown');
        this.themeToggleItem = document.getElementById('themeToggleItem');
        this.themeValue = document.getElementById('themeValue');
        this.notificationToggleItem = document.getElementById('notificationToggleItem');
        this.notificationValue = document.getElementById('notificationValue');
        this.userListToggle = document.getElementById('userListToggle');
        this.searchToggleItem = document.getElementById('searchToggleItem');
        this.multiSelectToggleItem = document.getElementById('multiSelectToggleItem');
        this.multiSelectMenuText = document.getElementById('multiSelectMenuText');
        this.forwardToggleItem = document.getElementById('forwardToggleItem');
        this.selectedCountMenu = document.getElementById('selectedCountMenu');
        
        // 在线用户弹窗
        this.usersModal = document.getElementById('usersModal');
        this.usersModalOverlay = document.getElementById('usersModalOverlay');
        this.closeUsersBtn = document.getElementById('closeUsersBtn');
        this.usersModalList = document.getElementById('usersModalList');
        this.emojiButton = document.getElementById('emojiButton');
        this.emojiPicker = document.getElementById('emojiPicker');
        this.emojiGrid = document.getElementById('emojiGrid');
        this.customEmojiButton = document.getElementById('customEmojiButton');
        this.customEmojiPicker = document.getElementById('customEmojiPicker');
        this.customEmojiGrid = document.getElementById('customEmojiGrid');
        this.customEmojiInput = document.getElementById('customEmojiInput');
        this.imageButton = document.getElementById('imageButton');
        this.imageInput = document.getElementById('imageInput');
        this.uploadProgressContainer = document.getElementById('uploadProgressContainer');
        this.uploadPreview = document.getElementById('uploadPreview');
        this.uploadFilename = document.getElementById('uploadFilename');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // 迷你模式相关元素
        this.disguiseContainer = document.getElementById('disguiseContainer');
        this.disguiseFrame = document.getElementById('disguiseFrame');
        this.disguiseSettings = document.getElementById('disguiseSettings');
        this.miniChatControls = document.getElementById('miniChatControls');
        this.toggleChatBtn = document.getElementById('toggleChatBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.chatContainer = document.getElementById('chatContainer');
        this.miniChatWindow = document.getElementById('miniChatWindow');
        this.miniMessagesContainer = document.getElementById('miniMessagesContainer');
        this.miniMessageInput = document.getElementById('miniMessageInput');
        this.miniSendBtn = document.getElementById('miniSendBtn');
        this.miniConnectionStatus = document.getElementById('miniConnectionStatus');
        this.miniUserCount = document.getElementById('miniUserCount');
        this.miniFullscreenBtn = document.getElementById('miniFullscreenBtn');
        this.miniHideBtn = document.getElementById('miniHideBtn');
        this.presetUrls = document.getElementById('presetUrls');
        this.customUrl = document.getElementById('customUrl');
        this.customUrlGroup = document.getElementById('customUrlGroup');
        this.applyDisguiseBtn = document.getElementById('applyDisguiseBtn');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.miniModeToggleItem = document.getElementById('miniModeToggleItem');
        
        // 迷你窗口功能元素
        this.miniEmojiButton = document.getElementById('miniEmojiButton');
        this.miniEmojiPicker = document.getElementById('miniEmojiPicker');
        this.miniEmojiGrid = document.getElementById('miniEmojiGrid');
        this.miniCustomEmojiButton = document.getElementById('miniCustomEmojiButton');
        this.miniCustomEmojiPicker = document.getElementById('miniCustomEmojiPicker');
        this.miniCustomEmojiGrid = document.getElementById('miniCustomEmojiGrid');
        this.miniImageButton = document.getElementById('miniImageButton');
        this.miniImageInput = document.getElementById('miniImageInput');
        this.miniCustomEmojiInput = document.getElementById('miniCustomEmojiInput');
        
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
        
        // 初始化自定义表情
        this.initCustomEmojis();
        
        // 初始化表情搜索
        this.initEmojiSearch();
        
        // 初始化搜索功能
        this.initSearch();
        
        // 初始化转发功能
        this.initForward();
        
        // 初始化迷你模式
        this.initMiniMode();
        
        // 初始化快捷键
        this.initKeyboardShortcuts();
        
        // 加载显示设置
        this.loadDisplaySettings();
        
        // 初始化功能菜单
        this.initFunctionMenu();
        
        // 显示初始消息
        this.displayInitialMessages();
        
        // 检查是否需要设置用户名
        this.checkUsernameRequirement();
        
        // 调试：检查关键元素是否正确加载
        console.log('Debug - 关键元素检查:', {
            messageInput: !!this.messageInput,
            sendButton: !!this.sendButton,
            menuTrigger: !!this.menuTrigger,
            usernameModal: !!this.usernameModal
        });
        
        // 临时启用按钮，防止WebSocket连接问题导致按钮无法使用
        this.enableBasicButtons();
    }
    
    // 启用基本按钮（紧急修复用）
    enableBasicButtons() {
        // 启用菜单按钮
        if (this.menuTrigger) {
            this.menuTrigger.disabled = false;
        }
        
        // 启用表情按钮
        if (this.emojiButton) {
            this.emojiButton.disabled = false;
        }
        
        if (this.customEmojiButton) {
            this.customEmojiButton.disabled = false;
        }
        
        if (this.imageButton) {
            this.imageButton.disabled = false;
        }
        
        // 如果有用户名，启用消息输入
        const savedUsername = localStorage.getItem('chatUsername');
        if (savedUsername && this.messageInput && this.sendButton) {
            this.messageInput.disabled = false;
            this.sendButton.disabled = false;
            
            // 同时启用迷你窗口输入
            if (this.miniMessageInput) {
                this.miniMessageInput.disabled = false;
            }
            if (this.miniSendBtn) {
                this.miniSendBtn.disabled = false;
            }
            if (this.miniEmojiButton) {
                this.miniEmojiButton.disabled = false;
            }
            if (this.miniCustomEmojiButton) {
                this.miniCustomEmojiButton.disabled = false;
            }
            if (this.miniImageButton) {
                this.miniImageButton.disabled = false;
            }
        }
    }
    
    // 显示初始消息
    displayInitialMessages() {
        if (window.chatData && window.chatData.messages && window.chatData.messages.length > 0) {
            console.log('显示初始消息，数量:', window.chatData.messages.length);
            this.displayHistoryMessages(window.chatData.messages);
        }
    }
    
    // 检查是否需要设置用户名
    checkUsernameRequirement() {
        // 检查URL参数中是否已经包含用户名
        const urlParams = new URLSearchParams(window.location.search);
        const usernameFromUrl = urlParams.get('username');
        
        // 检查localStorage中是否有保存的用户名
        const savedUsername = localStorage.getItem('chatUsername');
        
        if (usernameFromUrl) {
            // 如果URL中有用户名，直接使用
            this.setUsername(usernameFromUrl);
            // 清理URL中的username参数，保持URL整洁
            this.cleanUrl();
        } else if (savedUsername) {
            // 如果localStorage中有用户名，使用保存的用户名
            this.setUsername(savedUsername);
        } else {
            // 如果都没有，显示用户名设置弹窗
            this.showUsernameModal();
        }
    }
    
    // 显示用户名设置弹窗
    showUsernameModal() {
        if (this.usernameModal) {
            this.usernameModal.classList.add('modal-open');
        }
    }
    
    // 隐藏用户名设置弹窗
    hideUsernameModal() {
        if (this.usernameModal) {
            this.usernameModal.classList.remove('modal-open');
        }
    }
    
    // 清理URL参数
    cleanUrl() {
        const url = new URL(window.location);
        url.searchParams.delete('username');
        window.history.replaceState({}, document.title, url.toString());
    }
    
    // 初始化功能菜单
    initFunctionMenu() {
        // 菜单触发器事件
        if (this.menuTrigger && this.menuDropdown) {
            this.menuTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });
        }
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.function-menu')) {
                this.closeMenu();
            }
        });
        
        // 主题切换
        if (this.themeToggleItem) {
            this.themeToggleItem.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // 通知开关
        if (this.notificationToggleItem) {
            this.notificationToggleItem.addEventListener('click', () => {
                this.toggleNotifications();
            });
        }
        
        // 在线用户
        if (this.userListToggle) {
            this.userListToggle.addEventListener('click', () => {
                this.showUsersModal();
                this.closeMenu();
            });
        }
        
        // 搜索
        if (this.searchToggleItem) {
            this.searchToggleItem.addEventListener('click', () => {
                this.openSearchModal();
                this.closeMenu();
            });
        }
        
        // 多选模式
        if (this.multiSelectToggleItem) {
            this.multiSelectToggleItem.addEventListener('click', () => {
                this.toggleMultiSelectMode();
                this.closeMenu();
            });
        }
        
        // 转发消息
        if (this.forwardToggleItem) {
            this.forwardToggleItem.addEventListener('click', () => {
                this.openForwardModal();
                this.closeMenu();
            });
        }
        
        // 在线用户弹窗事件
        if (this.closeUsersBtn) {
            this.closeUsersBtn.addEventListener('click', () => {
                this.closeUsersModal();
            });
        }
        
        if (this.usersModalOverlay) {
            this.usersModalOverlay.addEventListener('click', () => {
                this.closeUsersModal();
            });
        }
        
        // 初始化主题和通知显示
        this.initTheme();
        this.updateNotificationDisplay();
    }
    
    // 切换菜单显示
    toggleMenu() {
        if (this.menuDropdown) {
            this.menuDropdown.classList.toggle('show');
        }
    }
    
    // 关闭菜单
    closeMenu() {
        if (this.menuDropdown) {
            this.menuDropdown.classList.remove('show');
        }
    }
    
    // 显示在线用户弹窗
    showUsersModal() {
        if (this.usersModal && this.usersModalList) {
            // 更新用户列表
            const users = this.getCurrentUsers();
            this.usersModalList.innerHTML = '';
            users.forEach(user => {
                const li = document.createElement('li');
                li.textContent = user;
                this.usersModalList.appendChild(li);
            });
            
            this.usersModal.style.display = 'block';
        }
    }
    
    // 关闭在线用户弹窗
    closeUsersModal() {
        if (this.usersModal) {
            this.usersModal.style.display = 'none';
        }
    }
    
    // 获取当前用户列表
    getCurrentUsers() {
        if (this.usersList) {
            const userItems = this.usersList.querySelectorAll('li');
            return Array.from(userItems).map(item => item.textContent);
        }
        return [];
    }
    
    // 初始化主题
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'forest') {
            document.body.classList.add('forest-theme');
        }
        this.updateThemeDisplay();
    }
    
    // 切换主题
    toggleTheme() {
        const body = document.body;
        const isForestTheme = body.classList.contains('forest-theme');
        const isStealTheme = body.classList.contains('steal-theme');
        
        if (isForestTheme) {
            // 森林 -> 偷感
            body.classList.remove('forest-theme');
            body.classList.add('steal-theme');
            localStorage.setItem('theme', 'steal');
        } else if (isStealTheme) {
            // 偷感 -> 梦幻
            body.classList.remove('steal-theme');
            localStorage.setItem('theme', 'dream');
        } else {
            // 梦幻 -> 森林
            body.classList.add('forest-theme');
            localStorage.setItem('theme', 'forest');
        }
        
        this.updateThemeDisplay();
    }
    
    // 更新主题显示
    updateThemeDisplay() {
        const isForest = document.body.classList.contains('forest-theme');
        const isSteal = document.body.classList.contains('steal-theme');
        if (this.themeValue) {
            if (isForest) {
                this.themeValue.textContent = '偷感';
            } else if (isSteal) {
                this.themeValue.textContent = '梦幻';
            } else {
                this.themeValue.textContent = '森林';
            }
        }
    }
    
    // 更新通知状态显示
    updateNotificationDisplay() {
        if (this.notificationValue) {
            this.notificationValue.textContent = this.notificationsEnabled ? '开启' : '关闭';
        }
    }
    
    // 更新多选模式显示
    updateMultiSelectDisplay() {
        if (this.multiSelectMenuText) {
            this.multiSelectMenuText.textContent = this.isMultiSelectMode ? '退出多选' : '多选模式';
        }
        
        if (this.selectedCountMenu) {
            this.selectedCountMenu.textContent = this.selectedMessages ? this.selectedMessages.size : 0;
        }
        
        if (this.forwardToggleItem) {
            const hasSelected = this.selectedMessages && this.selectedMessages.size > 0;
            this.forwardToggleItem.style.display = hasSelected ? 'flex' : 'none';
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

        // 添加粘贴事件监听器支持图片粘贴
        this.messageInput.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        this.uploadImage(file);
                    }
                    break;
                }
            }
        });

        // 主题切换功能已移至菜单中

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

        // 通知开关功能已移至菜单中

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


        // 全局粘贴事件监听器，支持在聊天界面任何地方粘贴图片
        document.addEventListener('paste', (e) => {
            // 如果焦点在输入框或其他需要文本粘贴的元素上，不处理
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.contentEditable === 'true')) {
                return; // 让输入框自己处理粘贴事件
            }
            
            const items = e.clipboardData.items;
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        this.uploadImage(file);
                    }
                    break;
                }
            }
        });

        // 自定义表情事件
        if (this.customEmojiButton) {
            this.customEmojiButton.addEventListener('click', () => {
                this.toggleCustomEmojiPicker();
            });
        }

        // 绑定自定义表情上传按钮
        const uploadEmojiBtn = document.getElementById('uploadEmojiBtn');
        if (uploadEmojiBtn) {
            uploadEmojiBtn.addEventListener('click', () => {
                openCustomEmojiUploadModal();
            });
        }

        // 绑定表情上传区域点击事件
        const emojiUploadArea = document.getElementById('emojiUploadArea');
        const customEmojiInput = document.getElementById('customEmojiInput');
        if (emojiUploadArea && customEmojiInput) {
            emojiUploadArea.addEventListener('click', () => {
                customEmojiInput.click();
            });

            customEmojiInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleCustomEmojiFileSelect(e.target.files[0]);
                }
            });
        }

        // 绑定保存表情按钮
        const saveEmojiBtn = document.getElementById('saveEmojiBtn');
        if (saveEmojiBtn) {
            saveEmojiBtn.addEventListener('click', () => {
                uploadCustomEmoji();
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
        this.hideUsernameModal();
        
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
                this.customEmojiButton.disabled = false;
                this.imageButton.disabled = false;
                this.messageInput.focus();
                
                // 启用迷你窗口输入
                if (this.miniMessageInput) {
                    this.miniMessageInput.disabled = false;
                }
                if (this.miniSendBtn) {
                    this.miniSendBtn.disabled = false;
                }
                if (this.miniEmojiButton) {
                    this.miniEmojiButton.disabled = false;
                }
                if (this.miniCustomEmojiButton) {
                    this.miniCustomEmojiButton.disabled = false;
                }
                if (this.miniImageButton) {
                    this.miniImageButton.disabled = false;
                }
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
                
                // 禁用迷你窗口输入
                if (this.miniMessageInput) {
                    this.miniMessageInput.disabled = true;
                }
                if (this.miniSendBtn) {
                    this.miniSendBtn.disabled = true;
                }
                if (this.miniEmojiButton) {
                    this.miniEmojiButton.disabled = true;
                }
                if (this.miniCustomEmojiButton) {
                    this.miniCustomEmojiButton.disabled = true;
                }
                if (this.miniImageButton) {
                    this.miniImageButton.disabled = true;
                }
                
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
                console.log('收到消息:', data);
                console.log('当前模式状态:', { isFullscreen: this.isFullscreen, isMiniMode: this.isMiniMode });
                this.displayMessage(data);
                // 新消息也在迷你窗口显示
                if (this.miniMessagesContainer) {
                    console.log('迷你消息容器存在，准备显示迷你消息');
                    // 确保消息数据包含正确的用户标识
                    const messageForMini = {
                        ...data,
                        userId: data.userId || (data.username === this.username ? this.userId : 'other')
                    };
                    console.log('显示迷你消息:', messageForMini);
                    this.displayMiniMessage(messageForMini);
                } else {
                    console.log('迷你消息容器不存在，无法显示迷你消息');
                }
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
                this.updateMiniStatus(this.isConnected ? '已连接' : '连接中...', data.users.length);
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
        // 缓存消息数据
        this.cacheMessage(data);
        
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
        
        // 同步历史消息到迷你窗口
        this.syncMessagesToMiniWindow();
        
        // 检查是否需要显示加载更多按钮
        this.checkShowLoadMore(messages.length);
        
        this.scrollToBottom();
    }
    
    createMessageElement(data) {
        const messageEl = document.createElement('div');
        const isOwnMessage = data.username === this.username;
        
        messageEl.className = `message ${isOwnMessage ? 'message-user' : 'message-other'}`;
        messageEl.dataset.messageId = data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        messageEl.dataset.username = data.username;
        messageEl.dataset.messageText = data.message;
        messageEl.dataset.messageType = data.message_type || 'text';
        messageEl.dataset.filePath = data.file_path || '';
        messageEl.dataset.timestamp = data.timestamp;
        
        // 添加多选复选框（默认隐藏）
        const selectCheckbox = document.createElement('div');
        selectCheckbox.className = 'message-select-checkbox';
        selectCheckbox.innerHTML = '<input type="checkbox" class="message-checkbox">';
        selectCheckbox.style.display = 'none';
        messageEl.appendChild(selectCheckbox);
        
        const timeString = data.timestamp ? this.formatTime(data.timestamp) : '';
        
        // 构建消息内容
        let messageContent = '';
        
        // 如果有引用消息，显示引用内容（但排除转发消息）
        if (data.quotedMessage && data.message_type !== 'forward_group') {
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
        if (data.message_type === 'forward_group') {
            // 转发消息组 - 使用独立模块处理
            messageEl.classList.add('forward-group');
            const forwardData = data.quotedMessage || {};
            const messageCount = forwardData.message_count || 0;
            
            messageContent += `
                ${!isOwnMessage ? `<div class="message-username">${this.escapeHtml(data.username)}</div>` : ''}
                <div class="forward-group-indicator">
                    <span>📋 聊天记录</span>
                    <span class="forward-group-count">${messageCount}条</span>
                </div>
                <div class="forward-group-preview" onclick="showForwardDetails('${data.id}')">
                    <div class="message-text">${this.escapeHtml(data.message)}</div>
                    <div class="forward-expand-hint">点击查看详细聊天记录</div>
                </div>
                ${timeString ? `<div class="message-time">${timeString}</div>` : ''}
            `;
        } else if (data.message_type === 'image') {
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
        
        // 同时更新迷你窗口状态
        this.updateMiniStatus(status, 0);
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
        const isStealTheme = body.classList.contains('steal-theme');
        
        if (isForestTheme) {
            // 森林 -> 偷感
            body.classList.remove('forest-theme');
            body.classList.add('steal-theme');
            this.themeToggle.querySelector('.theme-toggle-icon').textContent = '⚪';
            this.themeToggle.querySelector('.theme-toggle-text').textContent = '梦幻';
            localStorage.setItem('chatTheme', 'steal');
        } else if (isStealTheme) {
            // 偷感 -> 梦幻
            body.classList.remove('steal-theme');
            this.themeToggle.querySelector('.theme-toggle-icon').textContent = '🌸';
            this.themeToggle.querySelector('.theme-toggle-text').textContent = '森林';
            localStorage.setItem('chatTheme', 'dreamy');
        } else {
            // 梦幻 -> 森林
            body.classList.add('forest-theme');
            this.themeToggle.querySelector('.theme-toggle-icon').textContent = '🌳';
            this.themeToggle.querySelector('.theme-toggle-text').textContent = '偷感';
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
                this.themeToggle.querySelector('.theme-toggle-text').textContent = '偷感';
            }
        } else if (savedTheme === 'steal') {
            document.body.classList.add('steal-theme');
            if (this.themeToggle) {
                this.themeToggle.querySelector('.theme-toggle-icon').textContent = '⚪';
                this.themeToggle.querySelector('.theme-toggle-text').textContent = '梦幻';
            }
        } else {
            // 默认梦幻主题
            if (this.themeToggle) {
                this.themeToggle.querySelector('.theme-toggle-icon').textContent = '🌸';
                this.themeToggle.querySelector('.theme-toggle-text').textContent = '森林';
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

        // 找到插入点：加载更多按钮之后的位置
        let insertPoint = this.loadMoreContainer ? this.loadMoreContainer.nextSibling : null;
        
        // 创建消息元素，按顺序插入（最早的消息先插入）
        messages.forEach(messageData => {
            const messageEl = this.createMessageElement(messageData);
            
            // 按时间顺序插入：每个消息都插入到当前插入点位置
            if (insertPoint) {
                this.messagesContainer.insertBefore(messageEl, insertPoint);
            } else {
                this.messagesContainer.appendChild(messageEl);
            }
            
            // 更新最早时间戳
            if (!this.earliestTimestamp || messageData.timestamp < this.earliestTimestamp) {
                this.earliestTimestamp = messageData.timestamp;
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
        this.updateNotificationDisplay();
    }

    // 更新通知开关UI（保持向后兼容）
    updateNotificationUI() {
        this.updateNotificationDisplay();
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
        // 合并微信表情数据和原有表情数据
        this.emojiData = {
            // 微信表情优先显示
            ...window.WECHAT_EMOJIS_DATA,
            
            // 保留原有分类（转换为新格式）
            smileys: {
                name: '笑脸',
                icon: '😀',
                emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'].map(emoji => ({
                    unicode: this.getEmojiUnicode(emoji),
                    name: emoji,
                    url: null, // 使用Unicode字符显示
                    keywords: [emoji]
                }))
            },
            people: {
                name: '人物',
                icon: '👋',
                emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤞', '✌️', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '👂', '👃'].map(emoji => ({
                    unicode: this.getEmojiUnicode(emoji),
                    name: emoji,
                    url: null,
                    keywords: [emoji]
                }))
            },
            animals: {
                name: '动物',
                icon: '🐶',
                emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜'].map(emoji => ({
                    unicode: this.getEmojiUnicode(emoji),
                    name: emoji,
                    url: null,
                    keywords: [emoji]
                }))
            },
            food: {
                name: '食物',
                icon: '🍎',
                emojis: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞'].map(emoji => ({
                    unicode: this.getEmojiUnicode(emoji),
                    name: emoji,
                    url: null,
                    keywords: [emoji]
                }))
            },
            activities: {
                name: '活动',
                icon: '⚽',
                emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️'].map(emoji => ({
                    unicode: this.getEmojiUnicode(emoji),
                    name: emoji,
                    url: null,
                    keywords: [emoji]
                }))
            },
            objects: {
                name: '物品',
                icon: '💡',
                emojis: ['💡', '🔦', '🕯️', '🧯', '💸', '💵', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '🛠️', '⛏️', '🔩', '⚙️', '🧲', '💣', '🧨', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭'].map(emoji => ({
                    unicode: this.getEmojiUnicode(emoji),
                    name: emoji,
                    url: null,
                    keywords: [emoji]
                }))
            },
            symbols: {
                name: '符号',
                icon: '❤️',
                emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐'].map(emoji => ({
                    unicode: this.getEmojiUnicode(emoji),
                    name: emoji,
                    url: null,
                    keywords: [emoji]
                }))
            }
        };
        
        this.currentCategory = 'wechat_classic'; // 默认显示微信经典表情
        this.renderEmojiGrid();
    }

    // 获取emoji的Unicode编码
    getEmojiUnicode(emoji) {
        return emoji.codePointAt(0).toString(16);
    }

    // 渲染表情网格
    renderEmojiGrid() {
        if (!this.emojiGrid) return;
        
        const categoryData = this.emojiData[this.currentCategory];
        if (!categoryData) return;
        
        const emojis = categoryData.emojis || [];
        this.emojiGrid.innerHTML = '';
        
        emojis.forEach(emojiData => {
            const button = document.createElement('button');
            button.className = 'emoji-item';
            button.title = emojiData.name;
            
            if (emojiData.url) {
                // 使用图片显示（Twemoji CDN）
                const img = document.createElement('img');
                img.src = emojiData.url;
                img.alt = emojiData.name;
                img.className = 'emoji-image';
                img.style.width = '20px';
                img.style.height = '20px';
                
                // 图片加载失败时回退到Unicode字符
                img.onerror = () => {
                    button.innerHTML = '';
                    button.textContent = this.unicodeToEmoji(emojiData.unicode);
                };
                
                button.appendChild(img);
            } else {
                // 使用Unicode字符显示
                button.textContent = emojiData.name;
            }
            
            button.addEventListener('click', () => {
                // 统一使用Unicode字符插入
                const emojiChar = emojiData.url ? 
                    this.unicodeToEmoji(emojiData.unicode) : 
                    emojiData.name;
                this.insertEmoji(emojiChar);
            });
            
            this.emojiGrid.appendChild(button);
        });
    }

    // Unicode编码转换为表情字符
    unicodeToEmoji(unicode) {
        return String.fromCodePoint(parseInt(unicode, 16));
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
                            message: response.filename,  // 使用原始文件名作为消息内容
                            file_path: response.file_path,
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

    // 初始化表情搜索
    initEmojiSearch() {
        const emojiSearch = document.getElementById('emojiSearch');
        const clearSearchBtn = document.getElementById('clearEmojiSearch');
        
        if (!emojiSearch) return;
        
        // 搜索输入事件
        emojiSearch.addEventListener('input', (e) => {
            const keyword = e.target.value.trim();
            this.handleEmojiSearch(keyword);
            
            // 显示/隐藏清除按钮
            clearSearchBtn.style.display = keyword ? 'flex' : 'none';
        });
        
        // 清除搜索
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                emojiSearch.value = '';
                clearSearchBtn.style.display = 'none';
                this.clearEmojiSearch();
            });
        }
        
        // 回车键搜索
        emojiSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const keyword = e.target.value.trim();
                this.handleEmojiSearch(keyword);
            }
        });
    }

    // 处理表情搜索
    handleEmojiSearch(keyword) {
        if (!keyword) {
            this.clearEmojiSearch();
            return;
        }
        
        const searchResults = this.searchEmojis(keyword);
        this.renderSearchResults(searchResults);
    }

    // 搜索表情
    searchEmojis(keyword) {
        const results = [];
        const lowerKeyword = keyword.toLowerCase();
        
        Object.values(this.emojiData).forEach(category => {
            if (category.emojis) {
                category.emojis.forEach(emojiData => {
                    const matchKeywords = emojiData.keywords || [];
                    const matchName = emojiData.name.toLowerCase();
                    
                    if (matchName.includes(lowerKeyword) || 
                        matchKeywords.some(k => k.toLowerCase().includes(lowerKeyword))) {
                        results.push(emojiData);
                    }
                });
            }
        });
        
        return results;
    }

    // 渲染搜索结果
    renderSearchResults(results) {
        if (!this.emojiGrid) return;
        
        this.emojiGrid.innerHTML = '';
        
        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'emoji-no-results';
            noResults.textContent = '没找到匹配的表情';
            this.emojiGrid.appendChild(noResults);
            return;
        }
        
        results.forEach(emojiData => {
            const button = document.createElement('button');
            button.className = 'emoji-item';
            button.title = emojiData.name;
            
            if (emojiData.url) {
                const img = document.createElement('img');
                img.src = emojiData.url;
                img.alt = emojiData.name;
                img.className = 'emoji-image';
                img.style.width = '20px';
                img.style.height = '20px';
                
                img.onerror = () => {
                    button.innerHTML = '';
                    button.textContent = this.unicodeToEmoji(emojiData.unicode);
                };
                
                button.appendChild(img);
            } else {
                button.textContent = emojiData.name;
            }
            
            button.addEventListener('click', () => {
                const emojiChar = emojiData.url ? 
                    this.unicodeToEmoji(emojiData.unicode) : 
                    emojiData.name;
                this.insertEmoji(emojiChar);
            });
            
            this.emojiGrid.appendChild(button);
        });
    }

    // 清除搜索
    clearEmojiSearch() {
        this.currentCategory = 'wechat_classic';
        this.renderEmojiGrid();
        
        // 重置分类按钮状态
        document.querySelectorAll('.emoji-category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === this.currentCategory) {
                btn.classList.add('active');
            }
        });
    }

    // 搜索功能初始化
    initSearch() {
        this.searchModal = document.getElementById('searchModal');
        this.searchModalOverlay = document.getElementById('searchModalOverlay');
        this.searchBtn = document.getElementById('searchBtn');
        this.closeSearchBtn = document.getElementById('closeSearchBtn');
        this.searchInput = document.getElementById('searchInput');
        this.searchExecuteBtn = document.getElementById('searchExecuteBtn');
        this.searchResults = document.getElementById('searchResults');
        this.searchResultsCount = document.getElementById('searchResultsCount');
        this.searchPagination = document.getElementById('searchPagination');
        this.searchPrevBtn = document.getElementById('searchPrevBtn');
        this.searchNextBtn = document.getElementById('searchNextBtn');
        this.searchPageInfo = document.getElementById('searchPageInfo');
        
        // 搜索状态
        this.currentSearchKeyword = '';
        this.currentSearchPage = 1;
        this.totalSearchPages = 0;
        this.isSearching = false;
        
        // 绑定搜索事件
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.openSearchModal());
        }
        
        if (this.closeSearchBtn) {
            this.closeSearchBtn.addEventListener('click', () => this.closeSearchModal());
        }
        
        if (this.searchModalOverlay) {
            this.searchModalOverlay.addEventListener('click', () => this.closeSearchModal());
        }
        
        if (this.searchExecuteBtn) {
            this.searchExecuteBtn.addEventListener('click', () => this.performSearch());
        }
        
        if (this.searchInput) {
            // 回车键搜索
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });
        }
        
        // 分页按钮事件
        if (this.searchPrevBtn) {
            this.searchPrevBtn.addEventListener('click', () => this.searchPrevPage());
        }
        
        if (this.searchNextBtn) {
            this.searchNextBtn.addEventListener('click', () => this.searchNextPage());
        }
        
        // ESC键关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.searchModal && this.searchModal.style.display === 'block') {
                this.closeSearchModal();
            }
        });
    }
    
    // 打开搜索弹窗
    openSearchModal() {
        if (this.searchModal) {
            this.searchModal.style.display = 'block';
            // 添加动画效果
            setTimeout(() => {
                if (this.searchInput) {
                    this.searchInput.focus();
                }
            }, 100);
        }
    }
    
    // 关闭搜索弹窗
    closeSearchModal() {
        if (this.searchModal) {
            this.searchModal.style.display = 'none';
            this.clearSearchResults();
        }
    }
    
    // 执行搜索
    async performSearch(page = 1) {
        if (this.isSearching) return;
        
        const keyword = this.searchInput?.value?.trim();
        if (!keyword) {
            alert('请输入搜索关键词');
            return;
        }
        
        // 获取搜索选项
        const searchUsername = document.getElementById('searchUsername')?.checked ?? true;
        const searchMessage = document.getElementById('searchMessage')?.checked ?? true;
        
        if (!searchUsername && !searchMessage) {
            alert('请至少选择一个搜索范围');
            return;
        }
        
        this.isSearching = true;
        this.currentSearchKeyword = keyword;
        this.currentSearchPage = page;
        
        // 更新搜索按钮状态
        this.setSearchButtonLoading(true);
        
        try {
            const params = new URLSearchParams({
                keyword: keyword,
                search_username: searchUsername,
                search_message: searchMessage,
                page: page,
                limit: 20
            });
            
            const response = await fetch(`/api/search/${encodeURIComponent(this.roomName)}?${params}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                this.displaySearchResults(data);
                this.updateSearchPagination(data);
            } else {
                alert(data.message || '搜索失败');
                this.clearSearchResults();
            }
        } catch (error) {
            console.error('搜索错误:', error);
            alert('搜索失败，请重试');
            this.clearSearchResults();
        } finally {
            this.isSearching = false;
            this.setSearchButtonLoading(false);
        }
    }
    
    // 显示搜索结果
    displaySearchResults(data) {
        if (!this.searchResults || !this.searchResultsCount) return;
        
        const { messages, total_count, keyword } = data;
        
        // 更新结果计数
        this.searchResultsCount.textContent = `找到 ${total_count} 条包含 "${keyword}" 的消息`;
        
        // 清空之前的结果
        this.searchResults.innerHTML = '';
        
        if (messages.length === 0) {
            this.searchResults.innerHTML = '<div class="search-no-results">未找到匹配的消息</div>';
            return;
        }
        
        // 显示搜索结果
        messages.forEach(messageData => {
            const resultItem = this.createSearchResultItem(messageData, keyword);
            this.searchResults.appendChild(resultItem);
        });
    }
    
    // 创建搜索结果项
    createSearchResultItem(messageData, keyword) {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        
        // 格式化时间
        const timestamp = new Date(messageData.timestamp);
        const timeStr = timestamp.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // 高亮关键词
        const highlightText = (text, keyword) => {
            if (!keyword) return text;
            const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        };
        
        let contentHtml = '';
        
        if (messageData.message_type === 'image') {
            contentHtml = `
                <div class="search-result-content">
                    <div class="search-result-image">
                        <img src="${messageData.file_path}" alt="图片消息" loading="lazy">
                    </div>
                    <span class="search-result-filename">${highlightText(messageData.message || '图片', keyword)}</span>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="search-result-content">
                    <span class="search-result-text">${highlightText(messageData.message, keyword)}</span>
                </div>
            `;
        }
        
        resultItem.innerHTML = `
            <div class="search-result-header">
                <span class="search-result-username">${highlightText(messageData.username, keyword)}</span>
                <span class="search-result-time">${timeStr}</span>
            </div>
            ${contentHtml}
        `;
        
        // 点击结果项可以跳转到对应消息（如果已加载）
        resultItem.addEventListener('click', () => {
            this.jumpToMessage(messageData.id);
        });
        
        return resultItem;
    }
    
    // 跳转到指定消息
    async jumpToMessage(messageId) {
        // 尝试在当前页面中找到对应消息
        let messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        
        if (messageElement) {
            // 关闭搜索弹窗
            this.closeSearchModal();
            
            // 滚动到对应消息并高亮
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight-message');
            
            // 3秒后移除高亮
            setTimeout(() => {
                messageElement.classList.remove('highlight-message');
            }, 3000);
            return;
        }
        
        // 消息未在当前页面中，尝试加载历史消息
        if (!this.hasMoreMessages || this.loadingMore) {
            alert('该消息不在当前页面中，且无法加载更多历史消息');
            return;
        }
        
        // 关闭搜索弹窗并显示加载提示
        this.closeSearchModal();
        
        // 显示加载提示
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'jump-loading-indicator';
        loadingIndicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 8px;
                z-index: 10000;
                text-align: center;
            ">
                <div style="margin-bottom: 10px;">正在加载消息...</div>
                <div style="font-size: 12px;">正在寻找目标消息</div>
            </div>
        `;
        document.body.appendChild(loadingIndicator);
        
        try {
            let maxAttempts = 10; // 最多尝试加载10次
            let attempts = 0;
            
            while (attempts < maxAttempts && this.hasMoreMessages) {
                attempts++;
                
                // 加载更多消息
                await this.loadMoreMessages();
                
                // 再次查找目标消息
                messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                if (messageElement) {
                    // 找到了，移除加载提示并跳转
                    document.body.removeChild(loadingIndicator);
                    
                    // 滚动到对应消息并高亮
                    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    messageElement.classList.add('highlight-message');
                    
                    // 3秒后移除高亮
                    setTimeout(() => {
                        messageElement.classList.remove('highlight-message');
                    }, 3000);
                    return;
                }
                
                // 更新加载提示
                const indicator = loadingIndicator.querySelector('div div:last-child');
                if (indicator) {
                    indicator.textContent = `正在寻找目标消息 (${attempts}/${maxAttempts})`;
                }
                
                // 短暂延迟避免请求过于频繁
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // 未找到消息，移除加载提示并显示错误信息
            document.body.removeChild(loadingIndicator);
            alert('无法找到该消息，可能消息已被删除或位置太早');
            
        } catch (error) {
            // 发生错误，移除加载提示并显示错误信息
            document.body.removeChild(loadingIndicator);
            console.error('加载消息时出错:', error);
            alert('加载消息时出错，请重试');
        }
    }
    
    // 更新搜索分页
    updateSearchPagination(data) {
        if (!this.searchPagination) return;
        
        const { current_page, total_pages, has_more } = data;
        this.totalSearchPages = total_pages;
        
        if (total_pages <= 1) {
            this.searchPagination.style.display = 'none';
            return;
        }
        
        this.searchPagination.style.display = 'flex';
        
        // 更新按钮状态
        if (this.searchPrevBtn) {
            this.searchPrevBtn.disabled = current_page <= 1;
        }
        
        if (this.searchNextBtn) {
            this.searchNextBtn.disabled = current_page >= total_pages;
        }
        
        // 更新页面信息
        if (this.searchPageInfo) {
            this.searchPageInfo.textContent = `第 ${current_page} 页，共 ${total_pages} 页`;
        }
    }
    
    // 上一页
    searchPrevPage() {
        if (this.currentSearchPage > 1) {
            this.performSearch(this.currentSearchPage - 1);
        }
    }
    
    // 下一页
    searchNextPage() {
        if (this.currentSearchPage < this.totalSearchPages) {
            this.performSearch(this.currentSearchPage + 1);
        }
    }
    
    // 清空搜索结果
    clearSearchResults() {
        if (this.searchResults) {
            this.searchResults.innerHTML = '';
        }
        if (this.searchResultsCount) {
            this.searchResultsCount.textContent = '搜索结果将显示在这里';
        }
        if (this.searchPagination) {
            this.searchPagination.style.display = 'none';
        }
        this.currentSearchKeyword = '';
        this.currentSearchPage = 1;
        this.totalSearchPages = 0;
    }
    
    // 设置搜索按钮加载状态
    setSearchButtonLoading(loading) {
        if (!this.searchExecuteBtn) return;
        
        if (loading) {
            this.searchExecuteBtn.textContent = '搜索中...';
            this.searchExecuteBtn.disabled = true;
        } else {
            this.searchExecuteBtn.textContent = '搜索';
            this.searchExecuteBtn.disabled = false;
        }
    }

    // 转发功能初始化
    initForward() {
        // 获取DOM元素
        this.multiSelectBtn = document.getElementById('multiSelectBtn');
        this.multiSelectBtnText = document.getElementById('multiSelectBtnText');
        this.forwardBtn = document.getElementById('forwardBtn');
        this.selectedCount = document.getElementById('selectedCount');
        this.forwardModal = document.getElementById('forwardModal');
        this.forwardModalOverlay = document.getElementById('forwardModalOverlay');
        this.closeForwardBtn = document.getElementById('closeForwardBtn');
        this.targetRoomSelect = document.getElementById('targetRoomSelect');
        this.forwardUsername = document.getElementById('forwardUsername');
        this.forwardPassword = document.getElementById('forwardPassword');
        this.forwardPasswordGroup = document.getElementById('forwardPasswordGroup');
        this.cancelForwardBtn = document.getElementById('cancelForwardBtn');
        this.confirmForwardBtn = document.getElementById('confirmForwardBtn');
        this.forwardMessagesPreview = document.getElementById('forwardMessagesPreview');
        
        // 状态变量
        this.isMultiSelectMode = false;
        this.selectedMessages = new Set();
        
        // 绑定事件
        if (this.multiSelectBtn) {
            this.multiSelectBtn.addEventListener('click', () => this.toggleMultiSelectMode());
        }
        
        if (this.forwardBtn) {
            this.forwardBtn.addEventListener('click', () => this.openForwardModal());
        }
        
        if (this.closeForwardBtn) {
            this.closeForwardBtn.addEventListener('click', () => this.closeForwardModal());
        }
        
        if (this.forwardModalOverlay) {
            this.forwardModalOverlay.addEventListener('click', () => this.closeForwardModal());
        }
        
        if (this.cancelForwardBtn) {
            this.cancelForwardBtn.addEventListener('click', () => this.closeForwardModal());
        }
        
        if (this.confirmForwardBtn) {
            this.confirmForwardBtn.addEventListener('click', () => this.executeForward());
        }
        
        if (this.targetRoomSelect) {
            this.targetRoomSelect.addEventListener('change', () => this.onTargetRoomChange());
        }
        
        // 加载聊天室列表
        this.loadRoomsForForward();
        
        // ESC键退出多选模式
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMultiSelectMode) {
                this.toggleMultiSelectMode();
            }
        });
    }
    
    // 切换多选模式
    toggleMultiSelectMode() {
        this.isMultiSelectMode = !this.isMultiSelectMode;
        
        if (this.isMultiSelectMode) {
            // 进入多选模式
            this.enterMultiSelectMode();
        } else {
            // 退出多选模式
            this.exitMultiSelectMode();
        }
    }
    
    // 进入多选模式
    enterMultiSelectMode() {
        this.isMultiSelectMode = true;
        this.selectedMessages.clear();
        
        // 更新按钮状态
        if (this.multiSelectBtn) {
            this.multiSelectBtn.classList.add('active');
        }
        if (this.multiSelectBtnText) {
            this.multiSelectBtnText.textContent = '退出多选';
        }
        
        // 显示所有消息的复选框
        const messages = document.querySelectorAll('.message');
        messages.forEach(messageEl => {
            // 确保消息有复选框，如果没有则创建
            let checkbox = messageEl.querySelector('.message-select-checkbox');
            if (!checkbox) {
                checkbox = document.createElement('div');
                checkbox.className = 'message-select-checkbox';
                checkbox.innerHTML = '<input type="checkbox" class="message-checkbox">';
                messageEl.insertBefore(checkbox, messageEl.firstChild);
            }
            
            checkbox.style.display = 'block';
            
            // 绑定复选框事件（移除旧的监听器避免重复绑定）
            const input = checkbox.querySelector('input');
            if (input) {
                // 移除之前的事件监听器
                input.removeEventListener('change', input._changeHandler);
                
                // 创建新的事件处理函数并保存引用
                input._changeHandler = (e) => {
                    this.onMessageSelectChange(messageEl, e.target.checked);
                };
                
                input.addEventListener('change', input._changeHandler);
            }
        });
        
        // 添加多选模式样式
        document.body.classList.add('multi-select-mode');
        
        this.updateForwardButton();
        this.updateMultiSelectDisplay();
    }
    
    // 退出多选模式
    exitMultiSelectMode() {
        this.isMultiSelectMode = false;
        this.selectedMessages.clear();
        
        // 更新按钮状态
        if (this.multiSelectBtn) {
            this.multiSelectBtn.classList.remove('active');
        }
        if (this.multiSelectBtnText) {
            this.multiSelectBtnText.textContent = '多选模式';
        }
        
        // 隐藏所有消息的复选框
        const messages = document.querySelectorAll('.message');
        messages.forEach(messageEl => {
            const checkbox = messageEl.querySelector('.message-select-checkbox');
            if (checkbox) {
                checkbox.style.display = 'none';
                const input = checkbox.querySelector('input');
                if (input) {
                    input.checked = false;
                }
            }
            messageEl.classList.remove('message-selected');
        });
        
        // 移除多选模式样式
        document.body.classList.remove('multi-select-mode');
        
        // 隐藏转发按钮
        if (this.forwardBtn) {
            this.forwardBtn.style.display = 'none';
        }
        
        // 更新菜单显示
        this.updateMultiSelectDisplay();
    }
    
    // 消息选择状态改变
    onMessageSelectChange(messageEl, selected) {
        const messageId = messageEl.dataset.messageId;
        
        if (selected) {
            this.selectedMessages.add(messageId);
            messageEl.classList.add('message-selected');
        } else {
            this.selectedMessages.delete(messageId);
            messageEl.classList.remove('message-selected');
        }
        
        this.updateForwardButton();
    }
    
    // 更新转发按钮状态
    updateForwardButton() {
        const selectedCount = this.selectedMessages.size;
        
        if (this.selectedCount) {
            this.selectedCount.textContent = selectedCount;
        }
        
        if (this.forwardBtn) {
            if (selectedCount > 0) {
                this.forwardBtn.style.display = 'block';
            } else {
                this.forwardBtn.style.display = 'none';
            }
        }
        
        // 更新菜单显示
        this.updateMultiSelectDisplay();
    }
    
    // 加载聊天室列表用于转发
    async loadRoomsForForward() {
        try {
            const response = await fetch('/');
            const html = await response.text();
            
            // 简单解析HTML获取聊天室信息（更好的做法是创建专门的API）
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const roomCards = doc.querySelectorAll('.room-card');
            
            if (this.targetRoomSelect) {
                // 清空现有选项
                this.targetRoomSelect.innerHTML = '<option value="">请选择聊天室</option>';
                
                roomCards.forEach(card => {
                    const roomNameEl = card.querySelector('.room-name');
                    if (roomNameEl) {
                        const roomName = roomNameEl.textContent.trim().replace('🔒', '').trim();
                        const hasPassword = roomNameEl.querySelector('.lock-icon') !== null;
                        
                        // 包含当前聊天室，但给予特殊标识
                        const option = document.createElement('option');
                        option.value = roomName;
                        if (roomName === this.roomName) {
                            option.textContent = roomName + ' (当前聊天室)' + (hasPassword ? ' 🔒' : '');
                        } else {
                            option.textContent = roomName + (hasPassword ? ' 🔒' : '');
                        }
                        option.dataset.hasPassword = hasPassword;
                        this.targetRoomSelect.appendChild(option);
                    }
                });
            }
        } catch (error) {
            console.error('加载聊天室列表失败:', error);
        }
    }
    
    // 目标聊天室改变
    onTargetRoomChange() {
        const selectedOption = this.targetRoomSelect.selectedOptions[0];
        const hasPassword = selectedOption && selectedOption.dataset.hasPassword === 'true';
        
        // 显示或隐藏密码输入框
        if (this.forwardPasswordGroup) {
            this.forwardPasswordGroup.style.display = hasPassword ? 'block' : 'none';
        }
        
        this.validateForwardForm();
    }
    
    // 验证转发表单
    validateForwardForm() {
        const targetRoom = this.targetRoomSelect?.value;
        const username = this.forwardUsername?.value?.trim();
        const selectedOption = this.targetRoomSelect?.selectedOptions[0];
        const hasPassword = selectedOption && selectedOption.dataset.hasPassword === 'true';
        const password = this.forwardPassword?.value;
        
        const isValid = targetRoom && username && (!hasPassword || password);
        
        if (this.confirmForwardBtn) {
            this.confirmForwardBtn.disabled = !isValid;
        }
    }
    
    // 打开转发弹窗
    openForwardModal() {
        if (this.selectedMessages.size === 0) {
            alert('请先选择要转发的消息');
            return;
        }
        
        this.generateForwardPreview();
        
        if (this.forwardModal) {
            this.forwardModal.style.display = 'block';
        }
        
        // 绑定表单验证事件
        [this.forwardUsername, this.forwardPassword].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.validateForwardForm());
            }
        });
        
        this.validateForwardForm();
    }
    
    // 关闭转发弹窗
    closeForwardModal() {
        if (this.forwardModal) {
            this.forwardModal.style.display = 'none';
        }
        
        // 重置表单
        if (this.targetRoomSelect) {
            this.targetRoomSelect.value = '';
        }
        if (this.forwardUsername) {
            this.forwardUsername.value = '';
        }
        if (this.forwardPassword) {
            this.forwardPassword.value = '';
        }
        if (this.forwardPasswordGroup) {
            this.forwardPasswordGroup.style.display = 'none';
        }
    }
    
    // 生成转发预览
    generateForwardPreview() {
        if (!this.forwardMessagesPreview) return;
        
        this.forwardMessagesPreview.innerHTML = '';
        
        const selectedMessageElements = Array.from(this.selectedMessages).map(messageId => {
            return document.querySelector(`[data-message-id="${messageId}"]`);
        }).filter(Boolean);
        
        // 按时间顺序排序
        selectedMessageElements.sort((a, b) => {
            const timeA = new Date(a.dataset.timestamp || 0).getTime();
            const timeB = new Date(b.dataset.timestamp || 0).getTime();
            return timeA - timeB;
        });
        
        selectedMessageElements.forEach(messageEl => {
            const previewItem = document.createElement('div');
            previewItem.className = 'forward-preview-item';
            
            const username = messageEl.dataset.username;
            const messageType = messageEl.dataset.messageType;
            const messageText = messageEl.dataset.messageText;
            const filePath = messageEl.dataset.filePath;
            
            let content = '';
            if (messageType === 'image') {
                content = `<span class="preview-username">${username}:</span> <span class="preview-image">[图片] ${messageText}</span>`;
            } else {
                content = `<span class="preview-username">${username}:</span> <span class="preview-text">${messageText}</span>`;
            }
            
            previewItem.innerHTML = content;
            this.forwardMessagesPreview.appendChild(previewItem);
        });
    }
    
    // 执行转发
    async executeForward() {
        const targetRoom = this.targetRoomSelect.value;
        const username = this.forwardUsername.value.trim();
        const password = this.forwardPassword.value;
        
        if (!targetRoom || !username) {
            alert('请填写完整的转发信息');
            return;
        }
        
        // 收集要转发的消息数据
        const messagesToForward = Array.from(this.selectedMessages).map(messageId => {
            const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageEl) {
                return {
                    id: messageId,
                    username: messageEl.dataset.username,
                    message: messageEl.dataset.messageText,
                    message_type: messageEl.dataset.messageType,
                    file_path: messageEl.dataset.filePath,
                    timestamp: messageEl.dataset.timestamp
                };
            }
            return null;
        }).filter(Boolean);
        
        // 按时间排序
        messagesToForward.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeA - timeB;
        });
        
        try {
            this.confirmForwardBtn.disabled = true;
            this.confirmForwardBtn.textContent = '转发中...';
            
            const response = await fetch('/api/forward-messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    target_room: targetRoom,
                    username: username,
                    password: password,
                    messages: messagesToForward
                })
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                alert(`成功转发 ${messagesToForward.length} 条消息到 ${targetRoom}`);
                this.closeForwardModal();
                this.exitMultiSelectMode();
            } else {
                alert('转发失败: ' + result.message);
            }
        } catch (error) {
            console.error('转发错误:', error);
            alert('转发失败，请重试');
        } finally {
            this.confirmForwardBtn.disabled = false;
            this.confirmForwardBtn.textContent = '转发消息';
        }
    }

    // 自定义表情相关方法
    async initCustomEmojis() {
        await this.loadCustomEmojis();
    }

    async loadCustomEmojis() {
        try {
            const response = await fetch('/api/custom-emojis');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.renderCustomEmojis(data.emojis);
            }
        } catch (error) {
            console.error('加载自定义表情失败:', error);
        }
    }

    renderCustomEmojis(emojis) {
        if (!this.customEmojiGrid) return;
        
        this.customEmojiGrid.innerHTML = '';
        const emptyMessage = document.getElementById('customEmojiEmpty');
        
        if (emojis.length === 0) {
            emptyMessage.style.display = 'block';
            return;
        }
        
        emptyMessage.style.display = 'none';
        
        emojis.forEach(emoji => {
            const emojiElement = document.createElement('div');
            emojiElement.className = 'custom-emoji-item';
            emojiElement.innerHTML = `
                <img src="${emoji.file_path}" alt="${emoji.name}" title="${emoji.name}">
                <span class="emoji-name">${emoji.name}</span>
                ${emoji.uploader === this.username ? '<button class="delete-emoji-btn" onclick="window.chatClient.deleteCustomEmoji(' + emoji.id + ')">×</button>' : ''}
            `;
            
            // 点击发送表情
            emojiElement.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-emoji-btn')) {
                    this.sendCustomEmoji(emoji);
                }
            });
            
            this.customEmojiGrid.appendChild(emojiElement);
        });
    }

    toggleCustomEmojiPicker() {
        if (this.customEmojiPicker.classList.contains('show')) {
            this.hideCustomEmojiPicker();
        } else {
            this.showCustomEmojiPicker();
        }
    }

    showCustomEmojiPicker() {
        this.hideEmojiPicker(); // 隐藏普通表情选择器
        this.customEmojiPicker.classList.add('show');
        this.loadCustomEmojis(); // 刷新表情列表
    }

    hideCustomEmojiPicker() {
        this.customEmojiPicker.classList.remove('show');
    }

    sendCustomEmoji(emoji) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket连接未就绪');
            return;
        }
        
        // 发送自定义表情作为图片消息
        const messageData = {
            type: 'message',
            message_type: 'image',
            message: emoji.name,
            file_path: emoji.file_path,
            timestamp: new Date().toISOString()
        };
        
        // 如果有引用消息，添加引用信息
        if (this.quotedMessage) {
            messageData.quotedMessage = this.quotedMessage;
        }
        
        console.log('发送自定义表情:', messageData);
        this.ws.send(JSON.stringify(messageData));
        this.clearQuote();
        this.hideCustomEmojiPicker();
    }

    async deleteCustomEmoji(emojiId) {
        if (!confirm('确定要删除这个自定义表情吗？')) return;
        
        try {
            const formData = new FormData();
            formData.append('uploader', this.username);
            
            const response = await fetch(`/api/custom-emoji/${emojiId}`, {
                method: 'DELETE',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.loadCustomEmojis(); // 刷新列表
                // 同时刷新迷你窗口的表情列表
                if (window.chatClient && window.chatClient.loadMiniCustomEmojis) {
                    window.chatClient.loadMiniCustomEmojis();
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('删除自定义表情失败:', error);
            alert('删除失败，请重试');
        }
    }

    // 缓存消息数据
    cacheMessage(messageData) {
        if (messageData.id) {
            this.messageCache[messageData.id] = messageData;
            // 同时缓存到转发处理器中
            if (window.forwardHandler) {
                window.forwardHandler.cacheMessage(messageData);
            }
        }
    }

}

// 自定义表情上传相关的全局函数
function openCustomEmojiUploadModal() {
    document.getElementById('customEmojiUploadModal').classList.add('show');
}

function closeCustomEmojiUploadModal() {
    document.getElementById('customEmojiUploadModal').classList.remove('show');
    document.getElementById('emojiUploadArea').style.display = 'block';
    document.getElementById('emojiPreview').style.display = 'none';
    document.getElementById('emojiName').value = '';
    document.getElementById('saveEmojiBtn').disabled = true;
}

function handleCustomEmojiFileSelect(file) {
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
    }
    
    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
    }
    
    // 预览图片
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('emojiUploadArea').style.display = 'none';
        document.getElementById('emojiPreview').style.display = 'block';
        document.getElementById('emojiPreviewImg').src = e.target.result;
        
        // 生成默认名称
        const defaultName = file.name.split('.')[0];
        document.getElementById('emojiName').value = defaultName;
        document.getElementById('emojiName').focus();
        document.getElementById('saveEmojiBtn').disabled = false;
        
        // 存储文件用于上传
        window.selectedEmojiFile = file;
    };
    reader.readAsDataURL(file);
}

// 在ChatClient类中添加新方法
ChatClient.prototype.initMiniMode = function() {
    // 设置初始显示状态
    this.updateMiniModeDisplay();
    
    // 绑定控制按钮事件
    this.toggleChatBtn?.addEventListener('click', () => {
        this.toggleMiniChat();
    });
    
    this.settingsBtn?.addEventListener('click', () => {
        this.showDisguiseSettings();
    });
    
    this.fullscreenBtn?.addEventListener('click', () => {
        this.toggleFullscreen();
    });
    
    // 迷你窗口控制按钮
    this.miniFullscreenBtn?.addEventListener('click', () => {
        this.toggleFullscreen();
    });
    
    this.miniHideBtn?.addEventListener('click', () => {
        this.hideMiniChat();
    });
    
    // 迷你发送按钮
    this.miniSendBtn?.addEventListener('click', () => {
        this.sendMiniMessage();
    });
    
    // 迷你输入框回车发送
    this.miniMessageInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.sendMiniMessage();
        }
    });
    
    // 伪装设置事件
    this.presetUrls?.addEventListener('change', () => {
        this.handlePresetUrlChange();
    });
    
    this.applyDisguiseBtn?.addEventListener('click', () => {
        this.applyDisguise();
    });
    
    this.closeSettingsBtn?.addEventListener('click', () => {
        this.hideDisguiseSettings();
    });
    
    // 全屏模式下的迷你模式切换按钮
    this.miniModeToggleItem?.addEventListener('click', () => {
        this.toggleFullscreen(); // 从全屏切换到迷你模式
    });
    
    // 迷你窗口表情按钮
    this.miniEmojiButton?.addEventListener('click', () => {
        this.toggleMiniEmojiPicker();
    });
    
    // 迷你窗口自定义表情按钮
    this.miniCustomEmojiButton?.addEventListener('click', () => {
        this.toggleMiniCustomEmojiPicker();
    });
    
    // 迷你窗口上传表情按钮
    const miniUploadEmojiBtn = document.getElementById('miniUploadEmojiBtn');
    miniUploadEmojiBtn?.addEventListener('click', () => {
        // 触发全屏版本的上传功能
        const uploadEmojiBtn = document.getElementById('uploadEmojiBtn');
        if (uploadEmojiBtn) {
            uploadEmojiBtn.click();
        }
    });
    
    // 迷你表情类别切换按钮
    const miniEmojiCategoryBtns = document.querySelectorAll('.mini-emoji-category-btn');
    console.log('找到迷你表情类别按钮数量:', miniEmojiCategoryBtns.length);
    miniEmojiCategoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了类别按钮:', btn.dataset.category);
            // 移除所有按钮的active类
            miniEmojiCategoryBtns.forEach(b => b.classList.remove('active'));
            // 给当前按钮添加active类
            btn.classList.add('active');
            // 重新加载表情
            this.loadMiniEmojis();
        });
    });
    
    // 迷你窗口图片按钮
    this.miniImageButton?.addEventListener('click', () => {
        this.miniImageInput?.click();
    });
    
    // 迷你窗口图片输入
    this.miniImageInput?.addEventListener('change', (e) => {
        this.handleMiniImageUpload(e);
    });
    
    // 点击其他地方关闭表情选择器
    document.addEventListener('click', (e) => {
        if (!this.miniEmojiButton?.contains(e.target) && !this.miniEmojiPicker?.contains(e.target)) {
            this.miniEmojiPicker.style.display = 'none';
        }
        if (!this.miniCustomEmojiButton?.contains(e.target) && !this.miniCustomEmojiPicker?.contains(e.target)) {
            this.miniCustomEmojiPicker.style.display = 'none';
        }
    });
    
    // 加载保存的伪装设置
    this.loadDisguiseSettings();
};

// 初始化快捷键
ChatClient.prototype.initKeyboardShortcuts = function() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+H: 隐藏/显示聊天窗口
        if (e.ctrlKey && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            this.toggleMiniChat();
        }
        
        // Ctrl+Shift+F: 全屏模式切换
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            this.toggleFullscreen();
        }
        
        // Ctrl+Shift+S: 显示伪装设置
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            this.showDisguiseSettings();
        }
        
        // ESC: 紧急隐藏所有聊天相关界面
        if (e.key === 'Escape') {
            this.emergencyHide();
        }
    });
};

// 更新迷你模式显示状态
ChatClient.prototype.updateMiniModeDisplay = function() {
    console.log('更新迷你模式显示状态:', { isFullscreen: this.isFullscreen, isMiniMode: this.isMiniMode });
    if (this.isFullscreen) {
        // 全屏模式
        document.body.classList.add('fullscreen-chat');
        this.disguiseContainer.style.display = 'none';
        this.miniChatControls.style.display = 'none';
        this.miniChatWindow.style.display = 'none';
        this.chatContainer.style.display = 'block';
        console.log('设置为全屏模式');
    } else if (this.isMiniMode) {
        // 迷你模式
        document.body.classList.remove('fullscreen-chat');
        this.disguiseContainer.style.display = 'block';
        this.miniChatControls.style.display = 'flex';
        this.miniChatWindow.style.display = 'block';
        this.chatContainer.style.display = 'none';
        
        console.log('设置为迷你模式，迷你消息容器:', !!this.miniMessagesContainer);
        // 切换到迷你模式时同步消息
        this.syncMessagesToMiniWindow();
    } else {
        // 隐藏聊天模式
        document.body.classList.remove('fullscreen-chat');
        this.disguiseContainer.style.display = 'block';
        this.miniChatControls.style.display = 'flex';
        this.miniChatWindow.style.display = 'none';
        this.chatContainer.style.display = 'none';
        console.log('设置为隐藏聊天模式');
    }
};

// 切换迷你聊天窗口显示
ChatClient.prototype.toggleMiniChat = function() {
    if (this.isFullscreen) {
        this.isFullscreen = false;
        this.isMiniMode = true;
    } else {
        this.isMiniMode = !this.isMiniMode;
    }
    this.updateMiniModeDisplay();
    this.saveDisplaySettings();
};

// 隐藏迷你聊天窗口
ChatClient.prototype.hideMiniChat = function() {
    this.isMiniMode = false;
    this.updateMiniModeDisplay();
    this.saveDisplaySettings();
};

// 切换全屏模式
ChatClient.prototype.toggleFullscreen = function() {
    this.isFullscreen = !this.isFullscreen;
    if (this.isFullscreen) {
        this.isMiniMode = false;
    } else {
        this.isMiniMode = true;
    }
    this.updateMiniModeDisplay();
    this.saveDisplaySettings();
};

// 紧急隐藏功能
ChatClient.prototype.emergencyHide = function() {
    this.isFullscreen = false;
    this.isMiniMode = false;
    this.hideDisguiseSettings();
    this.updateMiniModeDisplay();
};

// 显示伪装设置
ChatClient.prototype.showDisguiseSettings = function() {
    this.disguiseSettings.style.display = 'block';
};

// 隐藏伪装设置
ChatClient.prototype.hideDisguiseSettings = function() {
    this.disguiseSettings.style.display = 'none';
};

// 处理预设URL变化
ChatClient.prototype.handlePresetUrlChange = function() {
    const selected = this.presetUrls.value;
    if (selected === 'custom') {
        this.customUrlGroup.style.display = 'block';
    } else {
        this.customUrlGroup.style.display = 'none';
    }
};

// 应用伪装
ChatClient.prototype.applyDisguise = function() {
    let url;
    if (this.presetUrls.value === 'custom') {
        url = this.customUrl.value.trim();
        if (!url) {
            alert('请输入自定义网址');
            return;
        }
    } else {
        url = this.presetUrls.value;
    }
    
    this.disguiseFrame.src = url;
    this.hideDisguiseSettings();
    this.saveDisguiseSettings();
};

// 保存伪装设置
ChatClient.prototype.saveDisguiseSettings = function() {
    const settings = {
        presetUrl: this.presetUrls.value,
        customUrl: this.customUrl.value,
        currentUrl: this.disguiseFrame.src
    };
    localStorage.setItem('disguiseSettings', JSON.stringify(settings));
};

// 加载伪装设置
ChatClient.prototype.loadDisguiseSettings = function() {
    const saved = localStorage.getItem('disguiseSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            this.presetUrls.value = settings.presetUrl || 'https://zhuanlan.zhihu.com/p/376563247';
            this.customUrl.value = settings.customUrl || '';
            if (settings.currentUrl) {
                this.disguiseFrame.src = settings.currentUrl;
            }
            this.handlePresetUrlChange();
        } catch (e) {
            console.log('加载伪装设置失败:', e);
        }
    }
};

// 保存显示设置
ChatClient.prototype.saveDisplaySettings = function() {
    const settings = {
        isMiniMode: this.isMiniMode,
        isFullscreen: this.isFullscreen
    };
    localStorage.setItem('displaySettings', JSON.stringify(settings));
};

// 加载显示设置
ChatClient.prototype.loadDisplaySettings = function() {
    const saved = localStorage.getItem('displaySettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            this.isMiniMode = settings.isMiniMode !== false; // 默认true
            this.isFullscreen = settings.isFullscreen || false;
            this.updateMiniModeDisplay();
        } catch (e) {
            console.log('加载显示设置失败:', e);
        }
    }
};

// 发送迷你消息
ChatClient.prototype.sendMiniMessage = function() {
    const message = this.miniMessageInput.value.trim();
    if (!message || !this.isConnected) {
        console.log('发送迷你消息失败:', !message ? '消息为空' : '未连接');
        return;
    }
    
    console.log('发送迷你消息:', message);
    
    // 复用原有发送逻辑
    const messageData = {
        type: 'message',
        message: message,
        username: this.username,
        userId: this.userId,
        timestamp: new Date().toISOString()
    };
    
    console.log('发送的消息数据:', messageData);
    console.log('WebSocket连接状态:', this.ws.readyState);
    console.log('WebSocket连接状态说明:', this.ws.readyState === WebSocket.OPEN ? 'OPEN' : this.ws.readyState === WebSocket.CONNECTING ? 'CONNECTING' : this.ws.readyState === WebSocket.CLOSING ? 'CLOSING' : 'CLOSED');
    this.ws.send(JSON.stringify(messageData));
    
    this.miniMessageInput.value = '';
};

// 在迷你窗口中显示消息
ChatClient.prototype.displayMiniMessage = function(messageData) {
    console.log('displayMiniMessage 被调用:', messageData);
    if (!this.miniMessagesContainer) {
        console.log('displayMiniMessage: 迷你消息容器不存在');
        return;
    }
    
    console.log('迷你消息容器存在，开始显示消息');
    console.log('迷你消息容器DOM:', this.miniMessagesContainer);
    console.log('迷你消息容器当前子元素数量:', this.miniMessagesContainer.children.length);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mini-message';
    messageDiv.dataset.timestamp = messageData.timestamp;
    console.log('创建的消息元素:', messageDiv);
    
    // 判断是否为自己的消息
    if (messageData.userId === this.userId || messageData.username === this.username) {
        messageDiv.classList.add('own');
    }
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'mini-message-header';
    // 简化时间显示，使用简单的时间格式
    let timeStr;
    try {
        if (this.formatTime && messageData.timestamp) {
            timeStr = this.formatTime(messageData.timestamp);
        } else if (messageData.timestamp) {
            const date = new Date(messageData.timestamp);
            timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else {
            timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
    } catch (error) {
        // 当所有解析都失败时，尝试使用原始时间戳，最后再fallback到当前时间
        try {
            const date = new Date(messageData.timestamp);
            timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
    }
    headerDiv.textContent = `${messageData.username} • ${timeStr}`;
    console.log('创建消息头部:', headerDiv.textContent);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'mini-message-content';
    console.log('创建消息内容容器');
    
    // 处理不同类型的消息内容
    if (messageData.message_type === 'image') {
        const img = document.createElement('img');
        // 如果有file_path，说明是自定义表情，使用file_path
        // 否则是普通图片，使用message
        img.src = messageData.file_path || messageData.message;
        
        // 根据是否有file_path判断是否为自定义表情
        if (messageData.file_path) {
            // 自定义表情样式
            img.className = 'mini-custom-emoji';
            img.style.width = '32px';
            img.style.height = '32px';
            img.style.borderRadius = '4px';
        } else {
            // 普通图片样式
            img.className = 'mini-message-image';
            img.style.maxWidth = '200px';
            img.style.maxHeight = '150px';
            img.style.borderRadius = '4px';
        }
        contentDiv.appendChild(img);
    } else if (messageData.message_type === 'custom_emoji') {
        const img = document.createElement('img');
        img.src = messageData.message;
        img.className = 'mini-custom-emoji';
        img.style.width = '32px';
        img.style.height = '32px';
        contentDiv.appendChild(img);
    } else {
        // 处理文本消息和表情
        const messageText = messageData.message || '';
        contentDiv.innerHTML = this.processMessageContent ? this.processMessageContent(messageText) : messageText;
    }
    
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);
    console.log('消息元素组装完成，内容:', messageDiv.innerHTML);
    
    // 添加右键菜单和长按事件
    this.addMiniMessageEvents(messageDiv, messageData);
    
    // 按时间戳顺序插入消息
    console.log('准备插入消息到迷你容器');
    this.insertMiniMessageInOrder(messageDiv, messageData.timestamp);
    console.log('消息插入完成，容器子元素数量:', this.miniMessagesContainer.children.length);
    
    // 限制消息数量
    const messages = this.miniMessagesContainer.querySelectorAll('.mini-message');
    if (messages.length > 100) {
        messages[0].remove();
    }
    
    // console.log('迷你窗口当前消息数量:', messages.length);
    
    // 滚动到底部
    setTimeout(() => {
        this.miniMessagesContainer.scrollTop = this.miniMessagesContainer.scrollHeight;
    }, 10);
};

// 按时间戳顺序插入迷你消息
ChatClient.prototype.insertMiniMessageInOrder = function(messageDiv, timestamp) {
    console.log('insertMiniMessageInOrder 开始执行，时间戳:', timestamp);
    const messages = this.miniMessagesContainer.querySelectorAll('.mini-message');
    console.log('当前消息数量:', messages.length);
    let inserted = false;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        const existingTimestamp = messages[i].dataset.timestamp;
        if (timestamp >= existingTimestamp) {
            console.log('在位置', i + 1, '插入消息');
            messages[i].insertAdjacentElement('afterend', messageDiv);
            inserted = true;
            break;
        }
    }
    
    if (!inserted) {
        console.log('在开头插入消息');
        this.miniMessagesContainer.insertBefore(messageDiv, this.miniMessagesContainer.firstChild);
    }
    
    console.log('消息插入完成，inserted:', inserted);
};

// 更新迷你窗口状态
ChatClient.prototype.updateMiniStatus = function(status, userCount = 0) {
    if (this.miniConnectionStatus) {
        this.miniConnectionStatus.textContent = status;
    }
    if (this.miniUserCount) {
        this.miniUserCount.textContent = `${userCount}人在线`;
    }
};

// 切换迷你表情选择器
ChatClient.prototype.toggleMiniEmojiPicker = function() {
    if (!this.miniEmojiPicker) return;
    
    if (this.miniEmojiPicker.style.display === 'block') {
        this.miniEmojiPicker.style.display = 'none';
    } else {
        if (this.miniCustomEmojiPicker) {
            this.miniCustomEmojiPicker.style.display = 'none';
        }
        this.miniEmojiPicker.style.display = 'block';
        this.loadMiniEmojis();
    }
};

// 切换迷你自定义表情选择器
ChatClient.prototype.toggleMiniCustomEmojiPicker = function() {
    if (!this.miniCustomEmojiPicker) return;
    
    if (this.miniCustomEmojiPicker.style.display === 'block') {
        this.miniCustomEmojiPicker.style.display = 'none';
    } else {
        if (this.miniEmojiPicker) {
            this.miniEmojiPicker.style.display = 'none';
        }
        this.miniCustomEmojiPicker.style.display = 'block';
        this.loadMiniCustomEmojis();
    }
};

// 加载迷你表情
ChatClient.prototype.loadMiniEmojis = function() {
    this.miniEmojiGrid.innerHTML = '';
    
    // 获取当前分类
    const activeCategory = this.miniEmojiPicker.querySelector('.mini-emoji-category-btn.active');
    const category = activeCategory ? activeCategory.dataset.category : 'wechat_classic';
    console.log('加载迷你表情，当前类别:', category);
    
    // 加载对应分类的表情
    const emojis = this.getEmojisByCategory(category);
    console.log('获取到的表情数量:', emojis.length);
    emojis.slice(0, 24).forEach(emoji => { // 限制数量
        const emojiDiv = document.createElement('div');
        emojiDiv.className = 'emoji-item';
        emojiDiv.textContent = emoji.emoji;
        emojiDiv.title = emoji.name;
        emojiDiv.addEventListener('click', () => {
            this.insertMiniEmoji(emoji.emoji);
            this.miniEmojiPicker.style.display = 'none';
        });
        this.miniEmojiGrid.appendChild(emojiDiv);
    });
    
    // 分类切换事件在初始化时绑定，这里不需要重复绑定
};

// 加载迷你自定义表情
ChatClient.prototype.loadMiniCustomEmojis = function() {
    const miniCustomEmojiEmpty = document.getElementById('miniCustomEmojiEmpty');
    
    fetch('/api/custom-emojis')
        .then(response => response.json())
        .then(data => {
            this.miniCustomEmojiGrid.innerHTML = '';
            
            // 检查API响应格式
            const emojis = data.status === 'success' ? data.emojis : [];
            
            if (emojis.length === 0) {
                // 没有自定义表情时显示空状态
                if (miniCustomEmojiEmpty) {
                    miniCustomEmojiEmpty.style.display = 'flex';
                }
                this.miniCustomEmojiGrid.style.display = 'none';
            } else {
                // 有表情时隐藏空状态，显示表情
                if (miniCustomEmojiEmpty) {
                    miniCustomEmojiEmpty.style.display = 'none';
                }
                this.miniCustomEmojiGrid.style.display = 'grid';
                
                emojis.forEach(emoji => {
                    const img = document.createElement('img');
                    img.src = emoji.file_path; // 使用 file_path 而不是 filename
                    img.className = 'custom-emoji-item';
                    img.title = emoji.name;
                    img.addEventListener('click', () => {
                        this.sendMiniCustomEmoji(emoji);
                        this.miniCustomEmojiPicker.style.display = 'none';
                    });
                    this.miniCustomEmojiGrid.appendChild(img);
                });
            }
        })
        .catch(error => {
            console.error('加载自定义表情失败:', error);
            // 出错时也显示空状态
            if (miniCustomEmojiEmpty) {
                miniCustomEmojiEmpty.style.display = 'flex';
            }
            this.miniCustomEmojiGrid.style.display = 'none';
        });
};

// 插入表情到迷你输入框
ChatClient.prototype.insertMiniEmoji = function(emoji) {
    const input = this.miniMessageInput;
    const cursorPos = input.selectionStart;
    const textBefore = input.value.substring(0, cursorPos);
    const textAfter = input.value.substring(input.selectionEnd);
    
    input.value = textBefore + emoji + textAfter;
    input.focus();
    input.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
};

// 发送迷你自定义表情
ChatClient.prototype.sendMiniCustomEmoji = function(emoji) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket连接未就绪');
        return;
    }
    
    // 发送自定义表情作为图片消息，与全屏版本保持一致
    const messageData = {
        type: 'message',
        message_type: 'image',
        message: emoji.name,
        file_path: emoji.file_path,
        timestamp: new Date().toISOString()
    };
    
    this.ws.send(JSON.stringify(messageData));
};

// 处理迷你图片上传
ChatClient.prototype.handleMiniImageUpload = function(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // 复用原有的图片上传逻辑
    Array.from(files).forEach(file => {
        this.uploadImage(file);
    });
    
    // 清空input
    event.target.value = '';
};

// 获取表情分类数据 (简化版)
ChatClient.prototype.getEmojisByCategory = function(category) {
    // 如果有全局的表情数据，使用它
    if (typeof WECHAT_EMOJIS_DATA !== 'undefined' && WECHAT_EMOJIS_DATA[category]) {
        return WECHAT_EMOJIS_DATA[category].emojis.map(emoji => ({
            emoji: String.fromCodePoint(parseInt(emoji.unicode, 16)),
            name: emoji.name
        }));
    }
    
    // fallback：根据类别返回不同的基础表情
    const emojisByCategory = {
        wechat_classic: [
            {emoji: '😊', name: '微笑'}, {emoji: '😂', name: '笑哭'}, {emoji: '🤣', name: '打滚笑'},
            {emoji: '😍', name: '花痴'}, {emoji: '🥰', name: '可爱'}, {emoji: '😘', name: '飞吻'},
            {emoji: '🤔', name: '思考'}, {emoji: '😅', name: '苦笑'}, {emoji: '😇', name: '天使'},
            {emoji: '🙂', name: '淡定'}, {emoji: '😉', name: '眨眼'}, {emoji: '😌', name: '舒服'}
        ],
        smileys: [
            {emoji: '😀', name: '笑脸'}, {emoji: '😃', name: '开心'}, {emoji: '😄', name: '大笑'},
            {emoji: '😁', name: '咧嘴笑'}, {emoji: '😆', name: '眯眼笑'}, {emoji: '😊', name: '微笑'},
            {emoji: '😇', name: '天使'}, {emoji: '🙂', name: '淡定'}, {emoji: '🙃', name: '倒脸'},
            {emoji: '😉', name: '眨眼'}, {emoji: '😌', name: '舒服'}, {emoji: '😋', name: '美味'}
        ],
        people: [
            {emoji: '👋', name: '挥手'}, {emoji: '🤚', name: '举手'}, {emoji: '🖐️', name: '张开手'},
            {emoji: '✋', name: '停止'}, {emoji: '🖖', name: '瓦肯礼'}, {emoji: '👌', name: 'OK'},
            {emoji: '🤌', name: '捏手指'}, {emoji: '🤏', name: '一点点'}, {emoji: '✌️', name: '胜利'},
            {emoji: '🤞', name: '交叉手指'}, {emoji: '🤟', name: '爱你'}, {emoji: '🤘', name: '摇滚'}
        ],
        animals: [
            {emoji: '🐶', name: '狗'}, {emoji: '🐱', name: '猫'}, {emoji: '🐭', name: '老鼠'},
            {emoji: '🐹', name: '仓鼠'}, {emoji: '🐰', name: '兔子'}, {emoji: '🦊', name: '狐狸'},
            {emoji: '🐻', name: '熊'}, {emoji: '🐼', name: '熊猫'}, {emoji: '🐨', name: '考拉'},
            {emoji: '🐯', name: '老虎'}, {emoji: '🦁', name: '狮子'}, {emoji: '🐮', name: '牛'}
        ]
    };
    
    return emojisByCategory[category] || emojisByCategory.wechat_classic;
};

// 为迷你消息添加事件
ChatClient.prototype.addMiniMessageEvents = function(messageDiv, messageData) {
    let longPressTimer = null;
    
    // 长按开始
    const startLongPress = (e) => {
        e.preventDefault();
        longPressTimer = setTimeout(() => {
            this.showMiniQuoteMenu(messageDiv, messageData);
        }, 500);
    };
    
    // 长按结束
    const endLongPress = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };
    
    // 触摸事件
    messageDiv.addEventListener('touchstart', startLongPress);
    messageDiv.addEventListener('touchend', endLongPress);
    messageDiv.addEventListener('touchmove', endLongPress);
    
    // 鼠标事件
    messageDiv.addEventListener('mousedown', startLongPress);
    messageDiv.addEventListener('mouseup', endLongPress);
    messageDiv.addEventListener('mouseleave', endLongPress);
    
    // 右键菜单
    messageDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showMiniQuoteMenu(messageDiv, messageData);
    });
};

// 显示迷你引用菜单
ChatClient.prototype.showMiniQuoteMenu = function(messageDiv, messageData) {
    // 简单的确认对话框
    if (confirm('引用这条消息？')) {
        this.quoteMiniMessage(messageData);
    }
};

// 引用迷你消息
ChatClient.prototype.quoteMiniMessage = function(messageData) {
    const quoteText = `"${messageData.username}: ${messageData.message}" `;
    this.miniMessageInput.value = quoteText + this.miniMessageInput.value;
    this.miniMessageInput.focus();
    this.miniMessageInput.setSelectionRange(quoteText.length, quoteText.length);
};

// 同步消息到迷你窗口
ChatClient.prototype.syncMessagesToMiniWindow = function() {
    if (!this.miniMessagesContainer) {
        console.log('迷你消息容器不存在');
        return;
    }
    
    // 清空迷你窗口消息
    this.miniMessagesContainer.innerHTML = '';
    
    // 获取主界面的所有消息
    const messages = this.messagesContainer.querySelectorAll('.message');
    // console.log('同步消息到迷你窗口，主界面消息数量:', messages.length);
    
    let syncedCount = 0;
    messages.forEach(messageEl => {
        // 从DOM元素获取消息数据
        const messageData = this.extractMessageDataFromElement(messageEl);
        if (messageData) {
            this.displayMiniMessage(messageData);
            syncedCount++;
        }
    });
    
    // console.log('成功同步消息数量:', syncedCount);
};

// 从DOM元素提取消息数据
ChatClient.prototype.extractMessageDataFromElement = function(messageEl) {
    try {
        const usernameEl = messageEl.querySelector('.message-username');
        const contentEl = messageEl.querySelector('.message-text');
        const timestampEl = messageEl.querySelector('.message-time');
        const imageEl = messageEl.querySelector('.message-image');
        
        // 获取用户名（对于自己的消息可能没有用户名元素）
        const username = usernameEl ? usernameEl.textContent.trim() : (messageEl.dataset.username || '我');
        // 时间戳处理：优先使用dataset中保存的原始时间戳
        let timestamp = messageEl.dataset.timestamp;
        if (!timestamp) {
            // 如果没有保存的时间戳，尝试从时间元素解析或使用当前时间
            timestamp = new Date().toISOString();
        }
        const isOwnMessage = messageEl.classList.contains('message-user');
        
        // 检查消息类型
        if (imageEl) {
            // 图片消息
            return {
                username: username,
                message: imageEl.src,
                message_type: 'image',
                timestamp: timestamp,
                userId: isOwnMessage ? this.userId : 'other'
            };
        } else if (contentEl) {
            // 文本消息
            return {
                username: username,
                message: contentEl.textContent || contentEl.innerHTML,
                message_type: 'text',
                timestamp: timestamp,
                userId: isOwnMessage ? this.userId : 'other'
            };
        } else {
            console.warn('无法找到消息内容元素:', messageEl);
            return null;
        }
    } catch (error) {
        console.error('提取消息数据失败:', error, messageEl);
        return null;
    }
};

async function uploadCustomEmoji() {
    const name = document.getElementById('emojiName').value.trim();
    const file = window.selectedEmojiFile;
    
    if (!name) {
        alert('请输入表情名称');
        return;
    }
    
    if (!file) {
        alert('请选择图片文件');
        return;
    }
    
    const saveBtn = document.getElementById('saveEmojiBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = '上传中...';
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);
        formData.append('uploader', window.chatClient.username);
        
        const response = await fetch('/upload-custom-emoji', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            closeCustomEmojiUploadModal();
            window.chatClient.loadCustomEmojis(); // 刷新表情列表
            // 同时刷新迷你窗口的表情列表
            if (window.chatClient && window.chatClient.loadMiniCustomEmojis) {
                window.chatClient.loadMiniCustomEmojis();
            }
            alert('自定义表情上传成功！');
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('上传失败:', error);
        alert('上传失败，请重试');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
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