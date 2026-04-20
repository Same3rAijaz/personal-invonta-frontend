import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box, Drawer, Typography, IconButton, TextField, Stack,
  CircularProgress, Tooltip, Paper, Fade, Chip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useThemeMode } from "../../contexts/ThemeContext";

// Quick actions shown as chips
const QUICK_ACTIONS = [
  { label: "Business summary", msg: "business summary" },
  { label: "List products", msg: "show all products" },
  { label: "Add product", msg: "add a product" },
  { label: "List customers", msg: "show all customers" },
  { label: "Add customer", msg: "create a customer" },
  { label: "Attendance log", msg: "show attendance" },
  { label: "Go to sales", msg: "go to sales" },
  { label: "Go to reports", msg: "go to reports" },
];

// Renders a message with basic formatting: **bold**, bullet lines
function FormattedMessage({ text, color }: { text: string; color: string }) {
  const lines = text.split("\n");
  return (
    <Box>
      {lines.map((line, i) => {
        const isBullet = /^[-•·]\s/.test(line);
        const parts = line.replace(/^[-•·]\s/, "").split(/\*\*(.+?)\*\*/g);
        return (
          <Box key={i} sx={{ display: "flex", gap: isBullet ? 0.7 : 0, mb: lines.length > 1 ? 0.15 : 0 }}>
            {isBullet && <Box component="span" sx={{ color, opacity: 0.5, fontSize: "0.75rem", mt: "2px", flexShrink: 0 }}>•</Box>}
            <Typography component="span" sx={{ fontSize: "0.855rem", lineHeight: 1.65, color, display: "block" }}>
              {parts.map((part, j) =>
                j % 2 === 1
                  ? <Box component="span" key={j} sx={{ fontWeight: 700 }}>{part}</Box>
                  : part
              )}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  offline?: boolean;
}

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
  voiceMode: boolean;
  setVoiceMode: (v: boolean) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const IDLE_PROMPT = { ur: "کیا آپ کو کسی چیز کی ضرورت ہے؟", en: "Is there anything you need?" };

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function AssistantPanel({ open, onClose, voiceMode, setVoiceMode }: AssistantPanelProps) {
  const { mode } = useThemeMode();
  const navigate = useNavigate();

  const WELCOME: Message = {
    id: "welcome", role: "assistant",
    content: "Hello! I'm your **Invonta Assistant**.\n\nAsk me anything:\n- \"business summary\"\n- \"add a product\"\n- \"go to sales\"\n- \"check in Sara\"",
    timestamp: new Date(),
  };
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"ur" | "en">("ur");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [sttSupported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));

  // Refs — all mutable state the async loop needs without stale closures
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const historyRef = useRef<Array<{ role: string; content: string }>>([]);
  const voiceModeRef = useRef(voiceMode);
  const openRef = useRef(open);
  const loadingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const languageRef = useRef(language);
  const ttsEnabledRef = useRef(ttsEnabled);
  const loopActiveRef = useRef(false); // single loop guard

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    historyRef.current = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  // ── Promise-based TTS ───────────────────────────────────────────────────
  const speakAsync = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve();
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const lang = languageRef.current;
      const match = voices.find((v) => v.lang.startsWith(lang === "ur" ? "ur" : "en"));
      if (match) utt.voice = match;
      utt.lang = lang === "ur" ? "ur-PK" : "en-US";
      utt.rate = lang === "ur" ? 0.9 : 1.0;
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      window.speechSynthesis.speak(utt);
    });
  }, []);

  // ── Promise-based STT (single utterance) ────────────────────────────────
  const listenOnce = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return resolve(null);
      if (isRecordingRef.current) { recognitionRef.current?.stop(); }

      const r = new SR();
      recognitionRef.current = r;
      r.lang = languageRef.current === "ur" ? "ur-PK" : "en-US";
      r.interimResults = false;
      r.continuous = false;
      r.maxAlternatives = 1;

      let settled = false;
      const done = (val: string | null) => { if (!settled) { settled = true; resolve(val); } };

      r.onresult = (e: any) => done(e.results[0]?.[0]?.transcript?.trim() || null);
      r.onerror = () => done(null);
      r.onend = () => { isRecordingRef.current = false; setIsRecording(false); done(null); };

      try {
        r.start();
        isRecordingRef.current = true;
        setIsRecording(true);
      } catch {
        done(null);
      }
    });
  }, []);

  const stopRecording = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    isRecordingRef.current = false;
    setIsRecording(false);
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string): Promise<string> => {
    if (!text.trim()) return "";
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date() };
    setMessages((p) => [...p, userMsg]);
    loadingRef.current = true;
    setLoading(true);

    let reply = "";
    let offline = false;
    try {
      const { data } = await api.post("/assistant/chat", {
        message: text,
        history: historyRef.current.slice(-10),
        language: languageRef.current,
      }, { skipLoader: true } as any);

      const result = data?.data || data;
      console.log("[Assistant] API Result:", result);
      reply = result?.reply || "I could not process that.";
      offline = !!result?.offline;
      const action = result?.action;

      if (action?.type === "navigate" && action.route) {
        console.log("[Assistant] Navigating to:", action.route);
        navigate(action.route);
        onClose(); 
      } else if (!action && reply.toLowerCase().includes("taking you to")) {
        // Backup: Infer route from reply if AI forgets structured action
        const lower = reply.toLowerCase();
        let target = "";
        if (lower.includes("products")) target = "/products";
        else if (lower.includes("sales")) target = "/sales";
        else if (lower.includes("inventory")) target = "/inventory";
        else if (lower.includes("purchasing")) target = "/purchasing";
        else if (lower.includes("dashboard")) target = "/";
        else if (lower.includes("customer")) target = "/partners";
        else if (lower.includes("vendor")) target = "/partners";
        
        if (target) {
          console.log("[Assistant] Inferred navigation to:", target);
          navigate(target);
          onClose();
        }
      }
    } catch {
      reply = "Connection failed.";
      offline = true;
    }

    setIsOffline(offline);
    const aMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: reply, timestamp: new Date(), offline };
    setMessages((p) => [...p, aMsg]);
    loadingRef.current = false;
    setLoading(false);
    return reply;
  }, [navigate, onClose]);

  const sendMessageRef = useRef(sendMessage);
  const listenOnceRef = useRef(listenOnce);
  const speakAsyncRef = useRef(speakAsync);

  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);
  useEffect(() => { listenOnceRef.current = listenOnce; }, [listenOnce]);
  useEffect(() => { speakAsyncRef.current = speakAsync; }, [speakAsync]);

  // ── Voice loop (async state machine) ────────────────────────────────────
  const runVoiceLoop = useCallback(async () => {
    if (loopActiveRef.current) return; // only one loop at a time
    loopActiveRef.current = true;

    const SESSION_TIMEOUT_MS = 30000;
    let lastActivityMs = Date.now();
    let shouldPrompt = false; 

    while (voiceModeRef.current && !openRef.current) {
      if (shouldPrompt && ttsEnabledRef.current) {
        await speakAsyncRef.current(IDLE_PROMPT[languageRef.current]);
        shouldPrompt = false; 
      }
      
      if (!voiceModeRef.current || openRef.current) break;

      const transcript = await listenOnceRef.current();
      if (!voiceModeRef.current || openRef.current) break;

      if (transcript) {
        lastActivityMs = Date.now(); 
        const reply = await sendMessageRef.current(transcript);
        
        if (!voiceModeRef.current || openRef.current) break;
        
        if (ttsEnabledRef.current && reply) {
          await speakAsyncRef.current(reply);
        }
        
        shouldPrompt = false; 
        await sleep(1000); 
      } else {
        const elapsed = Date.now() - lastActivityMs;
        if (elapsed >= SESSION_TIMEOUT_MS) {
          setVoiceMode(false);
          break;
        }

        if (elapsed > 12000) {
          shouldPrompt = true;
        }

        await sleep(1500); 
      }
    }

    loopActiveRef.current = false;
  }, [setVoiceMode]);

  // Start loop when voice mode on and panel closed
  useEffect(() => {
    if (voiceMode && !open) {
      runVoiceLoop();
    } else if (!voiceMode || open) {
      // Stop any ongoing recognition when panel opens or voice mode off
      stopRecording();
      window.speechSynthesis?.cancel();
    }
  }, [voiceMode, open, runVoiceLoop, stopRecording]);

  // Auto-listen when panel opens in voice mode
  useEffect(() => {
    if (open && voiceMode && !loadingRef.current) {
      const t = setTimeout(async () => {
        if (!openRef.current || !voiceModeRef.current) return;
        const transcript = await listenOnce();
        if (transcript && voiceModeRef.current) {
          const reply = await sendMessage(transcript);
          if (ttsEnabledRef.current && reply) speakAsync(reply);
        }
      }, 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, voiceMode]);

  const handleClose = () => {
    stopRecording();
    if (!voiceMode) window.speechSynthesis?.cancel();
    onClose();
  };

  const handleClearChat = () => {
    setMessages([{ ...WELCOME, id: "welcome-" + Date.now(), timestamp: new Date() }]);
    historyRef.current = [];
  };

  const toggleVoiceMode = () => {
    const next = !voiceMode;
    setVoiceMode(next);
    if (!next) {
      stopRecording();
      window.speechSynthesis?.cancel();
    } else {
      setTtsEnabled(true);
    }
  };

  const handleManualMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      listenOnce().then(async (t) => {
        if (t) {
          const reply = await sendMessage(t);
          if (ttsEnabledRef.current && reply) speakAsync(reply);
        }
      });
    }
  };

  const isDark = mode === "dark";
  const bg = isDark ? "#0d1117" : "#f8fafc";
  const headerBg = "#0c1220";
  const userBg = "linear-gradient(135deg, #0ea5e9, #6366f1)";
  const aiBg = isDark ? "#1e293b" : "#ffffff";
  const aiColor = isDark ? "#e2e8f0" : "#1e293b";
  const aiBorder = isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e2e8f0";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: "100vw", sm: 380 },
          top: { xs: 0, md: 74 },
          height: { xs: "100%", md: "calc(100% - 74px)" },
          background: bg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
      ModalProps={{ keepMounted: true }}
    >
      {/* ── Header Row 1 ── */}
      <Box sx={{ background: headerBg, flexShrink: 0 }}>
        <Box sx={{ px: 2, pt: 1.8, pb: 0.8, display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box sx={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: voiceMode ? "linear-gradient(135deg,#e11d48,#6366f1)" : "linear-gradient(135deg,#0ea5e9,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: voiceMode ? "hGlow 1.6s ease-in-out infinite" : "none",
            "@keyframes hGlow": { "0%,100%": { boxShadow: "0 0 0 0 rgba(225,29,72,0.6)" }, "50%": { boxShadow: "0 0 0 8px rgba(225,29,72,0)" } },
          }}>
            <SmartToyRoundedIcon sx={{ fontSize: 16, color: "#fff" }} />
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.8}>
              <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", lineHeight: 1 }}>
                Invonta Assistant
              </Typography>
              {isOffline && (
                <Chip
                  icon={<WifiOffRoundedIcon sx={{ fontSize: "10px !important" }} />}
                  label="Offline"
                  size="small"
                  sx={{ height: 16, fontSize: "0.58rem", bgcolor: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)", "& .MuiChip-label": { px: 0.6 } }}
                />
              )}
            </Stack>
            <Typography sx={{ color: voiceMode ? "#f87171" : "rgba(148,163,184,0.7)", fontSize: "0.63rem", mt: 0.2 }}>
              {voiceMode
                ? (isRecording ? "🔴 Listening..." : "🎙 Voice mode on")
                : (isOffline ? "⚡ Offline mode" : "⚡ AI Mode")}
            </Typography>
          </Box>

          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Clear chat">
              <IconButton size="small" onClick={handleClearChat} sx={{ color: "#64748b" }}>
                <DeleteSweepRoundedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={handleClose} sx={{ color: "#64748b" }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Box>

        {/* ── Header Row 2: controls ── */}
        <Box sx={{ px: 2, pb: 1.4, display: "flex", alignItems: "center", gap: 1 }}>
          {/* Language toggle */}
          <Box sx={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 2, p: "2px", gap: "2px" }}>
            {(["ur", "en"] as const).map((lang) => (
              <Box key={lang} onClick={() => setLanguage(lang)} sx={{
                px: 1.4, py: 0.5, borderRadius: 1.5, cursor: "pointer", userSelect: "none",
                background: language === lang ? "linear-gradient(135deg,#0ea5e9,#6366f1)" : "transparent",
                transition: "background 0.18s",
              }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: language === lang ? "#fff" : "rgba(148,163,184,0.55)", lineHeight: 1 }}>
                  {lang === "ur" ? "اردو" : "EN"}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Voice mode toggle */}
          {sttSupported && (
            <Tooltip title={voiceMode ? "Disable background voice mode" : "Enable background voice mode"}>
              <IconButton size="small" onClick={toggleVoiceMode} sx={{
                color: voiceMode ? "#f87171" : "#475569",
                background: voiceMode ? "rgba(248,113,113,0.12)" : "transparent",
              }}>
                <GraphicEqRoundedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          )}

          {/* TTS toggle */}
          <Tooltip title={ttsEnabled ? "Mute" : "Unmute"}>
            <IconButton size="small" onClick={() => { setTtsEnabled(v => !v); window.speechSynthesis?.cancel(); }} sx={{ color: ttsEnabled ? "#0ea5e9" : "#475569" }}>
              {ttsEnabled ? <VolumeUpRoundedIcon sx={{ fontSize: 17 }} /> : <VolumeOffRoundedIcon sx={{ fontSize: 17 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Loading bar */}
        <Box sx={{
          height: 2,
          background: loading
            ? "linear-gradient(90deg,#0ea5e9,#6366f1,#0ea5e9)"
            : voiceMode ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.04)",
          backgroundSize: "200% 100%",
          animation: loading ? "slide 1.2s linear infinite" : "none",
          "@keyframes slide": { "0%": { backgroundPosition: "100% 0" }, "100%": { backgroundPosition: "-100% 0" } },
        }} />
      </Box>

      {/* ── Messages ── */}
      <Box sx={{
        flexGrow: 1, overflowY: "auto", px: 2, py: 1.5,
        display: "flex", flexDirection: "column", gap: 1,
        "&::-webkit-scrollbar": { width: 3 },
        "&::-webkit-scrollbar-thumb": { background: "rgba(99,102,241,0.25)", borderRadius: 2 },
      }}>
        {messages.map((msg, idx) => (
          <Fade in key={msg.id} timeout={250}>
            <Box>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <Paper elevation={0} sx={{
                  px: 1.8, py: 1.1, maxWidth: "86%",
                  borderRadius: msg.role === "user" ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
                  background: msg.role === "user" ? userBg : aiBg,
                  border: msg.role === "assistant" ? aiBorder : "none",
                  boxShadow: msg.role === "user" ? "0 2px 10px rgba(99,102,241,0.22)" : (isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)"),
                }}>
                  <FormattedMessage text={msg.content} color={msg.role === "user" ? "#fff" : aiColor} />
                  <Typography sx={{ fontSize: "0.58rem", opacity: 0.4, mt: 0.4, textAlign: msg.role === "user" ? "right" : "left" }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {msg.offline ? " · offline" : ""}
                  </Typography>
                </Paper>
              </Box>
              {/* Quick action chips after welcome message */}
              {msg.id.startsWith("welcome") && idx === 0 && (
                <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.7 }}>
                  {QUICK_ACTIONS.map((qa) => (
                    <Chip
                      key={qa.label}
                      label={qa.label}
                      size="small"
                      onClick={() => { if (!loading) { sendMessage(qa.msg); } }}
                      disabled={loading}
                      sx={{
                        fontSize: "0.72rem", cursor: "pointer", height: 24,
                        bgcolor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                        color: isDark ? "#a5b4fc" : "#4f46e5",
                        border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.2)"}`,
                        "&:hover": { bgcolor: isDark ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.15)" },
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Fade>
        ))}

        {loading && (
          <Box sx={{ display: "flex" }}>
            <Paper elevation={0} sx={{ px: 1.8, py: 1.2, borderRadius: "16px 16px 16px 3px", background: aiBg, border: aiBorder }}>
              <Stack direction="row" spacing={0.4} alignItems="center">
                {[0, 1, 2].map((i) => (
                  <Box key={i} sx={{
                    width: 6, height: 6, borderRadius: "50%", background: "#6366f1",
                    animation: "dot 1.2s ease-in-out infinite", animationDelay: `${i * 0.18}s`,
                    "@keyframes dot": { "0%,80%,100%": { opacity: 0.25, transform: "scale(0.75)" }, "40%": { opacity: 1, transform: "scale(1)" } },
                  }} />
                ))}
              </Stack>
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* ── Input ── */}
      <Box sx={{ px: 2, py: 1.4, flexShrink: 0, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0", background: isDark ? "#0d1117" : "#fff" }}>
        {isRecording && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.8 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "#e11d48", animation: "blink 0.9s ease infinite", "@keyframes blink": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.2 } } }} />
            <Typography sx={{ color: "#e11d48", fontSize: "0.72rem", fontWeight: 600 }}>
              {language === "ur" ? "سن رہا ہوں..." : "Listening..."}
            </Typography>
          </Box>
        )}

        <Stack direction="row" spacing={0.8} alignItems="flex-end">
          {sttSupported && (
            <IconButton onClick={handleManualMic} disabled={loading} size="small" sx={{
              color: isRecording ? "#e11d48" : "#6366f1",
              background: isRecording ? "rgba(225,29,72,0.09)" : "rgba(99,102,241,0.08)",
              "&:hover": { background: isRecording ? "rgba(225,29,72,0.16)" : "rgba(99,102,241,0.14)" },
              mb: 0.3, width: 38, height: 38,
            }}>
              {isRecording ? <MicOffRoundedIcon fontSize="small" /> : <MicRoundedIcon fontSize="small" />}
            </IconButton>
          )}

          <TextField
            fullWidth multiline maxRows={3} size="small"
            placeholder={language === "ur" ? "یہاں لکھیں..." : "Type a message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (input.trim()) { sendMessage(input); setInput(""); } } }}
            disabled={loading || isRecording}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5, fontSize: "0.855rem",
                background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.09)" : "#e2e8f0" },
                "&:hover fieldset": { borderColor: "#818cf8" },
                "&.Mui-focused fieldset": { borderColor: "#6366f1", borderWidth: 1.5 },
              },
              "& input, & textarea": { color: isDark ? "#e2e8f0" : "#1e293b", direction: language === "ur" ? "rtl" : "ltr" },
            }}
          />

          <IconButton
            onClick={() => { if (input.trim()) { sendMessage(input); setInput(""); } }}
            disabled={loading || !input.trim() || isRecording}
            size="small"
            sx={{
              background: "linear-gradient(135deg,#0ea5e9,#6366f1)", color: "#fff",
              width: 38, height: 38, mb: 0.3,
              "&:hover": { background: "linear-gradient(135deg,#0284c7,#4f46e5)" },
              "&.Mui-disabled": { background: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0", color: "#94a3b8" },
            }}
          >
            {loading ? <CircularProgress size={15} sx={{ color: "#fff" }} /> : <SendRoundedIcon sx={{ fontSize: 17 }} />}
          </IconButton>
        </Stack>
      </Box>
    </Drawer>
  );
}
