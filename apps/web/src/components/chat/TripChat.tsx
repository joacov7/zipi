import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { SocketEvent } from '@zipi/shared';
import { useAuthStore } from '../../stores/auth.store';
import { Send, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface Props {
  tripId: string;
}

export default function TripChat({ tripId }: Props) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history } = useQuery({
    queryKey: ['chat', tripId],
    queryFn: () => api.get(`/trips/${tripId}/messages`).then((r) => r.data),
    enabled: !!tripId,
  });

  useEffect(() => {
    if (history) setMessages(history);
  }, [history]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('chat:join', { tripId });

    socket.on(SocketEvent.CHAT_MESSAGE, (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (!open && msg.senderId !== user?.id) {
        setUnread((n) => n + 1);
      }
    });

    return () => {
      socket.off(SocketEvent.CHAT_MESSAGE);
    };
  }, [tripId, open, user?.id]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const sendMessage = () => {
    if (!input.trim() || !user) return;
    const socket = getSocket();
    socket.emit('chat:send', { tripId, content: input.trim(), senderName: user.name });
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <MessageCircle size={18} className="text-zipi-500" />
        Chat con {user?.role === 'DRIVER' ? 'el pasajero' : 'el conductor'}
        {unread > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.length === 0 && (
              <p className="text-center text-xs text-gray-400 pt-8">
                No hay mensajes aún. ¡Empezá la conversación!
              </p>
            )}
            {messages.map((msg) => {
              const mine = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? 'bg-zipi-500 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {!mine && (
                      <p className="text-xs font-semibold mb-0.5 text-zipi-600">{msg.senderName}</p>
                    )}
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-0.5 ${mine ? 'text-zipi-200' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center gap-2 p-2 border-t border-gray-200 bg-white">
            <input
              className="flex-1 input text-sm py-2"
              placeholder="Escribí un mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              maxLength={500}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-9 h-9 bg-zipi-500 hover:bg-zipi-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
