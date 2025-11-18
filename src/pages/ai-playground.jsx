import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, Bot, User } from "lucide-react";
import { openaiChat } from "@/api/functions";
import { InvokeLLM } from "@/api/integrations";

export default function AIPlayground() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI assistant. How can I help?" }
  ]);
  const [input, setInput] = useState("");
  const [system, setSystem] = useState("You are a helpful mountaineering and health information assistant. Avoid medical advice; recommend consulting a physician.");
  const [model, setModel] = useState("gpt-4o-mini");
  const [isLoading, setIsLoading] = useState(false);

  const BACKOFF_KEY = "openai_quota_backoff_until";
  const getBackoffUntil = () => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(BACKOFF_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  };
  const [backoffUntil, setBackoffUntil] = useState(getBackoffUntil());
  const backoffActive = backoffUntil > Date.now();

  const [useOpenAI, setUseOpenAI] = useState(!backoffActive);

  const setBackoffForHours = (hours) => {
    const until = Date.now() + hours * 60 * 60 * 1000;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BACKOFF_KEY, String(until));
    }
    setBackoffUntil(until);
    setUseOpenAI(false);
  };

  const clearBackoff = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(BACKOFF_KEY);
    }
    setBackoffUntil(0);
  };

  const onSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setIsLoading(true);

    let replyText = null;

    const runFallback = async () => {
      const transcript = next
        .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");

      const sys = system ? `System: ${system}\n\n` : "";
      const prompt = `${sys}Continue the following conversation and reply to the last user message concisely and helpfully.\n\n${transcript}`;

      const res = await InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: { reply: { type: "string" } },
          required: ["reply"]
        }
      });

      return typeof res === "string" ? res : res?.reply;
    };

    try {
      if (useOpenAI && !backoffActive) {
        const { data } = await openaiChat({
          messages: next,
          model,
          system
        });
        replyText = data?.message?.content;
        if (!replyText) {
          throw new Error("Empty response from OpenAI");
        }
      } else {
        replyText = await runFallback();
      }
    } catch (e) {
      const status = e?.response?.status || e?.status || 0;
      const message = e?.response?.data?.error?.message || e?.message || "";
      const isQuota = status === 429 || /quota|rate limit|429/i.test(String(message));

      if (isQuota) {
        setBackoffForHours(12);
      }

      try {
        replyText = await runFallback();
      } catch {
        replyText = "Sorry, I'm having trouble right now. Please try again in a moment.";
      }
    } finally {
      setMessages([...next, { role: "assistant", content: replyText || "Sorry, I'm having trouble right now." }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary flex items-center gap-3">
              <Bot className="w-8 h-8 text-primary-blue" />
              AI Assistant
            </h1>
            <p className="text-text-secondary mt-1">Chat with OpenAI (gpt-4o / gpt-4o-mini). This is for demonstration only.</p>
          </div>
          <Badge className="bg-primary-blue/10 text-primary-blue border-primary-blue/20">Beta</Badge>
        </div>

        {backoffActive && (
          <Alert variant="destructive" className="bg-red-50">
            <AlertTitle>OpenAI quota limit reached</AlertTitle>
            <AlertDescription>
              We&apos;ll automatically use the built-in model instead. Backoff ends at {new Date(backoffUntil).toLocaleString()}.
            </AlertDescription>
          </Alert>
        )}

        <Card className="alpine-card border-0 shadow-lg">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-lg font-bold text-text-primary">Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">Model</label>
                <Select value={model} onValueChange={setModel} disabled={!useOpenAI || backoffActive}>
                  <SelectTrigger className="border-stone-200">
                    <SelectValue placeholder="Choose model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">gpt-4o-mini (faster, cheaper)</SelectItem>
                    <SelectItem value="gpt-4o">gpt-4o (higher quality)</SelectItem>
                  </SelectContent>
                </Select>
                {(!useOpenAI || backoffActive) && (
                  <p className="text-xs text-text-secondary mt-2">Using built-in model while OpenAI is off or in backoff.</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-text-primary mb-2 block">System Prompt</label>
                <Input
                  value={system}
                  onChange={(e) => setSystem(e.target.value)}
                  placeholder="Optional system behavior"
                  className="border-stone-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white">
              <div>
                <div className="text-sm font-medium text-text-primary">Use OpenAI (requires API quota)</div>
                <div className="text-xs text-text-secondary">
                  {backoffActive
                    ? `Disabled until ${new Date(backoffUntil).toLocaleString()} due to quota.`
                    : "Turn on to use your OpenAI key; otherwise a built-in model will be used."}
                </div>
              </div>
              <Switch
                checked={useOpenAI && !backoffActive}
                onCheckedChange={(checked) => {
                  if (backoffActive && checked) {
                    return;
                  }
                  if (!checked) {
                    clearBackoff();
                  }
                  setUseOpenAI(checked);
                }}
                disabled={backoffActive}
              />
            </div>

            <div className="text-xs text-text-secondary">
              Note: Do not use this for real medical decisions. Always consult a qualified physician.
            </div>
          </CardContent>
        </Card>

        <Card className="alpine-card border-0 shadow-lg">
          <CardHeader className="border-b border-stone-100">
            <CardTitle className="text-lg font-bold text-text-primary">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 md:p-6 space-y-4 max-h-[55vh] overflow-auto">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role !== "user" && (
                    <div className="w-8 h-8 rounded-lg bg-primary-blue/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary-blue" />
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-2 max-w-[80%] text-sm leading-relaxed ${
                    m.role === "user" ? "bg-stone-900 text-white" : "bg-white border border-stone-200"
                  }`}>
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-stone-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 p-4 md:p-6">
              <div className="flex items-end gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-[60px] border-stone-200"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                />
                <Button onClick={onSend} disabled={isLoading || !input.trim()} className="mountain-gradient hover:opacity-90 transition-opacity min-w-[110px]">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}