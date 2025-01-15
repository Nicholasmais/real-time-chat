import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';


@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {  
  private chats = [];
  private chat_messages = {};
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('createChat')
  handleCreateChat(client: any, payload: any): any {      
    const { name, isPrivate, password } = payload;

    this.chats.push({name, isPrivate, password,  id : this.chats.length});
    this.chat_messages[name] = [];
    this.server.emit('chats',this.chats);

    return {"success": true};
  }

  @SubscribeMessage('chats')
  handleChats(client: any, payload: any): any {
    this.server.emit('chats', this.chats);
    return
  }

  @SubscribeMessage('join-chat')
  handleJoinChat(client: any, payload: any): any {
    const chatId = payload.chatId;    
    const chat = this.chats[chatId];
    this.server.emit('getChatMessages', this.chat_messages[chat.name]);
    return {"success":true};
  }

  @SubscribeMessage('getChatMessages')
  handleGetChatMessages(client: any, payload: any):any {
    const chatId = payload.chatId;  
    const chat = this.chats[chatId];
    this.server.emit('getChatMessages', this.chat_messages[chat.name]);
    return this.chat_messages[chat.name];
  }

  @SubscribeMessage('sendMessage')
  handlesendMessage(client: any, payload: any):any {
    const chatId = payload.chatId;  
    const chat = this.chats[chatId];            
    let chatMessages = this.chat_messages[chat.name];    
    chatMessages.push(payload.content);
    this.server.emit('sendMessage', this.chat_messages);
    return this.chat_messages;
  }

  handleConnection(socket: Socket) {
    this.server.emit('chats', this.chats);
    console.log(`Socket connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    console.log(`Socket disconnected: ${socket.id}`);
  }

}
