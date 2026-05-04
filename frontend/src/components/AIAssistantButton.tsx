"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiChat } from "@/services/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Hola, soy el asistente de Arvia. Buscas una propiedad, quieres publicar una o necesitas ayuda con dividendo estimado?",
};

export function AIAssistantButton() {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [loading, setLoading]   = useState(false);
  const scrollRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await aiChat(text);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ups, no pude responder ahora mismo. Intenta de nuevo o escribeme por WhatsApp." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--brand))] to-cyan-500 text-white shadow-glow"
        aria-label="Abrir asistente Arvia"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[hsl(var(--brand))]/40 animate-ping [animation-duration:2.5s]" />
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[90vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-[hsl(var(--popover))]/95 backdrop-blur-xl shadow-soft"
          >
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--brand))] to-cyan-500">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">Asistente Arvia</div>
                <div className="text-[11px] text-muted-foreground">Busqueda inteligente de propiedades</div>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-[hsl(var(--brand))]/20 px-3.5 py-2 text-sm"
                      : "max-w-[85%] rounded-2xl rounded-tl-md bg-white/5 border border-white/10 px-3.5 py-2 text-sm"
                  }
                >
                  {m.content}
                </motion.div>
              ))}
              {loading && (
                <div className="max-w-[70%] rounded-2xl rounded-tl-md bg-white/5 border border-white/10 px-3.5 py-2 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:240ms]" />
                  </span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="border-t border-white/10 p-3"
            >
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ej: depto 2 dorm en Santiago bajo 100M CLP"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 py-2"
                />
                <Button type="submit" size="icon" disabled={!input.trim() || loading} className="h-8 w-8 rounded-xl">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
