"use client";
import { useEffect, useRef, useState } from 'react';

// TEST PAGE - Bypasses authentication to test admin live chat functionality
export default function TestAdminLiveChatPage() {
  const [chats, setChats] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch all users with chats
  useEffect(() => {
    async function fetchChats() {
      try {
        console.log('Test Admin: Fetching all chat users');
        const response = await fetch('/api/admin/chats');
        const data = await response.json();
        
        if (response.ok) {
          console.log('Test Admin: Found chat users:', data.users?.length || 0);
          setChats(data.users || []);
          if (!selectedUser && data.users?.length > 0) {
            setSelectedUser(data.users[0].user_auth_id);
          }
        } else {
          console.error('Test Admin: Error fetching chats:', data.error);
        }
      } catch (error) {
        console.error('Test Admin: Error fetching chats:', error);
      }
    }
    fetchChats();
  }, [selectedUser]);

  // Fetch messages for selected user
  useEffect(() => {
    if (!selectedUser) return;
    
    async function fetchMessages() {
      try {
        console.log('Test Admin: Fetching messages for user:', selectedUser);
        const response = await fetch(`/api/chat?user_auth_id=${selectedUser}`);
        const data = await response.json();
        
        if (response.ok) {
          console.log('Test Admin: Loaded messages:', data.messages?.length || 0);
          setMessages(data.messages || []);
        } else {
          console.error('Test Admin: Error fetching messages:', data.error);
        }
      } catch (error) {
        console.error('Test Admin: Error fetching messages:', error);
      }
    }
    
    fetchMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser || loading) return;
    
    const messageText = input.trim();
    setInput('');
    setLoading(true);
    
    try {
      console.log('Test Admin: Sending message to user:', selectedUser);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_auth_id: selectedUser,
          sender_role: 'admin',
          message: messageText
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Test Admin: Message sent successfully');
        // Refresh messages to show the new admin message
        const messagesResponse = await fetch(`/api/chat?user_auth_id=${selectedUser}`);
        const messagesData = await messagesResponse.json();
        if (messagesResponse.ok) {
          setMessages(messagesData.messages || []);
        }
      } else {
        console.error('Test Admin: Error sending message:', data.error);
        alert('Failed to send message: ' + data.error);
      }
    } catch (error) {
      console.error('Test Admin: Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white p-4 border-r shadow-sm">
        <h2 className="font-bold mb-4 text-gray-800">TEST: Active Chats</h2>
        <div className="text-xs text-green-600 mb-4">
          This is a test page to verify admin chat functionality
        </div>
        {chats.length === 0 ? (
          <div className="text-gray-500 text-sm">No active chats</div>
        ) : (
          <ul className="space-y-1">
            {chats.map((user) => (
              <li
                key={user.user_auth_id}
                className={`p-3 cursor-pointer rounded-lg transition-colors ${
                  selectedUser === user.user_auth_id 
                    ? 'bg-blue-100 border-blue-200 border' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedUser(user.user_auth_id)}
              >
                <div className="font-medium text-gray-900">
                  {user.email || `User ${user.user_auth_id.slice(0, 8)}...`}
                </div>
                <div className="text-xs text-gray-500">
                  {user.message_count} message{user.message_count !== 1 ? 's' : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-white shadow-sm">
          <h1 className="font-bold text-gray-800">TEST: Live Chat (Admin)</h1>
          {selectedUser && (
            <div className="text-sm text-gray-600 mt-1">
              Chatting with: {chats.find(u => u.user_auth_id === selectedUser)?.email || selectedUser}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {!selectedUser ? (
            <div className="text-center text-gray-500 mt-8">
              Select a user to view their messages
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              No messages yet
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`mb-4 ${msg.sender_role === 'admin' ? 'text-right' : 'text-left'}`}
              >
                <div className={`inline-block px-3 py-2 rounded-lg max-w-xs ${
                  msg.sender_role === 'admin' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  {msg.message}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {selectedUser && (
          <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={loading}
            />
            <button 
              type="submit" 
              className={`px-4 py-2 rounded-lg text-white font-medium ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
