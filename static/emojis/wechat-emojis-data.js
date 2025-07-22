// 微信表情数据映射
// 使用Twemoji CDN + 微信特色表情的混合方案

const WECHAT_EMOJIS_DATA = {
    // 微信经典表情 - 最常用的30个
    wechat_classic: {
        name: '微信经典',
        icon: '😊',
        emojis: [
            // 基础笑容系列
            {
                unicode: '1f60a',
                name: '微笑',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f60a.png',
                keywords: ['微笑', '笑', '开心', '高兴']
            },
            {
                unicode: '1f602',
                name: '笑哭',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f602.png',
                keywords: ['笑哭', '大笑', '哈哈', '太好笑了']
            },
            {
                unicode: '1f923',
                name: '打滚笑',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f923.png',
                keywords: ['打滚', '笑死了', '太搞笑', '笑翻了']
            },
            {
                unicode: '1f60d',
                name: '花痴',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f60d.png',
                keywords: ['花痴', '爱心眼', '喜欢', '爱了']
            },
            {
                unicode: '1f970',
                name: '可爱',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f970.png',
                keywords: ['可爱', '萌', '爱心', '开心']
            },
            {
                unicode: '1f618',
                name: '飞吻',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f618.png',
                keywords: ['飞吻', '么么哒', '亲亲', '爱你']
            },
            {
                unicode: '1f914',
                name: '思考',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f914.png',
                keywords: ['思考', '想想', '嗯', '思索']
            },
            {
                unicode: '1f605',
                name: '尴尬',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f605.png',
                keywords: ['尴尬', '汗', '无语', '冷汗']
            },
            {
                unicode: '1f644',
                name: '翻白眼',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f644.png',
                keywords: ['翻白眼', '无语', '鄙视', '没眼看']
            },
            {
                unicode: '1f624',
                name: '哼',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f624.png',
                keywords: ['哼', '生气', '不开心', '愤怒']
            },
            {
                unicode: '1f621',
                name: '怒',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f621.png',
                keywords: ['怒', '愤怒', '气死了', '火大']
            },
            {
                unicode: '1f97a',
                name: '委屈',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f97a.png',
                keywords: ['委屈', '可怜', '哭', '难受']
            },
            {
                unicode: '1f622',
                name: '哭',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f622.png',
                keywords: ['哭', '难过', '伤心', '眼泪']
            },
            {
                unicode: '1f630',
                name: '害怕',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f630.png',
                keywords: ['害怕', '恐惧', '紧张', '担心']
            },
            {
                unicode: '1f634',
                name: '睡觉',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f634.png',
                keywords: ['睡觉', '困', '睡着了', '休息']
            },
            {
                unicode: '1f62a',
                name: '困',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f62a.png',
                keywords: ['困', '想睡', '累', '疲倦']
            },
            {
                unicode: '1f924',
                name: '流口水',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f924.png',
                keywords: ['流口水', '好吃', '想吃', '馋']
            },
            {
                unicode: '1f60e',
                name: '酷',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f60e.png',
                keywords: ['酷', '墨镜', '帅', '厉害']
            },
            {
                unicode: '1f913',
                name: '书呆子',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f913.png',
                keywords: ['书呆子', '学霸', '眼镜', '学习']
            },
            {
                unicode: '1f929',
                name: '星星眼',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f929.png',
                keywords: ['星星眼', '崇拜', '羡慕', '厉害']
            }
        ]
    },

    // 热门手势表情
    wechat_gestures: {
        name: '手势表情',
        icon: '👍',
        emojis: [
            {
                unicode: '1f44d',
                name: '赞',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f44d.png',
                keywords: ['赞', '好', '点赞', '同意']
            },
            {
                unicode: '1f44e',
                name: '踩',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f44e.png',
                keywords: ['踩', '不好', '反对', '不赞成']
            },
            {
                unicode: '1f44f',
                name: '鼓掌',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f44f.png',
                keywords: ['鼓掌', '厉害', '棒', '精彩']
            },
            {
                unicode: '1f91d',
                name: '握手',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f91d.png',
                keywords: ['握手', '合作', '友谊', '和解']
            },
            {
                unicode: '1f64f',
                name: '祈祷',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f64f.png',
                keywords: ['祈祷', '拜托', '求求了', '谢谢']
            },
            {
                unicode: '1f4aa',
                name: '加油',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4aa.png',
                keywords: ['加油', '力量', '坚持', '努力']
            },
            {
                unicode: '1f44b',
                name: '挥手',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f44b.png',
                keywords: ['挥手', '你好', '再见', '招手']
            },
            {
                unicode: '270b',
                name: '停',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/270b.png',
                keywords: ['停', '等等', '暂停', '别']
            },
            {
                unicode: '1f44c',
                name: 'OK',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f44c.png',
                keywords: ['OK', '好的', '没问题', '完美']
            },
            {
                unicode: '1f440',
                name: '看',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f440.png',
                keywords: ['看', '眼睛', '注意', '观察']
            }
        ]
    },

    // 聊天常用表情
    wechat_chat: {
        name: '聊天常用',
        icon: '💬',
        emojis: [
            {
                unicode: '1f525',
                name: '火',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f525.png',
                keywords: ['火', '热', '厉害', '牛']
            },
            {
                unicode: '2728',
                name: '闪亮',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2728.png',
                keywords: ['闪亮', '漂亮', '棒', '好看']
            },
            {
                unicode: '1f389',
                name: '庆祝',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f389.png',
                keywords: ['庆祝', '恭喜', '开心', '成功']
            },
            {
                unicode: '1f38a',
                name: '拉花',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f38a.png',
                keywords: ['拉花', '庆祝', '开心', '派对']
            },
            {
                unicode: '1f4af',
                name: '满分',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4af.png',
                keywords: ['满分', '100', '完美', '棒']
            },
            {
                unicode: '2764-fe0f',
                name: '红心',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2764.png',
                keywords: ['红心', '爱', '喜欢', '心']
            },
            {
                unicode: '1f494',
                name: '心碎',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f494.png',
                keywords: ['心碎', '难过', '伤心', '失恋']
            },
            {
                unicode: '1f4b0',
                name: '钱',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4b0.png',
                keywords: ['钱', '发财', '土豪', '富有']
            },
            {
                unicode: '1f4b8',
                name: '飞钱',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4b8.png',
                keywords: ['飞钱', '花钱', '破产', '没钱']
            },
            {
                unicode: '1f37a',
                name: '干杯',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f37a.png',
                keywords: ['干杯', '喝酒', '庆祝', '聚会']
            },
            {
                unicode: '1f382',
                name: '生日',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f382.png',
                keywords: ['生日', '蛋糕', '庆祝', '祝福']
            },
            {
                unicode: '2744-fe0f',
                name: '雪花',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2744.png',
                keywords: ['雪花', '冷', '下雪', '冬天']
            },
            {
                unicode: '2b50',
                name: '星星',
                url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2b50.png',
                keywords: ['星星', '亮', '好', '棒']
            }
        ]
    }
};

// 导出数据供聊天系统使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WECHAT_EMOJIS_DATA;
} else if (typeof window !== 'undefined') {
    window.WECHAT_EMOJIS_DATA = WECHAT_EMOJIS_DATA;
}