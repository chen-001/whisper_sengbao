from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Form, UploadFile, File, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import json
import asyncio
import os
import uuid
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set
from database import ChatDatabase

app = FastAPI(title="多人在线聊天室")

# 静态文件和模板配置
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# 数据库实例
db = ChatDatabase()

# 图片上传配置
UPLOAD_DIR = "static/uploads"
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# 确保上传目录存在
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_file_extension(filename: str) -> str:
    """获取文件扩展名"""
    return os.path.splitext(filename.lower())[1]

def generate_filename(original_filename: str) -> str:
    """生成唯一的文件名"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    extension = get_file_extension(original_filename)
    return f"{timestamp}_{unique_id}_{original_filename}"

def validate_image_file(file: UploadFile) -> bool:
    """验证图片文件"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        return False
    
    extension = get_file_extension(file.filename)
    if extension not in ALLOWED_EXTENSIONS:
        return False
        
    return True

# 存储活跃的WebSocket连接
class ConnectionManager:
    def __init__(self):
        # 存储每个房间的连接：{room_name: {user_id: websocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # 存储用户信息：{user_id: {username, room}}
        self.users: Dict[str, Dict[str, str]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str, username: str, room: str):
        """用户连接到指定房间"""
        # WebSocket已经在调用者中accept了，这里不需要再次accept
        
        if room not in self.active_connections:
            self.active_connections[room] = {}
        
        self.active_connections[room][user_id] = websocket
        self.users[user_id] = {"username": username, "room": room}
        
        # 通知房间内其他用户有新用户加入
        await self.broadcast_to_room(room, {
            "type": "system",
            "message": f"{username} 加入了聊天室",
            "timestamp": None
        }, exclude_user=user_id)
    
    def disconnect(self, user_id: str):
        """用户断开连接"""
        if user_id in self.users:
            user_info = self.users[user_id]
            room = user_info["room"]
            username = user_info["username"]
            
            # 从连接列表中移除
            if room in self.active_connections and user_id in self.active_connections[room]:
                del self.active_connections[room][user_id]
            
            # 从用户列表中移除
            del self.users[user_id]
            
            # 通知房间内其他用户有用户离开
            asyncio.create_task(self.broadcast_to_room(room, {
                "type": "system", 
                "message": f"{username} 离开了聊天室",
                "timestamp": None
            }))
    
    async def send_personal_message(self, message: dict, user_id: str):
        """发送消息给指定用户"""
        if user_id in self.users:
            room = self.users[user_id]["room"]
            if room in self.active_connections and user_id in self.active_connections[room]:
                websocket = self.active_connections[room][user_id]
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    # 连接已断开，清理
                    self.disconnect(user_id)
    
    async def broadcast_to_room(self, room: str, message: dict, exclude_user: str = None):
        """向指定房间广播消息"""
        if room in self.active_connections:
            disconnected_users = []
            for user_id, websocket in self.active_connections[room].items():
                if exclude_user and user_id == exclude_user:
                    continue
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    # 连接已断开，记录需要清理的用户
                    disconnected_users.append(user_id)
            
            # 清理断开的连接
            for user_id in disconnected_users:
                self.disconnect(user_id)
    
    def get_room_users(self, room: str) -> List[str]:
        """获取房间内的用户列表"""
        if room not in self.active_connections:
            return []
        
        users = []
        for user_id in self.active_connections[room]:
            if user_id in self.users:
                users.append(self.users[user_id]["username"])
        return users

manager = ConnectionManager()

@app.get("/", response_class=HTMLResponse)
async def homepage(request: Request):
    """主页 - 聊天室列表"""
    rooms = db.get_rooms()
    return templates.TemplateResponse("index.html", {
        "request": request, 
        "rooms": rooms
    })

@app.get("/chat/{room_name}", response_class=HTMLResponse)
async def chat_room(request: Request, room_name: str):
    """聊天室页面"""
    # 获取历史消息
    messages = db.get_messages(room_name)
    return templates.TemplateResponse("chat.html", {
        "request": request,
        "room_name": room_name,
        "messages": messages
    })

@app.post("/create-room")
async def create_room(room_name: str = Form(...), description: str = Form(""), password: str = Form("")):
    """创建新聊天室"""
    success = db.create_room(room_name, description, password)
    if success:
        return {"status": "success", "message": "聊天室创建成功"}
    else:
        return {"status": "error", "message": "聊天室名称已存在"}

@app.post("/verify-room-password")
async def verify_room_password(room_name: str = Form(...), password: str = Form("")):
    """验证聊天室密码"""
    if db.verify_room_password(room_name, password):
        return {"status": "success", "message": "密码验证成功"}
    else:
        return {"status": "error", "message": "密码错误或聊天室不存在"}

@app.post("/set-room-password")
async def set_room_password(room_name: str = Form(...), new_password: str = Form("")):
    """设置或更新聊天室密码"""
    success = db.update_room_password(room_name, new_password)
    if success:
        if new_password:
            return {"status": "success", "message": "聊天室密码设置成功"}
        else:
            return {"status": "success", "message": "聊天室密码保护已取消"}
    else:
        return {"status": "error", "message": "聊天室不存在或设置失败"}

@app.post("/upload-custom-emoji")
async def upload_custom_emoji(
    file: UploadFile = File(...),
    name: str = Form(...),
    uploader: str = Form(...)
):
    """上传自定义表情"""
    try:
        # 验证文件类型
        if not file.content_type.startswith('image/'):
            return {"status": "error", "message": "只支持图片文件"}
        
        # 验证文件大小 (5MB限制)
        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            return {"status": "error", "message": "图片大小不能超过5MB"}
        
        # 验证表情名称
        if not name or len(name) > 20:
            return {"status": "error", "message": "表情名称长度应在1-20个字符之间"}
        
        # 生成文件名
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
            return {"status": "error", "message": "不支持的文件格式"}
        
        # 创建自定义表情目录
        emoji_dir = Path("static/custom_emojis")
        emoji_dir.mkdir(exist_ok=True)
        
        # 生成唯一文件名
        timestamp = int(time.time())
        safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"{timestamp}_{safe_name}.{file_extension}"
        file_path = emoji_dir / filename
        
        # 保存文件
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # 保存到数据库
        relative_path = f"/static/custom_emojis/{filename}"
        success = db.save_custom_emoji(name, relative_path, uploader)
        
        if not success:
            # 如果数据库保存失败，删除文件
            file_path.unlink(missing_ok=True)
            return {"status": "error", "message": "表情名称已存在"}
        
        return {
            "status": "success", 
            "message": "自定义表情上传成功",
            "emoji": {
                "name": name,
                "file_path": relative_path,
                "uploader": uploader
            }
        }
        
    except Exception as e:
        print(f"上传自定义表情错误: {e}")
        return {"status": "error", "message": "上传失败，请重试"}

@app.get("/api/custom-emojis")
async def get_custom_emojis():
    """获取所有自定义表情"""
    try:
        emojis = db.get_custom_emojis()
        return {"status": "success", "emojis": emojis}
    except Exception as e:
        print(f"获取自定义表情错误: {e}")
        return {"status": "error", "message": "获取表情失败"}

@app.delete("/api/custom-emoji/{emoji_id}")
async def delete_custom_emoji(emoji_id: int, uploader: str = Form(...)):
    """删除自定义表情"""
    try:
        success = db.delete_custom_emoji(emoji_id, uploader)
        if success:
            return {"status": "success", "message": "表情删除成功"}
        else:
            return {"status": "error", "message": "只能删除自己上传的表情"}
    except Exception as e:
        print(f"删除自定义表情错误: {e}")
        return {"status": "error", "message": "删除失败"}

@app.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    room_name: str = Form(...),
    username: str = Form(...)
):
    """上传图片文件"""
    try:
        # 验证文件大小
        if file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="文件大小超过20MB限制")
        
        # 验证文件类型
        if not validate_image_file(file):
            raise HTTPException(status_code=400, detail="不支持的文件类型，只支持JPG、PNG、GIF、WEBP格式")
        
        # 生成文件名并保存
        filename = generate_filename(file.filename)
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # 保存文件
        contents = await file.read()
        
        # 再次检查文件大小
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="文件大小超过20MB限制")
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # 保存图片消息到数据库
        relative_path = f"/static/uploads/{filename}"
        db.save_message(
            room_name=room_name,
            username=username,
            message=file.filename,  # 原始文件名作为消息内容
            message_type="image",
            file_path=relative_path
        )
        
        return {
            "status": "success",
            "message": "图片上传成功",
            "file_path": relative_path,
            "filename": file.filename
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"图片上传错误: {e}")
        raise HTTPException(status_code=500, detail="图片上传失败")

@app.get("/api/messages/{room_name}")
async def get_more_messages(room_name: str, before: str = None, limit: int = 50):
    """获取更多历史消息（分页API）"""
    try:
        messages = db.get_messages(room_name, limit, before)
        total_count = db.get_message_count(room_name)
        has_more = len(messages) == limit and total_count > limit
        
        return {
            "status": "success",
            "messages": messages,
            "has_more": has_more,
            "total_count": total_count
        }
    except Exception as e:
        print(f"获取消息错误: {e}")
        return {"status": "error", "message": "获取消息失败"}

@app.websocket("/ws/{room_name}")
async def websocket_endpoint(websocket: WebSocket, room_name: str):
    """WebSocket连接端点"""
    # 等待客户端发送用户信息
    await websocket.accept()
    
    try:
        # 接收用户信息
        data = await websocket.receive_text()
        user_data = json.loads(data)
        username = user_data.get("username", "匿名用户")
        user_id = user_data.get("user_id")
        
        if not user_id:
            await websocket.close(code=1000, reason="缺少用户ID")
            return
        
        # 连接用户到房间
        await manager.connect(websocket, user_id, username, room_name)
        
        # 发送历史消息
        messages = db.get_messages(room_name)
        await manager.send_personal_message({
            "type": "history",
            "messages": messages
        }, user_id)
        
        # 发送当前在线用户列表
        online_users = manager.get_room_users(room_name)
        await manager.broadcast_to_room(room_name, {
            "type": "user_list",
            "users": online_users
        })
        
        while True:
            # 接收消息
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "message":
                message_type = message_data.get("message_type", "text")
                
                if message_type == "text":
                    # 处理文本消息
                    message = message_data.get("message", "").strip()
                    quoted_message = message_data.get("quotedMessage")
                    
                    if message:
                        # 保存消息到数据库（包含引用信息）
                        db.save_message(room_name, username, message, "text", None, quoted_message)
                        
                        # 构建广播消息
                        broadcast_data = {
                            "type": "message",
                            "message_type": "text",
                            "username": username,
                            "message": message,
                            "timestamp": message_data.get("timestamp")
                        }
                        
                        # 如果有引用消息，添加到广播数据中
                        if quoted_message:
                            broadcast_data["quotedMessage"] = quoted_message
                        
                        # 广播消息到房间内所有用户
                        await manager.broadcast_to_room(room_name, broadcast_data)
                
                elif message_type == "image":
                    # 处理图片消息广播（包括自定义表情）
                    file_path = message_data.get("file_path")
                    message_content = message_data.get("message", "")
                    quoted_message = message_data.get("quotedMessage")
                    
                    if file_path:
                        # 保存图片消息到数据库（包含自定义表情）
                        db.save_message(room_name, username, message_content, "image", file_path, quoted_message)
                        
                        # 构建广播消息
                        broadcast_data = {
                            "type": "message",
                            "message_type": "image",
                            "username": username,
                            "message": message_content,
                            "file_path": file_path,
                            "timestamp": message_data.get("timestamp")
                        }
                        
                        # 如果有引用消息，添加到广播数据中
                        if quoted_message:
                            broadcast_data["quotedMessage"] = quoted_message
                        
                        # 广播图片消息到房间内所有用户
                        await manager.broadcast_to_room(room_name, broadcast_data)
    
    except WebSocketDisconnect:
        if 'user_id' in locals() and user_id:
            manager.disconnect(user_id)
            # 更新在线用户列表
            online_users = manager.get_room_users(room_name)
            await manager.broadcast_to_room(room_name, {
                "type": "user_list",
                "users": online_users
            })
    except Exception as e:
        print(f"WebSocket错误: {e}")
        if 'user_id' in locals() and user_id:
            manager.disconnect(user_id)

if __name__ == "__main__":
    import uvicorn
    import os
    
    if os.path.exists("ssl/cert.pem") and os.path.exists("ssl/key.pem"):
        print("🔒 HTTPS模式启动...")
        print("访问: https://localhost:8666")
        uvicorn.run("main:app", 
                   host="0.0.0.0", 
                   port=8666, 
                   reload=True,
                   ssl_keyfile="ssl/key.pem",
                   ssl_certfile="ssl/cert.pem")
    else:
        print("📡 HTTP模式启动...")
        print("访问: http://localhost:8666") 
        uvicorn.run("main:app", host="0.0.0.0", port=8666, reload=True)
