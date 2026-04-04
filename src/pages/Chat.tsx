import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Avatar, IconButton, Stack, Paper, CircularProgress } from "@mui/material";
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CircleIcon from '@mui/icons-material/Circle';
import Badge from '@mui/material/Badge';
import InputBase from '@mui/material/InputBase';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import TextField from "../components/CustomTextField";
import { useShopFriends } from "../hooks/useShopFriends";
import { useAuth } from "../hooks/useAuth";
import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "../utils/firebase";
import { useThemeMode } from "../contexts/ThemeContext";

export default function Chat() {
  const { business } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const { data: friendsData, isLoading: friendsLoading } = useShopFriends();
  
  const [activeFriend, setActiveFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const friendsList = Array.isArray(friendsData) ? friendsData : (friendsData?.friends || friendsData?.items || []);
  const filteredFriends = friendsList.filter((f: any) => 
    (f?.business?.name || f?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!activeFriend && filteredFriends.length > 0) {
      setActiveFriend(filteredFriends[0]);
    }
  }, [filteredFriends, activeFriend]);

  useEffect(() => {
    if (!business?._id || !activeFriend) return;

    // The target business ID is either the friend's direct ID, or inside business depending on schema
    const targetId = activeFriend.business?._id || activeFriend._id;
    if (!targetId) return;

    const myId = business._id;
    const chatId = [myId, targetId].sort().join("_");

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const msgs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, (error: any) => {
      console.warn("Firebase Chat Not Initialized fully yet:", error.message);
      // fallback mock behavior for demonstration if Firebase fails
      setMessages([
        { id: "mock1", text: "Firebase setup required. This is a mock message.", senderId: targetId, createdAt: { toDate: () => new Date() } },
        { id: "mock2", text: "Create a .env file and add VITE_FIREBASE_* variables to unlock real-time chat!", senderId: myId, createdAt: { toDate: () => new Date() } }
      ])
    });

    return () => unsubscribe();
  }, [business?._id, activeFriend]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !business?._id || !activeFriend) return;

    const targetId = activeFriend.business?._id || activeFriend._id;
    const chatId = [business._id, targetId].sort().join("_");
    const msgText = newMessage.trim();
    setNewMessage("");

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: msgText,
        senderId: business._id,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      // Mock update if firebase fails
      setMessages(prev => [...prev, { id: Date.now().toString(), text: msgText, senderId: business._id, createdAt: { toDate: () => new Date() } }]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const isOnline = (id: string) => {
    // Mock status: odd IDs are online, even are offline (for visual testing)
    return id.charCodeAt(id.length - 1) % 2 !== 0;
  };

  const getFriendName = (f: any) => f?.business?.name || f?.name || "Unknown Shop";

  return (
    <Box sx={{ 
      height: "calc(100vh - 120px)", 
      display: "flex", 
      gap: 3, 
      animation: "fadeInUp 420ms ease" 
    }}>
      <Paper
        elevation={0}
        sx={{
          width: 340,
          background: isDark ? "rgba(15, 23, 42, 0.4)" : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(24px)",
          borderRadius: 4,
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: isDark ? "0 10px 40px rgba(0,0,0,0.2)" : "0 10px 40px rgba(0,0,0,0.03)"
        }}
      >
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", mb: 2 }}>Messages</Typography>
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1.5, 
            px: 2, 
            py: 1, 
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.03)", 
            borderRadius: 3 
          }}>
            <SearchRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            <InputBase 
              fullWidth 
              placeholder="Search conversations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ fontSize: "0.85rem", color: "text.primary" }}
            />
          </Box>
        </Box>
        <Box 
          sx={{ 
            flexGrow: 1, 
            overflowY: "auto", 
            p: 1.5,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.1)", borderRadius: 10 }
          }}
        >
          {friendsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress size={24} /></Box>
          ) : filteredFriends.length === 0 ? (
            <Box sx={{ textAlign: "center", mt: 6, px: 2 }}>
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>No results found</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.7 }}>Try adjusting your search</Typography>
            </Box>
          ) : (
            filteredFriends.map((friend: any, index: number) => {
              const fid = friend._id || index;
              const isActive = activeFriend && (activeFriend._id === friend._id);
              const online = isOnline(String(fid));
              return (
                <Box
                  key={fid}
                  onClick={() => setActiveFriend(friend)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2.5,
                    p: 2,
                    mb: 0.8,
                    borderRadius: 3,
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: isActive ? (isDark ? "rgba(56,189,248,0.12)" : "#eff6ff") : "transparent",
                    border: isActive ? (isDark ? "1px solid rgba(56,189,248,0.2)" : "1px solid rgba(14,165,233,0.1)") : "1px solid transparent",
                    "&:hover": { 
                        background: isActive ? (isDark ? "rgba(56,189,248,0.18)" : "#eff6ff") : "rgba(15,23,42,0.03)",
                        transform: "translateX(4px)"
                    }
                  }}
                >
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{
                        "& .MuiBadge-badge": {
                          backgroundColor: online ? '#10b981' : '#94a3b8',
                          color: online ? '#10b981' : '#94a3b8',
                          boxShadow: `0 0 0 2px ${isDark ? "#1e293b" : "#fff"}`,
                          width: 12,
                          height: 12,
                          borderRadius: "50%"
                        }
                    }}
                  >
                    <Avatar sx={{ 
                        background: online 
                            ? "linear-gradient(135deg, #0ea5e9, #6366f1)" 
                            : "linear-gradient(135deg, #64748b, #475569)", 
                        width: 48, 
                        height: 48,
                        boxShadow: online ? "0 4px 12px rgba(14,165,233,0.3)" : "none"
                    }}>
                      {getFriendName(friend).substring(0, 2).toUpperCase()}
                    </Avatar>
                  </Badge>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: isActive ? 800 : 700, color: "text.primary", fontSize: "0.925rem" }}>
                          {getFriendName(friend)}
                        </Typography>
                        {index === 0 && !isActive && <CircleIcon sx={{ fontSize: 10, color: "#0ea5e9" }} />}
                    </Stack>
                    <Typography variant="caption" noWrap sx={{ color: "text.secondary", opacity: 0.8, display: "block", mt: 0.2 }}>
                        {online ? "Online now" : "Offline"}
                    </Typography>
                  </Box>
                </Box>
              )
            })
          )}
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          background: isDark ? "rgba(15, 23, 42, 0.4)" : "rgba(255,255,255,0.7)",
          backdropFilter: "blur(24px)",
          borderRadius: 4,
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: isDark ? "0 10px 40px rgba(0,0,0,0.2)" : "0 10px 40px rgba(0,0,0,0.03)"
        }}
      >
        {activeFriend ? (
          <>
            <Box sx={{ 
                p: 2, 
                px: 3,
                height: 80,
                borderBottom: "1px solid", 
                borderColor: "divider",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.5)" 
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ 
                      background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                      width: 44,
                      height: 44,
                      boxShadow: "0 4px 12px rgba(14,165,233,0.2)"
                  }}>
                    {getFriendName(activeFriend).substring(0, 2).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.2 }}>
                      {getFriendName(activeFriend)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isOnline(String(activeFriend._id)) ? "#10b981" : "text.secondary", fontWeight: 700, fontSize: "0.75rem" }}>
                        {isOnline(String(activeFriend._id)) ? "Online" : "Offline"}
                    </Typography>
                  </Box>
              </Box>
            </Box>

            <Box sx={{ 
                flexGrow: 1, 
                overflowY: "auto", 
                p: 3, 
                display: "flex", 
                flexDirection: "column", 
                gap: 1.5,
                background: isDark ? "rgba(0,0,0,0.1)" : "rgba(248,250,252,0.4)",
                "&::-webkit-scrollbar": { width: 5 },
                "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.05)", borderRadius: 10 }
            }}>
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === business?._id;
                const status = msg.status || 'sent';
                return (
                  <Box key={msg.id || idx} sx={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", width: "100%" }}>
                    <Box
                      sx={{
                        maxWidth: "75%",
                        width: "fit-content",
                        p: 1.5,
                        px: 2.2,
                        borderRadius: "22px",
                        borderBottomRightRadius: isMe ? 2 : 22,
                        borderBottomLeftRadius: !isMe ? 2 : 22,
                        background: isMe 
                            ? "linear-gradient(135deg, #0ea5e9, #6366f1)" 
                            : (isDark ? "#334155" : "#ffffff"),
                        color: isMe ? "#ffffff" : "text.primary",
                        boxShadow: isMe 
                            ? "0 4px 15px rgba(99,102,241,0.2)" 
                            : "0 2px 8px rgba(0,0,0,0.03)",
                        border: isMe ? "none" : "1px solid",
                        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                        animation: "fadeInUp 300ms ease-out",
                        position: "relative"
                      }}
                    >
                      <Typography variant="body2" sx={{ lineHeight: 1.55, fontSize: "0.95rem", fontWeight: isMe ? 500 : 400 }}>
                        {msg.text}
                      </Typography>
                      
                      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5} sx={{ mt: 0.5 }}>
                        <Typography variant="caption" sx={{ 
                             opacity: 0.7, 
                             fontSize: "0.68rem",
                             fontWeight: 600,
                             color: isMe ? "inherit" : "text.secondary"
                        }}>
                           {msg.createdAt && msg.createdAt.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </Typography>
                        {isMe && (
                           <Box sx={{ display: "flex", alignItems: "center", opacity: 0.8 }}>
                             {status === 'read' ? <DoneAllIcon sx={{ fontSize: 13, color: "#fff" }} /> : <DoneIcon sx={{ fontSize: 13, color: "#fff" }} />}
                           </Box>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            <Box component="form" onSubmit={handleSend} sx={{ 
                p: 2.5, 
                borderTop: "1px solid", 
                borderColor: "divider",
                background: isDark ? "rgba(15, 23, 42, 0.4)" : "rgba(255,255,255,0.6)" 
            }}>
              <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  background: isDark ? "#1e293b" : "#ffffff", 
                  borderRadius: 4, 
                  px: 2,
                  py: 0.5,
                  border: "1px solid",
                  borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
              }}>
                <InputBase
                  fullWidth
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoComplete="off"
                  sx={{ fontSize: "0.95rem", py: 1.2, color: "text.primary" }}
                />
                <IconButton 
                    type="submit" 
                    disabled={!newMessage.trim()} 
                    sx={{ 
                        color: "#6366f1",
                        "&.Mui-disabled": { color: "rgba(99,102,241,0.2)" }
                    }}
                >
                  <SendRoundedIcon />
                </IconButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 2 }}>
            <Box component="img" src="/Invonta.png" alt="Invonta" sx={{ width: 64, opacity: 0.2 }} />
            <Typography variant="subtitle1" sx={{ color: "#94a3b8", fontWeight: 600 }}>Select a shop to start chatting</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
