"use client";

import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://172.18.30.159:3000");

export default function ChatApp() {
  const [connected, setConnected] = useState(false);
  const [chats, setChats] = useState([]);
  const [chatName, setChatName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    socket.on("chats", (availableChats) => {
      setChats(availableChats);      
    });
  
    socket.on("messages", (chatMessages) => {
      setMessages(chatMessages);
    });

    socket.on("getChatMessages", (chatMessages) => {      
      setMessages(chatMessages);
    });
  
    socket.on("newMessage", (message) => {
      setMessages(prev => [...prev, message]);
    });
  
    if (socket.connected) {
      setConnected(true);
      socket.emit("chats");
    }
  
    return () => {
      socket.disconnect();
    };
  }, []);
  
  const selectChat = (chat) => {
    setSelectedChat(chat);
    if (chat.isPrivate) {
      const password = prompt("Digite a senha do chat:");
      socket.emit("join-chat", { chatId: chat.id, password }, (response) => {
        if (response.success) {          
          socket.emit("getChatMessages", { chatId: chat.id });
        } else {
          alert("Senha incorreta!");
          setSelectedChat(null);
        }
      });
    } else {
      socket.emit("join-chat", { chatId: chat.id }, (response) => {
        if (response.success) {
          socket.emit("getChatMessages", { chatId: chat.id });
        }
      });
    }
  };

  const createChat = () => {
    const chatData = { name: chatName, isPrivate, password: isPrivate ? password : null };
    socket.emit("createChat", chatData, (response) => {
      if (response.success) {
        setChatName("");
        setPassword("");
        setIsPrivate(false);
      } else {
        alert("Erro ao criar o chat: " + response.message);
      }
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedChat) {
      socket.emit("sendMessage", {
        chatId: selectedChat.id,
        content: newMessage
      }, (res) => {
        setMessages(res[selectedChat.name]);
      });
      setNewMessage("");
    }
  };

  return (
    <main>
      <div className="chat-container">
        <div className="chat-app">
          <h1>Chat App</h1>
          <p className={`status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? 'Conectado' : 'Desconectado'}
          </p>

          <section>
            <h2>Criar Chat</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Nome do Chat"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
              />
              
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <label>Privado</label>
              </div>
              
              {isPrivate && (
                <input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
              
              <button onClick={createChat}>Criar Chat</button>
            </div>
          </section>

          <section>
            <h2>Chats Disponíveis</h2>
            <ul className="chat-list">
              {chats?.map((chat, index) => (
                <li 
                  key={index}
                  className={selectedChat?.id === chat.id ? 'active' : ''}
                  onClick={() => selectChat(chat)}
                >
                  {chat.name}
                  {chat.isPrivate && <span className="private-badge">Privado</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {selectedChat && (
          <div className="chat-messages">
            <h2>{selectedChat.name}</h2>
            <div className="messages-container">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${
                    message.userId === socket.id ? 'message-sent' : 'message-received'
                  }`}
                >
                  {message}
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="message-input-container">
              <input
                type="text"
                className="message-input"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit">Enviar</button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}