import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Bot, User, ShieldCheck, Lock, RefreshCw,
  MessageSquare, CheckCircle2, Building2
} from 'lucide-react';
import api, { errorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Alert, Badge, Button, PageHeader, Spinner } from '../components/ui';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const isSupervisor = user?.role === 'admin' || user?.role === 'hr';

  const [companyName, setCompanyName] = useState<string>('Your Organization');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Hello **${user?.name || 'Team Member'}**! I am your tenant-isolated **HCM Lite AI Assistant**.\n\nI am strictly scoped to your organization's live database and your **${user?.role?.toUpperCase()}** access tier. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/ai/chat', { message: trimmed });
      if (res.data.companyName) {
        setCompanyName(res.data.companyName);
      }
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = isSupervisor
    ? [
        'Who arrived late the most this month?',
        'What is our attendance rate today?',
        'How many active employees do we have per department?',
        'Who is on approved leave today?',
        'Summarize company leave and late deduction rules',
      ]
    : [
        'What is my assigned shift and grace time?',
        'How many sick and annual leaves do I have left?',
        'Show my attendance summary for this month',
        'What is my current gross salary breakdown?',
        'Tell me about other employees in my company (Privacy Guardrail Test)',
      ];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader
        title="AI Workforce & Policy Assistant"
        subtitle="Powered by Google Gemini with strict multi-tenant isolation & role-based data guardrails."
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="zinc">
              <Building2 className="w-3 h-3 mr-1 inline" />
              {companyName} Tenant
            </Badge>
            <Badge variant="emerald" pulse>
              Scoped to {user?.role?.toUpperCase()}
            </Badge>
          </div>
        }
        action={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() =>
              setMessages([
                {
                  id: 'welcome-reset',
                  sender: 'ai',
                  text: `Conversation cleared. I remain strictly bound to **${companyName}** and your **${user?.role?.toUpperCase()}** access scope. Ask me anything about your workspace!`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
          >
            Reset Chat
          </Button>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}

      {/* Role-Based & Multi-Tenant Privacy Guardrail Banner */}
      <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-zinc-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Multi-Tenant &amp; Role Guard Active:</strong>{' '}
            {isSupervisor
              ? 'Full executive visibility into your organization tenant headcount, attendance rates, and leave analytics. Zero cross-tenant leakage.'
              : 'Restricted to your personal leave balances, your own compensation, and general company policies within your organization tenant.'}
          </span>
        </div>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
          Gemini 1.5 Flash + Tenant DB Context
        </span>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-zinc-400 mr-1">Suggested:</span>
        {suggestedPrompts.map((p) => (
          <button
            key={p}
            onClick={() => sendPrompt(p)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Transcript Window */}
      <div className="surface-card rounded-2xl border border-zinc-800 flex flex-col h-[480px] overflow-hidden bg-zinc-950">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  m.sender === 'ai'
                    ? 'bg-zinc-900 border-zinc-700 text-white'
                    : 'bg-zinc-100 border-zinc-100 text-zinc-950'
                }`}
              >
                {m.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-1 ${
                  m.sender === 'ai'
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                    : 'bg-zinc-100 text-zinc-950 font-medium'
                }`}
              >
                <div
                  className="whitespace-pre-line"
                  dangerouslySetInnerHTML={{
                    __html: m.text.replace(
                      /\*\*(.*?)\*\*/g,
                      m.sender === 'ai'
                        ? '<strong class="text-white font-bold">$1</strong>'
                        : '<strong class="text-zinc-950 font-extrabold">$1</strong>'
                    ),
                  }}
                />
                <div
                  className={`text-[10px] font-mono pt-1 ${
                    m.sender === 'ai' ? 'text-zinc-500' : 'text-zinc-600 text-right'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                <Spinner className="w-4 h-4 text-white" />
              </div>
              <span className="font-mono">Querying isolated tenant context &amp; generating answer…</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendPrompt(input);
          }}
          className="p-3.5 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about attendance rates, leave balances, late arrivals, or company policies…"
            className="flex-1 bg-zinc-950 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 border border-zinc-800 focus:outline-none focus:border-zinc-600"
          />
          <Button type="submit" icon={Send} loading={loading} disabled={!input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantPage;
