import { useEffect, useRef, useState } from "react"
import { sendChatbotMessageApi } from "@/core/api/grievanceApi"
import type { Status } from "@/shared/types/grievance"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { Button } from "@/shared/ui/button"

interface Message {
  id: string
  sender: "user" | "assistant"
  text: string
  language?: string
  intent?: string
  confidence?: number
  explanation_terms?: string[]
  grievance?: {
    grievance_number: string
    status: Status
    department: string
    category?: string
  } | null
  timestamp: string
}

const SUPPORTED_LANGUAGES = [
  { code: "English",   label: "English" },
  { code: "Tamil",     label: "தமிழ் (Tamil)" },
  { code: "Hindi",     label: "हिन्दी (Hindi)" },
  { code: "Telugu",    label: "తెలుగు (Telugu)" },
  { code: "Kannada",   label: "ಕನ್ನಡ (Kannada)" },
  { code: "Malayalam", label: "മലയാളം (Malayalam)" },
  { code: "Bengali",   label: "বাংলা (Bengali)" },
  { code: "Gujarati",  label: "ગુજરાતી (Gujarati)" },
  { code: "Marathi",   label: "मराठी (Marathi)" },
  { code: "Punjabi",   label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "Urdu",      label: "اردو (Urdu)" },
]

const QUICK_ACTIONS = [
  { label: "Track Grievance",  query: "Where is my grievance?" },
  { label: "Submit Complaint", query: "How do I submit a new complaint?" },
  { label: "Departments",      query: "Which department handles electricity?" },
  { label: "How It Works",     query: "How does this system work?" },
  { label: "Help",             query: "Help" },
]

export function ChatbotView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Namaste! Welcome to the Central Government Multilingual AI Citizen Assistant. You can query grievance status, ask department guidance, or understand filing workflows in 11 official Indian languages.",
      language: "English",
      intent: "GREETING",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [inputText, setInputText]       = useState("")
  const [selectedLanguage, setLanguage] = useState("English")
  const [sessionContext, setSession]    = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim()
    if (!query || isLoading) return

    const userMsg: Message = {
      id:        `user-${crypto.randomUUID()}`,
      sender:    "user",
      text:      query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInputText("")
    setIsLoading(true)
    setError(null)

    try {
      const res = await sendChatbotMessageApi(query, sessionContext)

      if (res.session_context) setSession(res.session_context)

      const assistantMsg: Message = {
        id:               `assistant-${crypto.randomUUID()}`,
        sender:           "assistant",
        text:             res.message || "Thank you. I have processed your request.",
        language:         res.language || selectedLanguage,
        intent:           res.intent,
        confidence:       res.confidence,
        explanation_terms: res.explanation_terms,
        grievance:        res.grievance,
        timestamp:        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to communicate with AI Assistant."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto bg-card border rounded-2xl shadow-sm overflow-hidden">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-200 flex items-center justify-center text-xl flex-shrink-0">
            🤖
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Multilingual AI Citizen Assistant</h1>
            <p className="text-xs text-muted-foreground">
              Intent-based multilingual assistance · Secure grievance lookup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Lang:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              className="filter-select"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI Live
          </span>
        </div>
      </div>

      {/* ── Message list ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-background">
        {messages.map((msg) => {
          const isUser = msg.sender === "user"
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}>
              <div
                className={`max-w-[85%] md:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground rounded-br-none shadow-sm"
                    : "bg-card border text-foreground rounded-bl-none shadow-sm"
                }`}
              >
                {/* Intent badge */}
                {!isUser && msg.intent && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                      {msg.intent}
                    </span>
                    {msg.confidence && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {(msg.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* XAI terms */}
                {!isUser && msg.explanation_terms && msg.explanation_terms.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium mr-1">Key terms:</span>
                    {msg.explanation_terms.map((t, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-muted text-[10px] font-mono rounded text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Grievance card */}
                {msg.grievance && (
                  <div className="mt-3 p-3 bg-muted/50 border rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-primary">{msg.grievance.grievance_number}</span>
                      <StatusBadge status={msg.grievance.status} />
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Dept: <strong className="text-foreground">{msg.grievance.department}</strong></span>
                      {msg.grievance.category && <span>{msg.grievance.category}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                <span>{msg.timestamp}</span>
                {msg.language && (
                  <span className="font-semibold text-primary">[{msg.language}]</span>
                )}
              </div>
            </div>
          )
        })}

        {/* AI typing indicator */}
        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="bg-card border rounded-2xl rounded-bl-none px-4 py-3 text-xs text-muted-foreground flex items-center gap-2 shadow-sm">
              <span className="spinner w-3.5 h-3.5" />
              <span>AI is analyzing your query…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-banner flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </span>
            <button onClick={() => setError(null)} className="text-xs text-rose-600 hover:underline ml-3 flex-shrink-0">
              Dismiss
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t bg-card flex items-center gap-2 overflow-x-auto flex-shrink-0">
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Quick:</span>
        {QUICK_ACTIONS.map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(action.query)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full text-xs font-medium border bg-background hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-foreground transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* ── Input row ─────────────────────────────────────────── */}
      <div className="p-4 border-t bg-card flex items-center gap-3 flex-shrink-0">
        <input
          id="chatbot-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask in English, Hindi, Tamil, Telugu… (any Indian language)"
          disabled={isLoading}
          className="form-input flex-1 disabled:opacity-50"
          autoComplete="off"
        />
        <Button
          id="chatbot-send-btn"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="gap-2 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Send
        </Button>
      </div>
    </div>
  )
}
