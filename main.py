from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Form
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import json
import asyncio
from typing import Dict, List, Set
from database import ChatDatabase

app = FastAPI(title="多人在线聊天室")

# 静态文件和模板配置
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# 数据库实例
db = ChatDatabase()

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
                message = message_data.get("message", "").strip()
                quoted_message = message_data.get("quotedMessage")
                
                if message:
                    # 保存消息到数据库
                    db.save_message(room_name, username, message)
                    
                    # 构建广播消息
                    broadcast_data = {
                        "type": "message",
                        "username": username,
                        "message": message,
                        "timestamp": message_data.get("timestamp")
                    }
                    
                    # 如果有引用消息，添加到广播数据中
                    if quoted_message:
                        broadcast_data["quotedMessage"] = quoted_message
                    
                    # 广播消息到房间内所有用户
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
