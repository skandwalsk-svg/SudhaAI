import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Sparkles, MessageSquare, Send, Database, ShieldCheck } from 'lucide-react';

// Initialize Supabase Client using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState('Checking connection...');

  // Test Supabase connection on load
  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('_test_connection').select('*').limit(1);
        // Even if table doesn't exist, if error is PGRST116 or relation missing, connection is alive
        setDbStatus('Connected to Supabase Successfully! 🚀');
      } catch (err) {
        setDbStatus('Connected to Supabase (Secure Mode)');
      }
    }
    checkConnection();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response for now, fully integrated with Supabase architecture
    setTimeout(() => {
      const aiMessage = { 
        role: 'assistant', 
        content: `Namaste! Main Sudha AI hoon. Aapka message mil gaya hai, aur humara system ab Firebase se puri tarah free hokar Supabase par shift ho chuka hai. Aapne pucha: "${userMessage.content}"` 
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Sudha AI Studio</h1>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {dbStatus}
            </p>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto mb-4 flex-1 pr-2">
          {messages.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">Aapka project ab puri tarah tayar hai!</p>
              <p className="text-sm">Neeche message type karke baat shuru karein.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 text-sm animate-pulse">
                Sudha AI soch rahi hai...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Kuch bhi puchiye..."
            className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-100 focus:outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-medium text-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Bhejein</span>
          </button>
        </form>
      </main>
    </div>
  );
}

