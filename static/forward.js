// 转发消息功能 - 独立模块
class ForwardMessageHandler {
    constructor(chatClient) {
        this.chatClient = chatClient;
        this.messageCache = {};
        this._eventsBound = false;  // 标记事件是否已绑定
        this.initForwardDetailsEvents();
    }

    // 显示转发消息详情弹窗
    async showForwardDetails(messageId) {
        console.log('点击转发消息，ID:', messageId);
        
        // 查找对应的消息元素
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) {
            console.error('找不到对应的消息:', messageId);
            return;
        }

        // 获取消息数据
        let messageData = this.getMessageDataFromElement(messageElement);
        
        // 如果缓存中没有数据，尝试通过API获取
        if (!messageData) {
            console.log('缓存中没有数据，尝试通过API获取');
            messageData = await this.fetchForwardDetails(messageId);
        }
        
        if (!messageData || messageData.message_type !== 'forward_group') {
            console.error('消息类型不是转发组:', messageData);
            // 临时处理：显示提示信息
            alert('无法获取转发消息详情，请刷新页面后重试');
            return;
        }

        const forwardData = messageData.quotedMessage;
        if (!forwardData || !forwardData.messages) {
            console.error('转发数据不完整:', forwardData);
            alert('转发消息数据不完整');
            return;
        }

        console.log('显示转发详情，消息数量:', forwardData.messages.length);
        this.displayForwardDetailsModal(forwardData.messages);
    }

    // 从消息元素获取消息数据
    getMessageDataFromElement(messageElement) {
        const messageId = messageElement.dataset.messageId;
        
        // 查找已存储的消息数据
        if (this.messageCache && this.messageCache[messageId]) {
            return this.messageCache[messageId];
        }
        
        // 如果没有缓存，尝试通过API获取转发数据
        console.warn('未找到消息缓存，消息ID:', messageId);
        return null;
    }

    // 异步获取转发消息详情（通过API）
    async fetchForwardDetails(messageId) {
        try {
            const response = await fetch(`/api/message-details/${messageId}`);
            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success') {
                    // 缓存获取的数据
                    this.cacheMessage(result.data);
                    return result.data;
                }
            }
        } catch (error) {
            console.error('获取转发消息详情失败:', error);
        }
        return null;
    }

    // 显示转发详情弹窗
    displayForwardDetailsModal(messages) {
        const modal = document.getElementById('forwardDetailsModal');
        const messagesList = document.getElementById('forwardMessagesList');
        
        if (!modal || !messagesList) {
            console.error('找不到转发详情弹窗元素');
            return;
        }

        // 清空现有内容
        messagesList.innerHTML = '';

        // 生成转发消息列表
        messages.forEach(msg => {
            const messageItem = this.createForwardMessageItem(msg);
            messagesList.appendChild(messageItem);
        });

        // 确保事件绑定已完成
        this.ensureForwardDetailsEvents();

        // 显示弹窗
        modal.style.display = 'block';
    }

    // 创建转发消息项
    createForwardMessageItem(messageData) {
        const messageItem = document.createElement('div');
        messageItem.className = 'forward-message-item';

        const timeString = messageData.timestamp ? this.chatClient.formatTime(messageData.timestamp) : '';
        
        let contentHtml = '';
        if (messageData.message_type === 'image' && messageData.file_path) {
            contentHtml = `
                <div class="forward-message-content">
                    <img src="${messageData.file_path}" alt="${this.chatClient.escapeHtml(messageData.message)}" class="forward-message-image" loading="lazy">
                    <div class="forward-message-filename">${this.chatClient.escapeHtml(messageData.message)}</div>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="forward-message-content">${this.chatClient.escapeHtml(messageData.message)}</div>
            `;
        }

        messageItem.innerHTML = `
            <div class="forward-message-header">
                <span class="forward-message-username">${this.chatClient.escapeHtml(messageData.username)}</span>
                <span class="forward-message-time">${timeString}</span>
            </div>
            ${contentHtml}
        `;

        return messageItem;
    }

    // 初始化转发详情弹窗事件
    initForwardDetailsEvents() {
        // 如果DOM已加载完成，直接绑定
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this.bindForwardDetailsEvents();
        } else {
            // 否则等待DOM加载完成
            document.addEventListener('DOMContentLoaded', () => {
                this.bindForwardDetailsEvents();
            });
        }
    }

    // 确保转发详情事件已绑定（供显示弹窗时调用）
    ensureForwardDetailsEvents() {
        // 检查是否已经绑定过事件
        if (!this._eventsBound) {
            this.bindForwardDetailsEvents();
        }
    }

    // 绑定转发详情弹窗事件
    bindForwardDetailsEvents() {
        // 防止重复绑定
        if (this._eventsBound) {
            return;
        }

        const modal = document.getElementById('forwardDetailsModal');
        const overlay = document.getElementById('forwardDetailsOverlay');
        const closeBtn = document.getElementById('closeForwardDetailsBtn');

        console.log('绑定转发详情弹窗事件', {modal: !!modal, overlay: !!overlay, closeBtn: !!closeBtn});

        // 创建关闭处理函数
        const closeHandler = () => {
            console.log('关闭转发详情弹窗');
            this.closeForwardDetailsModal();
        };

        // 绑定事件监听器
        if (closeBtn) {
            closeBtn.addEventListener('click', closeHandler);
            console.log('已绑定关闭按钮点击事件');
        }
        if (overlay) {
            overlay.addEventListener('click', closeHandler);
            console.log('已绑定遮罩层点击事件');
        }

        // ESC键关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display === 'block') {
                this.closeForwardDetailsModal();
            }
        });

        // 标记已绑定
        this._eventsBound = true;
    }

    // 关闭转发详情弹窗
    closeForwardDetailsModal() {
        console.log('执行关闭转发详情弹窗');
        const modal = document.getElementById('forwardDetailsModal');
        if (modal) {
            console.log('找到modal元素，设置display为none');
            modal.style.display = 'none';
        } else {
            console.error('未找到转发详情弹窗元素');
        }
    }

    // 缓存消息数据
    cacheMessage(messageData) {
        if (messageData.id) {
            this.messageCache[messageData.id] = messageData;
        }
    }

    // 更新createMessageElement以支持转发消息
    updateCreateMessageElement(data) {
        // 检查是否是转发消息组
        if (data.message_type === 'forward_group') {
            const forwardData = data.quotedMessage || {};
            const messageCount = forwardData.message_count || 0;
            
            return `
                <div class="forward-group-indicator">
                    <span>📋 聊天记录</span>
                    <span class="forward-group-count">${messageCount}条</span>
                </div>
                <div class="forward-group-preview" onclick="window.forwardHandler.showForwardDetails('${data.id}')">
                    <div class="message-text">${this.chatClient.escapeHtml(data.message)}</div>
                    <div class="forward-expand-hint">点击查看详细聊天记录</div>
                </div>
            `;
        }
        return null; // 不是转发消息，返回null让原函数处理
    }
}

// 全局函数供HTML onclick调用
async function showForwardDetails(messageId) {
    console.log('全局函数被调用，messageId:', messageId);
    if (window.forwardHandler) {
        await window.forwardHandler.showForwardDetails(messageId);
    } else {
        console.error('forwardHandler未初始化');
    }
}

// 在聊天客户端初始化时创建转发处理器
document.addEventListener('DOMContentLoaded', function() {
    // 等待chatClient初始化完成后再创建转发处理器
    setTimeout(() => {
        if (window.chatClient) {
            window.forwardHandler = new ForwardMessageHandler(window.chatClient);
        }
    }, 100);
});