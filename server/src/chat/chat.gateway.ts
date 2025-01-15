import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';


@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {  
  private chats = [];

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('createChat')
  handleCreateChat(client: any, payload: any): any {      
    const { name, isPrivate, password } = payload;

    this.chats.push({name, isPrivate, password,  id : this.chats.length + 1});
    this.server.emit('chats', this.chats);

    return {"success": true};
  }

  @SubscribeMessage('chats')
  handleChats(client: any, payload: any): any {
    this.server.emit('chats', this.chats);
    return this.chats;
  }

  @SubscribeMessage('join-chat')
  handleJoinChat(client: any, payload: any): any {
    const chatId = payload.chatId;    
    const chat = this.chats[chatId-1];
    this.server.emit('chats', chat);
    return chat;
  }

  handleConnection(socket: Socket) {
    this.server.emit('chats', this.chats);
    console.log(`Socket connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    console.log(`Socket disconnected: ${socket.id}`);
  }

}
