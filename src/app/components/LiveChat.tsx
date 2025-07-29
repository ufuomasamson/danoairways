"use client";

import { useState, useRef, useEffect } from 'react';
import { useSession } from '../hooks/useSession';

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState(null);
  const session = useSession();

  console.log('LiveChat: Component rendering');

  // Load existing messages when component mounts
  useEffect(() => {
    // TEMPORARY: Load messages using test user ID since session not working
    loadMessages();
    
    // Poll for new messages every 5 seconds when chat is closed
    const interval = setInterval(() => {
      if (!open) {
        loadMessages();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [open]);

  // Load last read message ID from localStorage on mount
  useEffect(() => {
    const storedLastReadId = localStorage.getItem('livechat_last_read_message_id');
    if (storedLastReadId) {
      setLastReadMessageId(storedLastReadId);
    }
  }, []);

  // Calculate unread count when messages change
  useEffect(() => {
    if (messages.length === 0) {
      setUnreadCount(0);
      return;
    }

    // Count admin messages that are newer than the last read message
    const adminMessages = messages.filter(msg => msg.sender_role === 'admin');
    
    if (!lastReadMessageId) {
      // If no last read message, count all admin messages as unread
      const newUnreadCount = adminMessages.length;
      setUnreadCount(newUnreadCount);
      console.log('LiveChat: No last read message, unread admin messages:', newUnreadCount);
    } else {
      // Find the index of the last read message
      const lastReadIndex = messages.findIndex(msg => msg.id === lastReadMessageId);
      if (lastReadIndex === -1) {
        // Last read message not found, count all admin messages
        const newUnreadCount = adminMessages.length;
        setUnreadCount(newUnreadCount);
        console.log('LiveChat: Last read message not found, unread admin messages:', newUnreadCount);
      } else {
        // Count admin messages after the last read message
        const unreadAdminMessages = messages
          .slice(lastReadIndex + 1)
          .filter(msg => msg.sender_role === 'admin');
        const newUnreadCount = unreadAdminMessages.length;
        setUnreadCount(newUnreadCount);
        console.log('LiveChat: Unread admin messages after last read:', newUnreadCount);
      }
    }
  }, [messages, lastReadMessageId]);

  const loadMessages = async () => {
    let userId = session?.user?.id;
    if (!userId) {
      // Use the same test user ID for consistency
      userId = '4453a704-5a44-4689-9240-dbe950ea6d24';
      console.log('LiveChat: Loading messages for test user ID:', userId);
    }
    
    try {
      console.log('LiveChat: Loading messages for user:', userId);
      const response = await fetch(`/api/chat?user_auth_id=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('LiveChat: Loaded messages:', data.messages?.length || 0);
        setMessages(data.messages || []);
      } else {
        console.error('LiveChat: Error loading messages:', data.error);
      }
    } catch (error) {
      console.error('LiveChat: Error loading messages:', error);
    }
  };

  const markMessagesAsRead = () => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      setLastReadMessageId(lastMessage.id);
      localStorage.setItem('livechat_last_read_message_id', lastMessage.id);
      setUnreadCount(0);
      console.log('LiveChat: Marked messages as read up to:', lastMessage.id);
    }
  };

  const handleChatOpen = () => {
    console.log('LiveChat: Opening chat');
    setOpen(true);
    // Mark messages as read when chat is opened
    setTimeout(() => {
      markMessagesAsRead();
    }, 500); // Small delay to ensure messages are loaded
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const messageText = input.trim();
    setInput('');
    setLoading(true);
    setError('');
    
    console.log('LiveChat: Sending message:', messageText);
    
    // Optimistically add message to UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      message: messageText,
      sender_role: 'user',
      created_at: new Date().toISOString()
    };
    
    try {
      // TEMPORARY: Use hardcoded user ID for testing since session is not working
      let userId = session?.user?.id;
      if (!userId) {
        // Use a test user ID for debugging
        userId = '4453a704-5a44-4689-9240-dbe950ea6d24'; // This user ID from the logs
        console.log('LiveChat: Using test user ID since session not working:', userId);
      }

      setMessages(prev => [...prev, tempMessage]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_auth_id: userId,
          sender_role: 'user',
          message: messageText
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('LiveChat: Message sent successfully:', data.message);
        // Replace temp message with real message from server
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? data.message : msg
          )
        );
      } else {
        console.error('LiveChat: Error sending message:', data.error);
        setError(data.error || 'Failed to send message');
        // Remove failed message from UI
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }
    } catch (error) {
      console.error('LiveChat: Error sending message:', error);
      setError('Failed to send message');
      // Remove failed message from UI
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button with Notification Badge */}
      <div className="fixed bottom-6 right-6 z-50" style={{ display: open ? 'none' : 'block' }}>
        <button
          className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 relative"
          onClick={handleChatOpen}
        >
          💬
          {/* Notification Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white shadow-lg rounded-lg w-80 h-96 flex flex-col">
            {/* Header */}
            <div className="p-3 border-b font-bold flex justify-between items-center text-black">
              <span>Live Chat</span>
              <button 
                onClick={() => setOpen(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 text-black bg-gray-50">
              {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
              
              {messages.length === 0 && (
                <div className="text-gray-500 text-sm">
                  Welcome! How can we help you today?
                </div>
              )}
              
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`mb-2 ${msg.sender_role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <span 
                    className={`inline-block px-2 py-1 rounded ${
                      msg.sender_role === 'user' 
                        ? 'bg-blue-100 text-blue-900' 
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {msg.message}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t flex bg-white">
              <input
                className="flex-1 border rounded px-2 py-1 mr-2 text-gray-900"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
              />
              <button 
                type="submit" 
                className={`px-3 py-1 rounded text-white ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
