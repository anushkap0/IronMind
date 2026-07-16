import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import apiClient from "../api/axiosClient";

const SUGGESTIONS = [
  "What should I eat before a workout?",
  "How do I break through a weight-loss plateau?",
  "Design me a 3-day beginner split.",
  "How much protein do I actually need?",
];

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    apiClient.get("/api/chat/history").then(({ data }) => {
      if (data.length) {
        setMessages(data.map((m) => ({ role: m.role, content: m.content })));
      } else {
        setMessages([
          {
            role: "assistant",
            content:
              "Hey — I'm Coach Ray, your AI fitness coach. Ask me about your BMI results, diet, workouts, or recovery.",
          },
        ]);
      }
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const content = text ?? input;
    if (!content.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await apiClient.post("/api/chat/ask", { message: content });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong reaching the coach. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-sm uppercase tracking-widest text-blood">RAG Assistant</p>
        <h1 className="font-display text-4xl font-semibold">AI Coach</h1>
        <p className="mt-2 text-steel">Follow-up questions, recommendations, and plan tweaks — grounded in fitness knowledge.</p>
      </motion.div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-panel/70">
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blood/20 text-blood">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-blood text-bone"
                    : "border border-line bg-void/60 text-bone"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel2 text-steel">
                  <User className="h-4 w-4" />
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 pl-11 text-sm text-steel">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blood [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blood [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blood" />
              </span>
              Coach Ray is thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 border-t border-line px-6 py-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-steel transition-colors hover:border-blood hover:text-ember"
              >
                <Sparkles className="h-3 w-3" /> {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-3 border-t border-line p-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about diet, training, recovery..."
            className="flex-1 rounded-lg border border-line bg-void/60 px-4 py-3 text-sm outline-none focus:border-blood placeholder:text-steel/60"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center rounded-lg bg-blood p-3 text-bone transition-all hover:bg-ember hover:shadow-glowRed disabled:opacity-60"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
