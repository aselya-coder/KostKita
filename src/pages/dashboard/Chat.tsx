import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markMessagesAsRead, 
  type Conversation, 
  type Message 
} from "@/services/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Search, 
  MoreVertical, 
  ArrowLeft, 
  MessageSquare,
  Clock,
  Check,
  CheckCheck,
  Loader2,
  Phone
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const data = await getConversations(user.id);
      setConversations(data);
    } catch (error) {
      toast.error("Gagal memuat percakapan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to new conversations/updates
    let mounted = true;
    const channel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (!mounted && channel) {
            supabase.removeChannel(channel);
          }
        }
      });

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const fetchMessages = async (conversationId: string) => {
    setIsMessagesLoading(true);
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
      if (user) await markMessagesAsRead(conversationId, user.id);
    } catch (error) {
      toast.error("Gagal memuat pesan");
    } finally {
      setIsMessagesLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);

      // Subscribe to new messages for this conversation
      let mounted = true;
      const channel = supabase
        .channel(`messages-${selectedConversation.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${selectedConversation.id}` 
        }, (payload) => {
          const newMessage = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMessage.id,
            conversationId: newMessage.conversation_id,
            senderId: newMessage.sender_id,
            content: newMessage.content,
            isRead: newMessage.is_read,
            createdAt: newMessage.created_at
          }]);
          if (user && newMessage.sender_id !== user.id) {
            markMessagesAsRead(selectedConversation.id, user.id);
          }
          scrollToBottom();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            if (!mounted && channel) {
              supabase.removeChannel(channel);
            }
          }
        });

      return () => {
        mounted = false;
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    } else {
      setMessages([]);
    }
  }, [selectedConversation, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      const result = await sendMessage(selectedConversation.id, user.id, content);
      if (!result.success) {
        toast.error("Gagal mengirim pesan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengirim pesan");
    }
  };

  const handleOpenWhatsApp = () => {
    if (!selectedConversation?.otherParticipant?.phone) {
      toast.error("Nomor WhatsApp tidak tersedia");
      return;
    }
    
    const phone = selectedConversation.otherParticipant.phone;
    const name = selectedConversation.otherParticipant.name;
    const lastMsg = messages.length > 0 ? messages[messages.length - 1].content : "";
    const text = `Halo ${name}, saya melanjutkan percakapan dari KosKita: ${encodeURIComponent(lastMsg)}`;
    
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const selectConv = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowChatWindow(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] bg-card border border-border rounded-3xl overflow-hidden shadow-xl flex">
      {/* Sidebar List */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 border-r border-border flex flex-col transition-all",
        isMobileView && showChatWindow ? "hidden" : "flex"
      )}>
        <div className="p-6 border-b border-border bg-primary/5">
          <h1 className="text-xl font-bold font-display">Pesan Chat</h1>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari kontak..."
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConv(conv)}
                className={cn(
                  "w-full p-4 flex items-center gap-4 hover:bg-secondary/50 transition-all border-b border-border/50",
                  selectedConversation?.id === conv.id ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                )}
              >
                <Avatar className="w-12 h-12 shadow-sm">
                  <AvatarImage src={conv.otherParticipant?.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {conv.otherParticipant?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-foreground truncate">{conv.otherParticipant?.name}</h3>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false, locale: id })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate italic">
                    {conv.lastMessage || "Mulai percakapan..."}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Belum ada percakapan chat.</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-surface/30",
        isMobileView && !showChatWindow ? "hidden" : "flex"
      )}>
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-border bg-background flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                {isMobileView && (
                  <Button variant="ghost" size="icon" onClick={() => setShowChatWindow(false)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <Avatar className="w-10 h-10 shadow-sm">
                  <AvatarImage src={selectedConversation.otherParticipant?.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {selectedConversation.otherParticipant?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-foreground">{selectedConversation.otherParticipant?.name}</h3>
                  <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {selectedConversation.otherParticipant?.phone && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleOpenWhatsApp}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-2 hidden sm:flex"
                  >
                    <Phone className="w-4 h-4" />
                    Buka di WhatsApp
                  </Button>
                )}
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-surface/50">
              {isMessagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex flex-col max-w-[80%]",
                        isOwn ? "ml-auto items-end" : "items-start"
                      )}
                    >
                      <div className={cn(
                        "px-4 py-2.5 rounded-2xl shadow-sm text-sm",
                        isOwn 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-card border border-border text-foreground rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[9px] text-muted-foreground uppercase font-medium">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOwn && (
                          msg.isRead ? (
                            <CheckCheck className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Check className="w-3 h-3 text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-primary/20" />
                  </div>
                  <h3 className="font-bold text-foreground">Awal Percakapan</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                    Kirim pesan pertama untuk memulai obrolan dengan {selectedConversation.otherParticipant?.name}.
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form 
              onSubmit={handleSendMessage}
              className="p-4 bg-background border-t border-border flex items-center gap-3"
            >
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 px-4 py-3 bg-secondary/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="rounded-2xl w-12 h-12 p-0 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Pilih Percakapan</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Klik salah satu kontak di sebelah kiri untuk mulai mengobrol.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
