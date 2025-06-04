import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional

class ChatDatabase:
    def __init__(self, db_path: str = "chat.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self) -> None:
        """初始化数据库，创建必要的表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 创建聊天室表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 创建消息表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_name TEXT NOT NULL,
                username TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_name) REFERENCES rooms (name)
            )
        ''')
        
        # 创建默认聊天室
        cursor.execute('''
            INSERT OR IGNORE INTO rooms (name, description) 
            VALUES ('大厅', '欢迎来到聊天大厅，这里是大家交流的地方')
        ''')
        
        cursor.execute('''
            INSERT OR IGNORE INTO rooms (name, description) 
            VALUES ('技术讨论', '技术爱好者的交流天地')
        ''')
        
        cursor.execute('''
            INSERT OR IGNORE INTO rooms (name, description) 
            VALUES ('闲聊', '随便聊聊，放松心情')
        ''')
        
        conn.commit()
        conn.close()
    
    def get_rooms(self) -> List[Dict]:
        """获取所有聊天室列表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT name, description, created_at FROM rooms ORDER BY name')
        rooms = []
        for row in cursor.fetchall():
            rooms.append({
                'name': row[0],
                'description': row[1],
                'created_at': row[2]
            })
        
        conn.close()
        return rooms
    
    def create_room(self, name: str, description: str = "") -> bool:
        """创建新聊天室"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('INSERT INTO rooms (name, description) VALUES (?, ?)', 
                         (name, description))
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            # 房间名已存在
            return False
    
    def save_message(self, room_name: str, username: str, message: str) -> None:
        """保存消息到数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO messages (room_name, username, message, timestamp) 
            VALUES (?, ?, ?, ?)
        ''', (room_name, username, message, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
    
    def get_messages(self, room_name: str, limit: int = 50, before_timestamp: Optional[str] = None) -> List[Dict]:
        """获取指定聊天室的消息历史
        
        Args:
            room_name: 聊天室名称
            limit: 获取消息数量限制
            before_timestamp: 获取此时间戳之前的消息（用于分页）
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if before_timestamp:
            # 分页查询：获取指定时间之前的消息
            cursor.execute('''
                SELECT id, username, message, timestamp 
                FROM messages 
                WHERE room_name = ? AND timestamp < ?
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (room_name, before_timestamp, limit))
        else:
            # 初始查询：获取最新的消息
            cursor.execute('''
                SELECT id, username, message, timestamp 
                FROM messages 
                WHERE room_name = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (room_name, limit))
        
        messages = []
        for row in cursor.fetchall():
            messages.append({
                'id': row[0],
                'username': row[1],
                'message': row[2],
                'timestamp': row[3]
            })
        
        # 按时间正序返回（最早的在前面）
        messages.reverse()
        conn.close()
        return messages
    
    def get_message_count(self, room_name: str) -> int:
        """获取指定聊天室的消息总数"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM messages WHERE room_name = ?', (room_name,))
        count = cursor.fetchone()[0]
        
        conn.close()
        return count 