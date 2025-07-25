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
        
        # 检查是否需要添加password列（数据库迁移）
        cursor.execute("PRAGMA table_info(rooms)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'password' not in columns:
            cursor.execute('ALTER TABLE rooms ADD COLUMN password TEXT')
            print("数据库迁移：已添加password列")
        
        # 检查是否需要添加图片消息支持字段（数据库迁移）
        cursor.execute("PRAGMA table_info(messages)")
        message_columns = [column[1] for column in cursor.fetchall()]
        if 'message_type' not in message_columns:
            cursor.execute('ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT "text"')
            print("数据库迁移：已添加message_type列")
        if 'file_path' not in message_columns:
            cursor.execute('ALTER TABLE messages ADD COLUMN file_path TEXT')
            print("数据库迁移：已添加file_path列")
        if 'quoted_message' not in message_columns:
            cursor.execute('ALTER TABLE messages ADD COLUMN quoted_message TEXT')
            print("数据库迁移：已添加quoted_message列")
        
        # 创建自定义表情表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS custom_emojis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                file_path TEXT NOT NULL,
                uploader TEXT NOT NULL,
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
        
        cursor.execute('SELECT name, description, password, created_at FROM rooms ORDER BY name')
        rooms = []
        for row in cursor.fetchall():
            rooms.append({
                'name': row[0],
                'description': row[1],
                'has_password': bool(row[2]),  # 只返回是否有密码，不返回密码本身
                'created_at': row[3]
            })
        
        conn.close()
        return rooms
    
    def create_room(self, name: str, description: str = "", password: str = "") -> bool:
        """创建新聊天室"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('INSERT INTO rooms (name, description, password) VALUES (?, ?, ?)', 
                         (name, description, password if password else None))
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            # 房间名已存在
            return False
    
    def verify_room_password(self, room_name: str, password: str = "") -> bool:
        """验证聊天室密码"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT password FROM rooms WHERE name = ?', (room_name,))
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return False  # 房间不存在
            
        stored_password = result[0]
        if stored_password is None:
            return True  # 没有设置密码，可以直接进入
        
        return stored_password == password  # 密码匹配
    
    def update_room_password(self, room_name: str, new_password: str = "") -> bool:
        """更新聊天室密码"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 检查聊天室是否存在
            cursor.execute('SELECT name FROM rooms WHERE name = ?', (room_name,))
            if not cursor.fetchone():
                conn.close()
                return False
            
            # 更新密码（空字符串表示取消密码保护）
            cursor.execute('UPDATE rooms SET password = ? WHERE name = ?', 
                         (new_password if new_password else None, room_name))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"更新聊天室密码错误: {e}")
            return False
    
    def save_custom_emoji(self, name: str, file_path: str, uploader: str) -> bool:
        """保存自定义表情"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO custom_emojis (name, file_path, uploader) 
                VALUES (?, ?, ?)
            ''', (name, file_path, uploader))
            
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            print(f"表情名称 '{name}' 已存在")
            return False
        except Exception as e:
            print(f"保存自定义表情错误: {e}")
            return False
    
    def get_custom_emojis(self) -> List[Dict]:
        """获取所有自定义表情"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, file_path, uploader, created_at 
            FROM custom_emojis 
            ORDER BY created_at DESC
        ''')
        
        emojis = []
        for row in cursor.fetchall():
            emojis.append({
                'id': row[0],
                'name': row[1],
                'file_path': row[2],
                'uploader': row[3],
                'created_at': row[4]
            })
        
        conn.close()
        return emojis
    
    def delete_custom_emoji(self, emoji_id: int, uploader: str) -> bool:
        """删除自定义表情（只有上传者可以删除）"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 检查是否为上传者
            cursor.execute('SELECT uploader FROM custom_emojis WHERE id = ?', (emoji_id,))
            result = cursor.fetchone()
            
            if not result or result[0] != uploader:
                conn.close()
                return False
            
            cursor.execute('DELETE FROM custom_emojis WHERE id = ?', (emoji_id,))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"删除自定义表情错误: {e}")
            return False
    
    def save_message(self, room_name: str, username: str, message: str, message_type: str = "text", file_path: str = None, quoted_message: dict = None) -> None:
        """保存消息到数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 将引用消息转换为JSON字符串
        quoted_message_json = json.dumps(quoted_message) if quoted_message else None
        
        cursor.execute('''
            INSERT INTO messages (room_name, username, message, message_type, file_path, quoted_message, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (room_name, username, message, message_type, file_path, quoted_message_json, datetime.now().isoformat()))
        
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
            # 分页查询：获取指定时间之前的消息，使用id和timestamp双重排序确保稳定性
            cursor.execute('''
                SELECT id, username, message, timestamp, message_type, file_path, quoted_message 
                FROM messages 
                WHERE room_name = ? AND timestamp < ?
                ORDER BY timestamp DESC, id DESC 
                LIMIT ?
            ''', (room_name, before_timestamp, limit))
        else:
            # 初始查询：获取最新的消息
            cursor.execute('''
                SELECT id, username, message, timestamp, message_type, file_path, quoted_message 
                FROM messages 
                WHERE room_name = ? 
                ORDER BY timestamp DESC, id DESC 
                LIMIT ?
            ''', (room_name, limit))
        
        messages = []
        for row in cursor.fetchall():
            message_data = {
                'id': row[0],
                'username': row[1],
                'message': row[2],
                'timestamp': row[3],
                'message_type': row[4] or 'text',  # 默认为text类型
                'file_path': row[5]
            }
            
            # 解析引用消息JSON
            if row[6]:  # quoted_message字段
                try:
                    message_data['quotedMessage'] = json.loads(row[6])
                except json.JSONDecodeError:
                    pass  # 如果JSON解析失败，忽略引用消息
            
            messages.append(message_data)
        
        # 反转顺序使最早的消息在前面（时间升序显示）
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

    def search_messages(self, room_name: str, keyword: str, search_username: bool = True, 
                       search_message: bool = True, limit: int = 20, offset: int = 0) -> Dict:
        """在指定聊天室中搜索消息
        
        Args:
            room_name: 聊天室名称
            keyword: 搜索关键词
            search_username: 是否搜索用户名
            search_message: 是否搜索消息内容
            limit: 返回结果数量限制
            offset: 偏移量（用于分页）
        
        Returns:
            包含搜索结果和总数的字典
        """
        if not keyword.strip():
            return {"messages": [], "total_count": 0}
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 构建搜索条件
        search_conditions = []
        search_params = [room_name]
        
        if search_username and search_message:
            search_conditions.append("(username LIKE ? OR message LIKE ?)")
            search_params.extend([f"%{keyword}%", f"%{keyword}%"])
        elif search_username:
            search_conditions.append("username LIKE ?")
            search_params.append(f"%{keyword}%")
        elif search_message:
            search_conditions.append("message LIKE ?")
            search_params.append(f"%{keyword}%")
        else:
            # 如果两个都不选择，默认搜索消息内容
            search_conditions.append("message LIKE ?")
            search_params.append(f"%{keyword}%")
        
        where_clause = "WHERE room_name = ? AND " + " AND ".join(search_conditions)
        
        # 获取搜索结果总数
        count_query = f"SELECT COUNT(*) FROM messages {where_clause}"
        cursor.execute(count_query, search_params)
        total_count = cursor.fetchone()[0]
        
        # 获取搜索结果（按时间倒序，最新的在前）
        search_query = f'''
            SELECT id, username, message, timestamp, message_type, file_path, quoted_message 
            FROM messages 
            {where_clause}
            ORDER BY timestamp DESC 
            LIMIT ? OFFSET ?
        '''
        search_params.extend([limit, offset])
        cursor.execute(search_query, search_params)
        
        messages = []
        for row in cursor.fetchall():
            message_data = {
                'id': row[0],
                'username': row[1],
                'message': row[2],
                'timestamp': row[3],
                'message_type': row[4] or 'text',
                'file_path': row[5]
            }
            
            # 解析引用消息JSON
            if row[6]:
                try:
                    message_data['quotedMessage'] = json.loads(row[6])
                except json.JSONDecodeError:
                    pass
            
            messages.append(message_data)
        
        conn.close()
        return {
            "messages": messages,
            "total_count": total_count
        }
    
    def get_message_by_id(self, message_id: str) -> Optional[Dict]:
        """根据消息ID获取单条消息详情"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT id, username, message, timestamp, message_type, file_path, quoted_message, room_name
                FROM messages 
                WHERE id = ?
            ''', (message_id,))
            
            row = cursor.fetchone()
            if not row:
                return None
                
            message_data = {
                'id': row[0],
                'username': row[1],
                'message': row[2],
                'timestamp': row[3],
                'message_type': row[4] or 'text',
                'file_path': row[5],
                'room_name': row[7]
            }
            
            # 解析引用消息JSON（转发数据）
            if row[6]:
                try:
                    message_data['quotedMessage'] = json.loads(row[6])
                except json.JSONDecodeError:
                    pass
            
            return message_data
            
        except Exception as e:
            print(f"获取消息详情错误: {e}")
            return None
        finally:
            conn.close() 