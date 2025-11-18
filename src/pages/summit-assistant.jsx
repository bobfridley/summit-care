import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/api/authClient"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Send, Mountain, MessageSquare, AlertTriangle, Smartphone, ArrowLeft } from "lucide-react";
import MessageBubble from "../components/agent/MessageBubble";

export default function SummitAssistant() {
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initConversation = async () => {
      try {
        const conversation = await authClient.agents.createConversation({
          agent_name: "summit_assistant",
          metadata: {
            name: "Summit Assistant Chat",
            description: "Altitude medicine and mountaineering guidance"
          }
        });
        setConversationId(conversation.id);
      } catch (err) {
        console.error("Error creating conversation:", err);
        setError("Failed to initialize chat");
      }
    };
    initConversation();
  }, []);

  useEffect(() => {
    if (conversationId && !hasAutoSent) {
      const urlParams = new URLSearchParams(window.location.search);
      const askParam = urlParams.get('ask');
      if (askParam) {
        setInputValue(askParam);
        setHasAutoSent(true);
        
        setTimeout(() => {
          handleSendMessage(askParam);
          // Clear URL parameter
          window.history.replaceState({}, '', window.location.pathname);
        }, 500);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, hasAutoSent]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = authClient.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleSendMessage = async (messageText) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend || !conversationId || isLoading) return;

    setInputValue("");
    setIsLoading(true);
    setError("");

    try {
      const conversation = await authClient.agents.getConversation(conversationId);
      await authClient.agents.addMessage(conversation, {
        role: "user",
        content: textToSend
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    handleSendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const whatsappURL = authClient.agents.getWhatsAppConnectURL('summit_assistant');

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(-1)}
                className="border-2 border-[#2D5016] text-[#2D5016] hover:!bg-[#2D5016] hover:!text-white transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-12 h-12 mountain-gradient rounded-xl flex items-center justify-center shadow-lg">
                <Mountain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">Summit Assistant</h1>
                <p className="text-text-secondary">Your AI mountaineering advisor</p>
              </div>
            </div>
            <a href={whatsappURL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <Smartphone className="w-4 h-4" />
                Connect WhatsApp
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary-green/10 text-primary-green border-primary-green/20">
              <MessageSquare className="w-3 h-3 mr-1" />
              Medication Safety
            </Badge>
            <Badge className="bg-primary-blue/10 text-primary-blue border-primary-blue/20">
              <Mountain className="w-3 h-3 mr-1" />
              Gear Planning
            </Badge>
            <Badge className="bg-accent-green/10 text-primary-green border-accent-green/20">
              Weather & Conditions
            </Badge>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="alpine-card border-0 shadow-xl flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-stone-100 py-4">
            <CardTitle className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-blue" />
              Chat
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Mountain className="w-16 h-16 text-secondary-blue mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">Ready to help you summit safely</h3>
                <p className="text-text-secondary max-w-md">
                  Ask me about medication risks, gear recommendations, pack weight, weather conditions, or any mountaineering questions!
                </p>
                <div className="mt-6 space-y-2 text-sm text-text-secondary">
                  <p className="font-medium">Try asking:</p>
                  <div className="space-y-1">
                    <p>&#34;What medications do I have that could be risky above 12,000 feet?&#34;</p>
                    <p>&#34;Help me plan gear for my upcoming Rainier climb&#34;</p>
                    <p>&#34;What&#39;s the weather forecast for Denali this week?&#34;</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, idx) => (
                  <MessageBubble key={idx} message={message} />
                ))}
                {isLoading && messages.length === 0 && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-blue"></div>
                    <span className="text-sm">Starting conversation...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          <div className="border-t border-stone-100 p-4">
            <div className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about medications, gear, weather, or climbing advice..."
                disabled={!conversationId || isLoading}
                className="border-stone-200 focus:border-primary-blue"
              />
              <Button
                onClick={handleSend}
                disabled={!conversationId || !inputValue.trim() || isLoading}
                className="mountain-gradient hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {isLoading && (
              <p className="text-xs text-text-secondary mt-2 ml-1">Assistant is thinking...</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}