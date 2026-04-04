import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Avatar, IconButton, Stack, Paper, CircularProgress } from "@mui/material";
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CircleIcon from '@mui/icons-material/Circle';
import Badge from '@mui/material/Badge';
import InputBase from '@mui/material/InputBase';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InventoryIcon from '@mui/icons-material/Inventory';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button as MuiButton, 
  Checkbox, 
  FormControlLabel,
  Grid as MuiGrid
} from "@mui/material";
import TextField from "../components/CustomTextField";
import { useShopFriends } from "../hooks/useShopFriends";
import { useAuth } from "../hooks/useAuth";
import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc, updateDoc, where } from "../utils/firebase";
import { useThemeMode } from "../contexts/ThemeContext";
import { useProducts } from "../hooks/useProducts";
import { uploadImage } from "../utils/upload";

export default function Chat() {
  const { business } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const { data: friendsData, isLoading: friendsLoading } = useShopFriends();
  
  const [activeFriend, setActiveFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [presenceMap, setPresenceMap] = useState<Record<string, any>>({});
  
  const { data: productsData } = useProducts({ limit: 100 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time Presence Listener for all friends
  useEffect(() => {
    const presenceRef = collection(db, "presence");
    const unsub = onSnapshot(presenceRef, (snapshot: any) => {
        const pMap: Record<string, any> = {};
        snapshot.docs.forEach((doc: any) => {
            const data = doc.data();
            pMap[doc.id] = data;
        });
        setPresenceMap(pMap);
    });
    return () => unsub();
  }, []);

  const friendsList = Array.isArray(friendsData) ? friendsData : (friendsData?.friends || friendsData?.items || []);
  const filteredFriends = friendsList.filter((f: any) => 
    (f?.business?.name || f?.name || f?.groupName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!activeFriend && filteredFriends.length > 0) {
      setActiveFriend(filteredFriends[0]);
    }
  }, [filteredFriends, activeFriend]);

  useEffect(() => {
    if (!business?._id || !activeFriend) return;

    const chatId = activeFriend.type === 'group' 
        ? activeFriend._id 
        : [business._id, (activeFriend.business?._id || activeFriend._id)].sort().join("_");

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
      
      // MARK AS READ: If the last message is from the other person and unread, mark it read
      msgs.forEach(async (m: any) => {
          if (m.senderId !== business?._id && m.status !== 'read') {
              await updateDoc(doc(db, "chats", chatId, "messages", m.id), { status: 'read' });
          }
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [business?._id, activeFriend]);

  const sendMessage = async (content: any) => {
    if (!business?._id || !activeFriend) return;
    const chatId = activeFriend.type === 'group' 
        ? activeFriend._id 
        : [business._id, (activeFriend.business?._id || activeFriend._id)].sort().join("_");

    await addDoc(collection(db, "chats", chatId, "messages"), {
      ...content,
      senderId: business._id,
      senderName: business.name,
      createdAt: serverTimestamp(),
      status: 'delivered'
    });
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage("");
    await sendMessage({ type: 'text', text });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !business?._id) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
          const url = await uploadImage(files[i], `chats/${business._id}`);
          await sendMessage({ type: 'image', imageUrl: url, fileName: files[i].name, text: `Sent an image: ${files[i].name}` });
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAttachProduct = async (product: any) => {
    setProductDialogOpen(false);
    await sendMessage({ 
      type: 'product', 
      productId: product._id, 
      productName: product.name, 
      productPrice: product.salePrice,
      productImage: product.thumbnailUrl || product.images?.[0],
      productDescription: product.description,
      productCategory: product.category?.name || product.category,
      text: `Check out this product: ${product.name}`
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriendsForGroup.length === 0 || !business?._id) return;
    const groupId = `group_${Date.now()}`;
    const members = [business._id, ...selectedFriendsForGroup];
    
    await setDoc(doc(db, "chats", groupId), {
      _id: groupId,
      groupName: groupName.trim(),
      type: 'group',
      members,
      createdBy: business._id,
      createdAt: serverTimestamp()
    });

    setGroupDialogOpen(false);
    setGroupName("");
    setSelectedFriendsForGroup([]);
    alert("Group created! Note: Production needs a group fetch sync.");
  };

  const isOnline = (id: string) => {
    const p = presenceMap[id];
    if (!p) return false;
    // Online if status is 'online' AND last heartbeat was < 45s ago
    const isActive = p.status === 'online' && p.lastSeen && (Date.now() - p.lastSeen.toMillis() < 45000);
    return isActive;
  };

  const getFriendName = (f: any) => f?.groupName || f?.business?.name || f?.name || "Unknown Shop";

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
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>Messages</Typography>
            <IconButton onClick={() => setGroupDialogOpen(true)} color="primary" sx={{ bgcolor: "primary.light", color: "primary.main", "&:hover": { bgcolor: "primary.light", opacity: 0.8 } }}>
                <GroupAddIcon />
            </IconButton>
          </Stack>
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
            </Box>
          ) : (
            filteredFriends.map((friend: any, index: number) => {
              const fid = friend._id || friend.business?._id || index;
              const isActive = activeFriend && (activeFriend._id === friend._id);
              const online = isOnline(String(friend.business?._id || friend._id));
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
                    background: isActive ? (isDark ? "rgba(56,189,248,0.12)" : "#eff6ff") : "transparent",
                    "&:hover": { background: isActive ? (isDark ? "rgba(56,189,248,0.18)" : "#eff6ff") : "rgba(15,23,42,0.03)" }
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
                          width: 10,
                          height: 10,
                          borderRadius: "50%"
                        }
                    }}
                  >
                    <Avatar sx={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                        {getFriendName(friend).substring(0, 2).toUpperCase()}
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{getFriendName(friend)}</Typography>
                    <Typography variant="caption" sx={{ color: online ? "#10b981" : "text.secondary" }}>
                        {online ? "Active Now" : "Offline"}
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
          overflow: "hidden"
        }}
      >
        {activeFriend ? (
          <>
            <Box sx={{ p: 2, px: 3, height: 80, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 2 }}>
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{
                        "& .MuiBadge-badge": {
                          backgroundColor: isOnline(String(activeFriend.business?._id || activeFriend._id)) ? '#10b981' : '#94a3b8',
                          width: 12, height: 12, borderRadius: "50%"
                        }
                    }}
                >
                    <Avatar sx={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                        {getFriendName(activeFriend).substring(0, 2).toUpperCase()}
                    </Avatar>
                </Badge>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{getFriendName(activeFriend)}</Typography>
                    <Typography variant="caption" sx={{ color: isOnline(String(activeFriend.business?._id || activeFriend._id)) ? "#10b981" : "text.secondary", fontWeight: 700 }}>
                        {isOnline(String(activeFriend.business?._id || activeFriend._id)) ? "Online" : "Offline"}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
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
                        borderRadius: "12px",
                        borderBottomRightRadius: isMe ? 2 : 12,
                        borderBottomLeftRadius: !isMe ? 2 : 12,
                        background: isMe ? "linear-gradient(135deg, #0ea5e9, #6366f1)" : (isDark ? "#334155" : "#ffffff"),
                        color: isMe ? "#ffffff" : "text.primary",
                        border: isMe ? "none" : "1px solid",
                        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"
                      }}
                    >
                      {!isMe && activeFriend?.type === 'group' && (
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", mb: 0.5, display: "block" }}>
                            {msg.senderName || "Unknown Member"}
                        </Typography>
                      )}

                      {msg.type === 'image' && (
                        <Box sx={{ mb: 1, cursor: "pointer" }} onClick={() => window.open(msg.imageUrl, '_blank')}>
                            <img src={msg.imageUrl} alt="Attached" style={{ width: "100%", maxHeight: 200, borderRadius: 8, objectFit: "cover" }} />
                        </Box>
                      )}

                      {msg.type === 'product' && (
                        <Box sx={{ 
                           mb: 1.5, p: 1.5, borderRadius: 2, 
                           width: 240,
                           background: isMe ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.04)",
                           border: "1px solid",
                           borderColor: isMe ? "rgba(255,255,255,0.2)" : "divider"
                        }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                <Avatar src={msg.productImage} variant="rounded" sx={{ width: 48, height: 48 }} />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>{msg.productName}</Typography>
                                    <Typography variant="caption" sx={{ color: isMe ? "rgba(255,255,255,0.8)" : "text.secondary" }}>
                                        {msg.productCategory} • ₨{msg.productPrice?.toLocaleString()}
                                    </Typography>
                                </Box>
                            </Stack>
                            {msg.productDescription && (
                                <Typography variant="caption" sx={{ 
                                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", 
                                    overflow: "hidden", mb: 1, opacity: 0.8, fontSize: "0.7rem" 
                                }}>
                                    {msg.productDescription}
                                </Typography>
                            )}
                            <MuiButton 
                                fullWidth size="small" variant="contained" 
                                sx={{ color: isMe ? "primary.main" : "#fff", bgcolor: isMe ? "#fff" : "primary.main", fontSize: "0.7rem", py: 0.5 }}
                            >
                                View Details
                            </MuiButton>
                        </Box>
                      )}

                      {msg.text && (
                        <Typography variant="body2" sx={{ lineHeight: 1.55, fontSize: "0.92rem", fontWeight: isMe ? 500 : 400 }}>
                            {msg.text}
                        </Typography>
                      )}
                      
                      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5} sx={{ mt: 0.5 }}>
                        <Typography variant="caption" sx={{ opacity: 0.7, fontSize: "0.68rem", fontWeight: 600, color: isMe ? "inherit" : "text.secondary" }}>
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

            <Box component="form" onSubmit={handleSendText} sx={{ p: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
              <Box sx={{ display: "flex", alignItems: "center", background: isDark ? "#1e293b" : "#ffffff", borderRadius: 4, px: 1, py: 0.5, border: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                <IconButton onClick={() => fileInputRef.current?.click()} color="primary" sx={{ opacity: 0.7 }}>
                  <AttachFileIcon />
                </IconButton>
                <IconButton onClick={() => setProductDialogOpen(true)} color="primary" sx={{ opacity: 0.7 }}>
                  <InventoryIcon />
                </IconButton>
                <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                
                <InputBase
                  fullWidth
                  placeholder={isUploading ? "Uploading..." : "Type your message..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoComplete="off"
                  disabled={isUploading}
                  sx={{ fontSize: "0.95rem", py: 1.2, color: "text.primary", ml: 1 }}
                />
                <IconButton 
                    type="submit" 
                    disabled={!newMessage.trim() || isUploading} 
                    sx={{ color: "#6366f1", "&.Mui-disabled": { color: "rgba(99,102,241,0.2)" } }}
                >
                  {isUploading ? <CircularProgress size={20} /> : <SendRoundedIcon />}
                </IconButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle1" sx={{ color: "#94a3b8", fontWeight: 600 }}>Select a shop to start chatting</Typography>
          </Box>
        )}
      </Paper>

      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Attach Product</DialogTitle>
        <DialogContent dividers>
            <MuiGrid container spacing={2}>
                {(productsData?.items || productsData || []).length === 0 ? (
                    <Box sx={{ p: 4, width: "100%", textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">Your inventory is empty.</Typography>
                    </Box>
                ) : (
                    (productsData?.items || productsData || []).map((p: any) => (
                        <MuiGrid item xs={12} key={p._id}>
                            <Paper sx={{ p: 1.5, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }} onClick={() => handleAttachProduct(p)} variant="outlined">
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar src={p.thumbnailUrl || p.images?.[0]} variant="rounded" />
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>{p.name}</Typography>
                                        <Typography variant="caption">₨{p.salePrice?.toLocaleString()}</Typography>
                                    </Box>
                                    <MuiButton variant="outlined" size="small">Select</MuiButton>
                                </Stack>
                            </Paper>
                        </MuiGrid>
                    ))
                )}
            </MuiGrid>
        </DialogContent>
        <DialogActions>
            <MuiButton onClick={() => setProductDialogOpen(false)}>Cancel</MuiButton>
        </DialogActions>
      </Dialog>

      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Group</DialogTitle>
        <DialogContent dividers>
            <TextField fullWidth label="Group Name" value={groupName} onChange={(e: any) => setGroupName(e.target.value)} sx={{ mb: 3 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Select Members</Typography>
            <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                {friendsList.map((f: any) => (
                    <FormControlLabel
                        key={f._id}
                        control={
                            <Checkbox 
                                checked={selectedFriendsForGroup.includes(f.business?._id || f._id)} 
                                onChange={(e) => {
                                    const id = f.business?._id || f._id;
                                    if (e.target.checked) setSelectedFriendsForGroup(p => [...p, id]);
                                    else setSelectedFriendsForGroup(p => p.filter(x => x !== id));
                                }}
                            />
                        }
                        label={getFriendName(f)}
                        sx={{ width: "100%", m: 0, p: 0.5 }}
                    />
                ))}
            </Box>
        </DialogContent>
        <DialogActions>
            <MuiButton onClick={() => setGroupDialogOpen(false)}>Cancel</MuiButton>
            <MuiButton variant="contained" onClick={handleCreateGroup} disabled={!groupName.trim() || selectedFriendsForGroup.length === 0}>
                Create Group
            </MuiButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
