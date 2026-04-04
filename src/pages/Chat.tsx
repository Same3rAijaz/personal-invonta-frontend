import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CloseIcon from '@mui/icons-material/Close';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button as MuiButton, 
  Checkbox, 
  FormControlLabel,
  Grid as MuiGrid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from "@mui/material";
import TextField from "../components/CustomTextField";
import { useShopFriends } from "../hooks/useShopFriends";
import { useAuth } from "../hooks/useAuth";
import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc, updateDoc, where } from "../utils/firebase";
import { useThemeMode } from "../contexts/ThemeContext";
import { useProducts } from "../hooks/useProducts";
import { uploadImage } from "../utils/upload";

export default function Chat() {
  const navigate = useNavigate();
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
  const [groupsData, setGroupsData] = useState<any[]>([]);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [selectedProductPreview, setSelectedProductPreview] = useState<any>(null);
  
  const { data: productsData } = useProducts({ limit: 100 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats/Metadata for sorting
  const [chatMeta, setChatMeta] = useState<Record<string, any>>({});

  // Real-time Presence Listener
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

  // Sync groups + metadata in real-time
  useEffect(() => {
    if (!business?._id) return;
    const groupsRef = collection(db, "chats");
    const q = query(groupsRef, where("members", "array-contains", business._id));
    
    const unsub = onSnapshot(q, (snapshot: any) => {
        const groups: any[] = [];
        const meta: Record<string, any> = {};
        
        snapshot.docs.forEach((doc: any) => {
            const data = doc.data();
            if (data.type === 'group') {
                groups.push({ id: doc.id, _id: doc.id, ...data });
            }
            meta[doc.id] = data;
        });
        
        setGroupsData(groups);
        setChatMeta(meta);
    });
    return () => unsub();
  }, [business?._id]);

  const friendsList = Array.isArray(friendsData) ? friendsData : (friendsData?.friends || friendsData?.items || []);
  
  // MERGE & SORT
  const allConversations = [
      ...friendsList.map((f: any) => {
          const fid = f.business?._id || f._id;
          const chatId = [business?._id, fid].sort().join("_");
          return { ...f, chatId, lastMessageAt: chatMeta[chatId]?.lastMessageAt };
      }),
      ...groupsData.map((g: any) => ({ ...g, chatId: g.id }))
  ].sort((a, b) => {
      const timeA = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : (a.lastMessageAt instanceof Date ? a.lastMessageAt.getTime() : 0);
      const timeB = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : (b.lastMessageAt instanceof Date ? b.lastMessageAt.getTime() : 0);
      return timeB - timeA;
  });

  const filteredFriends = allConversations.filter((f: any) => 
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
        ? activeFriend.id || activeFriend._id
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
        ? activeFriend.id || activeFriend._id
        : [business._id, (activeFriend.business?._id || activeFriend._id)].sort().join("_");

    const sanitizedContent = JSON.parse(JSON.stringify(content, (_, value) => (value === undefined ? null : value)));

    // Update Message
    await addDoc(collection(db, "chats", chatId, "messages"), {
      ...sanitizedContent,
      senderId: business._id,
      senderName: business.name,
      createdAt: serverTimestamp(),
      status: 'delivered'
    });

    // Update Chat Metadata for Sorting
    await setDoc(doc(db, "chats", chatId), {
        lastMessage: content.text || (content.type === 'image' ? "Sent an image" : "Shared a product"),
        lastMessageAt: serverTimestamp(),
        members: activeFriend.type === 'group' ? activeFriend.members : [business._id, (activeFriend.business?._id || activeFriend._id)],
        type: activeFriend.type || 'private'
    }, { merge: true });
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
      productId: product._id || "", 
      productName: product.name || "Product", 
      productPrice: product.salePrice || 0,
      productImage: product.thumbnailUrl || product.images?.[0] || "",
      productDescription: product.description || "",
      productCategory: (typeof product.category === 'object' ? product.category?.name : product.category) || "General",
      text: `Check out this product: ${product.name || "Product"}`
    });
  };

  const handleLeaveGroup = async () => {
    if (!activeFriend || !business?._id) return;
    const newMembers = (activeFriend.members || []).filter((m: string) => m !== business._id);
    if (newMembers.length === 0) {
        await updateDoc(doc(db, "chats", activeFriend.id), { members: [], status: 'deleted' });
    } else {
        await updateDoc(doc(db, "chats", activeFriend.id), { members: newMembers });
    }
    setGroupSettingsOpen(false);
    setActiveFriend(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeFriend) return;
    const newMembers = activeFriend.members.filter((m: string) => m !== memberId);
    await updateDoc(doc(db, "chats", activeFriend.id), { members: newMembers });
  };

  const handleUpdateGroupName = async () => {
    if (!activeFriend || !editingGroupName.trim()) return;
    await updateDoc(doc(db, "chats", activeFriend.id), { groupName: editingGroupName });
    setGroupSettingsOpen(false);
  };

  const handleDeleteGroup = async () => {
    if (!activeFriend) return;
    await updateDoc(doc(db, "chats", activeFriend.id), { status: 'deleted', members: [] });
    setGroupSettingsOpen(false);
    setActiveFriend(null);
  };

  const handleMuteToggle = async () => {
    if (!activeFriend || !business?._id) return;
    const mutedBy = activeFriend.mutedBy || [];
    const isMuted = mutedBy.includes(business._id);
    const newMutedBy = isMuted ? mutedBy.filter((i: string) => i !== business._id) : [...mutedBy, business._id];
    await updateDoc(doc(db, "chats", activeFriend.id), { mutedBy: newMutedBy });
  };

  const isMuted = activeFriend?.mutedBy?.includes(business?._id);
  const isAdmin = activeFriend?.createdBy === business?._id;

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriendsForGroup.length === 0) return;
    
    // Auto include self
    const members = [...selectedFriendsForGroup, business._id];
    
    await addDoc(collection(db, "chats"), {
      groupName,
      members,
      type: 'group',
      createdAt: serverTimestamp(),
      createdBy: business._id,
      lastMessage: "Group created",
      lastMessageAt: serverTimestamp(),
      mutedBy: []
    });

    setGroupDialogOpen(false);
    setGroupName("");
    setSelectedFriendsForGroup([]);
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
                <GroupsRoundedIcon />
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
                    gap: 1.5,
                    p: 1.5,
                    mb: 0.5,
                    borderRadius: 3,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: isActive ? (isDark ? "rgba(56,189,248,0.12)" : "#eff6ff") : "transparent",
                    "&:hover": { background: isActive ? (isDark ? "rgba(56,189,248,0.18)" : "#eff6ff") : (isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)") }
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
                    <Avatar 
                       sx={{ 
                         width: 44, height: 44,
                         background: friend.type === 'group' ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "linear-gradient(135deg, #0ea5e9, #6366f1)",
                         fontSize: "1rem", fontWeight: 700
                       }}>
                        {friend.type === 'group' ? <GroupsRoundedIcon /> : getFriendName(friend).substring(0, 2).toUpperCase()}
                    </Avatar>
                  </Badge>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {getFriendName(friend)}
                        </Typography>
                        {friend.lastMessageAt && (
                           <Typography variant="caption" sx={{ opacity: 0.5, fontSize: "0.65rem" }}>
                               {friend.lastMessageAt.toDate ? friend.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                           </Typography>
                        )}
                    </Stack>
                    <Typography 
                        variant="caption" 
                        noWrap 
                        sx={{ 
                            color: "text.secondary", 
                            display: "block", 
                            opacity: 0.8,
                            fontSize: "0.75rem"
                        }}
                    >
                        {chatMeta[friend.chatId]?.lastMessage || (online ? "Active Now" : "Offline")}
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
                    <Avatar sx={{ background: activeFriend.type === 'group' ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
                        {activeFriend.type === 'group' ? <GroupsRoundedIcon /> : getFriendName(activeFriend).substring(0, 2).toUpperCase()}
                    </Avatar>
                </Badge>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{getFriendName(activeFriend)}</Typography>
                    <Typography variant="caption" sx={{ color: isOnline(String(activeFriend.business?._id || activeFriend._id)) ? "#10b981" : "text.secondary", fontWeight: 700 }}>
                        {activeFriend.type === 'group' ? `${activeFriend.members?.length || 0} Members` : (isOnline(String(activeFriend.business?._id || activeFriend._id)) ? "Online" : "Offline")}
                    </Typography>
                </Box>
                <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                    {activeFriend.type === 'group' && (
                        <>
                            <IconButton size="small" onClick={handleMuteToggle} sx={{ opacity: 0.7 }}>
                                {isMuted ? <NotificationsOffIcon fontSize="small" /> : <NotificationsActiveIcon fontSize="small" />}
                            </IconButton>
                            <IconButton size="small" onClick={() => {
                                setEditingGroupName(activeFriend.groupName);
                                setGroupSettingsOpen(true);
                            }} color="primary" sx={{ opacity: 0.7 }}>
                                <SettingsIcon fontSize="small" />
                            </IconButton>
                        </>
                    )}
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
                                onClick={() => setSelectedProductPreview(msg)}
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
              <Box sx={{ display: "flex", alignItems: "center", background: isDark ? "#1e293b" : "#ffffff", borderRadius: 4, px: 0.5, py: 0.5, border: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
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

      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, textAlign: "center", pb: 1 }}>New Group Chat</DialogTitle>
        <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <Box>
                    <Typography variant="caption" sx={{ ml: 1, fontWeight: 700, opacity: 0.6 }}>GROUP NAME</Typography>
                    <TextField 
                        fullWidth 
                        placeholder="e.g. Sales Team" 
                        value={groupName} 
                        onChange={(e: any) => setGroupName(e.target.value)} 
                        autoFocus
                    />
                </Box>
                
                <Box>
                    <Typography variant="caption" sx={{ ml: 1, fontWeight: 700, opacity: 0.6 }}>SELECT MEMBERS</Typography>
                    <Paper variant="outlined" sx={{ maxHeight: 240, overflow: "auto", borderRadius: 3, mt: 1 }}>
                        <List sx={{ py: 0 }}>
                            {friendsList.map((f: any) => (
                                <ListItem key={f._id} sx={{ py: 0.5 }}>
                                    <FormControlLabel
                                        sx={{ width: "100%", m: 0 }}
                                        control={
                                            <Checkbox 
                                                size="small"
                                                checked={selectedFriendsForGroup.includes(f.business?._id || f._id)}
                                                onChange={(e) => {
                                                    const id = f.business?._id || f._id;
                                                    setSelectedFriendsForGroup(prev => 
                                                        e.target.checked ? [...prev, id] : prev.filter(i => i !== id)
                                                    );
                                                }}
                                            />
                                        }
                                        label={
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar sx={{ width: 28, height: 28, fontSize: "0.8rem" }}>{getFriendName(f).charAt(0)}</Avatar>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{getFriendName(f)}</Typography>
                                            </Stack>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Box>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
            <MuiButton fullWidth onClick={() => setGroupDialogOpen(false)} sx={{ fontWeight: 700 }}>Cancel</MuiButton>
            <MuiButton 
                fullWidth variant="contained" 
                onClick={handleCreateGroup} 
                disabled={!groupName.trim() || selectedFriendsForGroup.length === 0}
                sx={{ fontWeight: 700, borderRadius: 2 }}
            >
                Create Group
            </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Group Settings Dialog */}
      <Dialog 
        open={groupSettingsOpen} 
        onClose={() => setGroupSettingsOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
            Group Info
            {isAdmin && (
                <IconButton color="error" size="small" onClick={handleDeleteGroup} sx={{ bgcolor: "error.light", color: "error.main", "&:hover": { bgcolor: "error.light", opacity: 0.8 } }}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            )}
        </DialogTitle>
        <DialogContent sx={{ pb: 0 }}>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <Avatar sx={{ width: 80, height: 80, background: "linear-gradient(135deg, #f59e0b, #ef4444)", fontSize: "2rem", boxShadow: "0 10px 20px rgba(239,68,68,0.2)" }}>
                        <GroupsRoundedIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    {isAdmin ? (
                        <Box sx={{ width: "100%" }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5, ml: 1, fontSize: "0.65rem", textTransform: "uppercase" }}>Group Name</Typography>
                            <TextField 
                                fullWidth 
                                variant="outlined"
                                value={editingGroupName} 
                                onChange={(e: any) => setEditingGroupName(e.target.value)} 
                                sx={{ mt: 0.5 }}
                            />
                        </Box>
                    ) : (
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>{activeFriend?.groupName}</Typography>
                    )}
                </Box>

                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5, ml: 0.5, fontSize: "0.65rem", textTransform: "uppercase" }}>Members • {activeFriend?.members?.length || 0}</Typography>
                    <Paper variant="outlined" sx={{ mt: 1, borderRadius: 3, maxHeight: 250, overflow: "auto", border: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                        <List sx={{ py: 0 }}>
                            {(activeFriend?.members || []).map((mId: string, idx: number) => {
                                const friendObj = friendsList.find((f: any) => (f.business?._id || f._id) === mId);
                                const name = mId === business?._id ? "You" : (friendObj ? getFriendName(friendObj) : "Member");
                                const isUserAdmin = mId === activeFriend?.createdBy;
                                const online = isOnline(mId);
                                
                                return (
                                    <ListItem key={mId + idx} sx={{ py: 1.2, borderBottom: idx < (activeFriend?.members?.length - 1) ? "1px solid" : "none", borderColor: "divider" }}>
                                        <ListItemAvatar>
                                            <Badge overlap="circular" variant="dot" sx={{ "& .MuiBadge-badge": { bgcolor: online ? "#10b981" : "#94a3b8" } }}>
                                                <Avatar sx={{ width: 36, height: 36, fontSize: "0.9rem", fontWeight: 700, background: isUserAdmin ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>{name.charAt(0)}</Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary={name} 
                                            secondary={isUserAdmin ? "Group Admin" : (online ? "Active Now" : "Offline")} 
                                            primaryTypographyProps={{ fontWeight: 700, fontSize: "0.88rem" }}
                                            secondaryTypographyProps={{ fontSize: "0.72rem", color: isUserAdmin ? "error.main" : "text.secondary" }}
                                        />
                                        {isAdmin && mId !== business?._id && (
                                            <ListItemSecondaryAction>
                                                <IconButton size="small" edge="end" onClick={() => handleRemoveMember(mId)} sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}>
                                                    <PersonRemoveIcon fontSize="small" />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        )}
                                    </ListItem>
                                )
                            })}
                        </List>
                    </Paper>
                </Box>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2, gap: 1 }}>
            <MuiButton 
                startIcon={<LogoutIcon />} 
                color="error" 
                onClick={handleLeaveGroup}
                sx={{ mr: "auto", fontWeight: 800, fontSize: "0.8rem", textTransform: "none" }}
            >
                Leave Group
            </MuiButton>
            {isAdmin && (
                <MuiButton variant="contained" onClick={handleUpdateGroupName} sx={{ fontWeight: 800, borderRadius: 2.5, px: 3, textTransform: "none" }}>
                    Save
                </MuiButton>
            )}
            <MuiButton onClick={() => setGroupSettingsOpen(false)} sx={{ fontWeight: 800, textTransform: "none" }}>Close</MuiButton>
        </DialogActions>
      </Dialog>

      {/* Product Preview Modal */}
      <Dialog 
        open={!!selectedProductPreview} 
        onClose={() => setSelectedProductPreview(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 5, overflow: "hidden" } }}
      >
        {selectedProductPreview && (
            <>
                <Box sx={{ position: "relative", height: 260 }}>
                    <img 
                        src={selectedProductPreview.productImage} 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                        alt="Product"
                    />
                    <IconButton 
                        onClick={() => setSelectedProductPreview(null)}
                        sx={{ position: "absolute", top: 12, right: 12, bgcolor: "rgba(0,0,0,0.5)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <Box sx={{ 
                        position: "absolute", bottom: 0, left: 0, right: 0, p: 2,
                        background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                        color: "#fff"
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>{selectedProductPreview.productName}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>₨{selectedProductPreview.productPrice?.toLocaleString()}</Typography>
                    </Box>
                </Box>
                <DialogContent sx={{ py: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", textTransform: "uppercase", display: "block", mb: 1 }}>
                        Product Details
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.primary", lineHeight: 1.6 }}>
                        {selectedProductPreview.productDescription || "No description available for this product."}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                        <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: "center", borderRadius: 3 }}>
                            <Typography variant="caption" sx={{ display: "block", opacity: 0.6, fontSize: "0.6rem" }}>CATEGORY</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{selectedProductPreview.productCategory}</Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: "center", borderRadius: 3 }}>
                            <Typography variant="caption" sx={{ display: "block", opacity: 0.6, fontSize: "0.6rem" }}>SENDER</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{selectedProductPreview.senderName}</Typography>
                        </Paper>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <MuiButton fullWidth variant="contained" onClick={() => setSelectedProductPreview(null)} sx={{ borderRadius: 3, py: 1.2, fontWeight: 900 }}>
                        Close Preview
                    </MuiButton>
                </DialogActions>
            </>
        )}
      </Dialog>
    </Box>
  );
}
