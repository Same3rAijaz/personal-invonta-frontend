import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Avatar, IconButton, Stack, Paper, CircularProgress } from "@mui/material";
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import TextField from "../components/CustomTextField";
import { useShopFriends } from "../hooks/useShopFriends";
import { useAuth } from "../hooks/useAuth";
import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "../utils/firebase";

export default function Chat() {
  const { business } = useAuth();
  const { data: friendsData, isLoading: friendsLoading } = useShopFriends();
  
  const [activeFriend, setActiveFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const friendsList = Array.isArray(friendsData) ? friendsData : (friendsData?.friends || friendsData?.items || []);

  useEffect(() => {
    // Determine the active friend
    if (!activeFriend && friendsList.length > 0) {
      setActiveFriend(friendsList[0]);
    }
  }, [friendsList, activeFriend]);

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

  const getFriendName = (f: any) => f?.business?.name || f?.name || "Unknown Shop";

  return (
    <Box sx={{ height: "calc(100vh - 120px)", display: "flex", gap: 3, animation: "fadeInUp 420ms ease" }}>
      {/* Left Sidebar - Friends List */}
      <Paper
        elevation={0}
        sx={{
          width: 320,
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(24px)",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.8)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.03)"
        }}
      >
        <Box sx={{ p: 3, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>Messages</Typography>
        </Box>
        <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
          {friendsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress size={24} /></Box>
          ) : friendsList.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: "center", mt: 4, color: "#94a3b8" }}>No shops connected yet.</Typography>
          ) : (
            friendsList.map((friend: any, index: number) => {
              const isActive = activeFriend && (activeFriend._id === friend._id);
              return (
                <Box
                  key={friend._id || index}
                  onClick={() => setActiveFriend(friend)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    mb: 1,
                    borderRadius: 3,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: isActive ? "#eff6ff" : "transparent",
                    "&:hover": { background: isActive ? "#eff6ff" : "rgba(0,0,0,0.02)" }
                  }}
                >
                  <Avatar sx={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", width: 44, height: 44 }}>
                    {getFriendName(friend).substring(0, 2).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: isActive ? 800 : 600, color: "#0f172a" }}>
                      {getFriendName(friend)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>Connected Shop</Typography>
                  </Box>
                </Box>
              )
            })
          )}
        </Box>
      </Paper>

      {/* Right Area - Chat Window */}
      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(24px)",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.8)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.03)"
        }}
      >
        {activeFriend ? (
          <>
            <Box sx={{ p: 2, borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.5)" }}>
              <Avatar sx={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                {getFriendName(activeFriend).substring(0, 2).toUpperCase()}
              </Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
                {getFriendName(activeFriend)}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              {messages.map((msg) => {
                const isMe = msg.senderId === business?._id;
                return (
                  <Box key={msg.id} sx={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                    <Box
                      sx={{
                        maxWidth: "70%",
                        p: 2,
                        borderRadius: 4,
                        borderBottomRightRadius: isMe ? 4 : 24,
                        borderBottomLeftRadius: !isMe ? 4 : 24,
                        background: isMe ? "linear-gradient(135deg, #0ea5e9, #6366f1)" : "#f1f5f9",
                        color: isMe ? "#ffffff" : "#0f172a",
                        boxShadow: isMe ? "0 4px 12px rgba(99,102,241,0.2)" : "none",
                      }}
                    >
                      <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{msg.text}</Typography>
                      {msg.createdAt && msg.createdAt.toDate && (
                         <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.7, textAlign: "right", fontSize: "0.65rem" }}>
                           {msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            <Box component="form" onSubmit={handleSend} sx={{ p: 2, borderTop: "1px solid rgba(0,0,0,0.05)", background: "rgba(255,255,255,0.5)" }}>
              <TextField
                fullWidth
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e: any) => setNewMessage(e.target.value)}
                autoComplete="off"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 8,
                    background: "#ffffff"
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton type="submit" disabled={!newMessage.trim()} sx={{ color: newMessage.trim() ? "#6366f1" : "inherit" }}>
                      <SendRoundedIcon />
                    </IconButton>
                  )
                }}
              />
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
