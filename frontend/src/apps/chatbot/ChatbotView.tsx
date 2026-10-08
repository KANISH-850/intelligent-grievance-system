import { useState } from "react"
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
  grievance?: {
    grievance_number: string
    status: Status
    department: string
    category?: string
  } | null
  timestamp: string
}

const QUICK_PROMPTS = [
  "What is the status of my latest grievance?",
  "Show all my registered grievances",
  "How do I submit a new complaint?",
  "Which department handles water leakage?",
]

export function ChatbotView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Namaste! Welcome to the Central Government Grievance AI Assistant. I can assist you in multiple official Indian languages with grievance status tracking, list queries, and filing guidance.",
      language: "English",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim()
    if (!query || isLoading) return

    const userMsg: Message = {
      id: `user-${crypto.randomUUID()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInputText("")
    setIsLoading(true)
    setError(null)

    try {
      const res = await sendChatbotMessageApi(query)
      const assistantMsg: Message = {
        id: `assistant-${crypto.randomUUID()}`,
        sender: "assistant",
        text: res.message || "Thank you. I have processed your request.",
        language: res.language || "English",
        intent: res.intent,
        grievance: res.grievance,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto bg-card border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
            🤖
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Multilingual Grievance AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              Powered by Central Government NLP Microservice & Real-Time Grievance API
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI Service Live</span>
        </span>
      </div>

      {/* Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user"
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted/50 border text-foreground rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Grievance Quick Card embedded if returned by AI */}
                {msg.grievance && (
                  <div className="mt-3 p-3 bg-background border rounded-lg text-foreground text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-primary">
                        {msg.grievance.grievance_number}
                      </span>
                      <StatusBadge status={msg.grievance.status} />
                    </div>
                    <div className="text-muted-foreground flex justify-between">
                      <span>Dept: <strong>{msg.grievance.department}</strong></span>
                      {msg.grievance.category && <span>Category: {msg.grievance.category}</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-muted-foreground px-1">
                <span>{msg.timestamp}</span>
                {msg.language && msg.language !== "English" && (
                  <span className="font-semibold text-primary">[{msg.language}]</span>
                )}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex flex-col items-start space-y-1">
            <div className="bg-muted/50 border rounded-2xl rounded-bl-none px-4 py-3 text-xs text-muted-foreground flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>AI Assistant is analyzing query...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <Button size="xs" variant="outline" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-t bg-muted/10 flex items-center space-x-2 overflow-x-auto">
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Suggestions:</span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full text-xs border bg-card hover:bg-muted text-foreground transition-colors whitespace-nowrap shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t bg-card flex items-center space-x-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI Assistant in Hindi, Tamil, Telugu, English..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <Button onClick={() => handleSendMessage()} disabled={!inputText.trim() || isLoading}>
          Send
        </Button>
      </div>
    </div>
  )
}
