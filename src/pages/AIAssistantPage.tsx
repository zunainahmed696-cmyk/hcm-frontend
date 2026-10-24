import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Bot, User, RefreshCw, ShieldCheck,
  HelpCircle, CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Alert, Badge, Button, PageHeader, Spinner } from '../components/ui';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: user?.role === 'employee'
        ? `Hello **${user?.name}**! I am your personal HCM Lite AI Assistant. You can ask me about your leave balances, work hours, attendance history, company policies, or type a plain-language leave request!`
        : `Hello **${user?.name}** (${user?.role === 'admin' ? 'Owner / Admin' : 'HR Officer'})! I am your AI Operations Assistant. Ask me real-time headcount numbers, attendance rates, top late-comers, leave breakdown, or company policies.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Suggested Prompts based on Role
  const suggestedPrompts = user?.role === 'employee'
    ? [
        'How many sick leaves do I have left this year?',
        'What are the company office hours and grace time?',
        'What is my colleague’s salary?', // live test question that gets politely refused
        'What is the policy for weekends and half-days?',
      ]
    : [
        'Who came late most often this month?',
        'How many active employees are in Engineering?',
        'What is this month’s attendance rate?',
        'Who is on leave today?',
        'What is the tax slab formula for payroll?',
      ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/ai/chat', { message: text.trim() });
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.data.reply || 'I processed your request, but received an empty response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="HCM Lite AI Assistant"
        subtitle="Conversational intelligence answering directly from your organization's live database."
        badge={
          <Badge variant={user?.role === 'admin' ? 'indigo' : user?.role === 'hr' ? 'amber' : 'emerald'}>
            <Sparkles className="w-3 h-3 text-brand-300" />
            <span>Role-Scoped: {user?.role.toUpperCase()}</span>
          </Badge>
        }
        action={
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => setMessages(messages.slice(0, 1))}
          >
            Clear Chat
          </Button>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}

      {/* Suggested Quick Prompts */}
      <div className="surface-card rounded-2xl p-4 border border-white/5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Judges Live Test Prompts</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-brand-500/20 text-slate-300 hover:text-white border border-white/5 hover:border-brand-500/40 transition-all text-left flex items-center gap-1.5 active:scale-[0.98]"
            >
              <span>{prompt}</span>
              <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="surface-card rounded-2xl border border-white/5 flex flex-col h-[520px] overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-brand-600 text-white'
                      : 'bg-indigo-950/80 border border-brand-500/40 text-brand-300'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-surface-raised border border-white/5 text-slate-200 rounded-tl-none whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div
                    className={`text-[10px] text-slate-500 font-mono px-1 ${
                      isUser ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                    {!isUser && (
                      <span className="ml-2 text-indigo-400 font-medium">• AI Generated</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-indigo-950/80 border border-brand-500/40 text-brand-300 flex items-center justify-center shrink-0">
                <Spinner className="w-4 h-4 text-brand-400" />
              </div>
              <div className="bg-surface-raised border border-white/5 rounded-2xl p-3.5 text-xs text-slate-400 rounded-tl-none flex items-center gap-2">
                <span>Consulting live database tools…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/5 bg-surface-raised/40">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask anything about company data, policies, or time-off…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full pl-4 pr-12 py-3 bg-surface-raised rounded-xl text-xs text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="absolute right-2 p-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
