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

const QUICK_ACTIONS = [
  { label: "Business summary", msg: "business summary" },
  { label: "List products",    msg: "show all products" },
  { label: "Add product",      msg: "add a product" },
  { label: "List customers",   msg: "show all customers" },
  { label: "Add customer",     msg: "create a customer" },
  { label: "Attendance log",   msg: "show attendance" },
  { label: "Go to sales",      msg: "go to sales" },
  { label: "Go to reports",    msg: "go to reports" },
];

const IDLE_PROMPT = { ur: "کیا آپ کو کسی چیز کی ضرورت ہے؟", en: "Is there anything I can help you with?" };

// ── Voice helpers ──────────────────────────────────────────────────────────────

/** Strip markdown + action tokens so TTS speaks clean plain text */
function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^[-•·]\s+/gm, "")
    .replace(/NAV:\/\S*/g, "")
    .replace(/CREATE:\{[\s\S]*?\}/g, "")
    .replace(/LIST:\{[\s\S]*?\}/g, "")
    .replace(/GET:\{[\s\S]*?\}/g, "")
    .replace(/UPDATE:\{[\s\S]*?\}/g, "")
    .replace(/DELETE:\{[\s\S]*?\}/g, "")
    .replace(/STATS:\{[\s\S]*?\}/g, "")
    .replace(/ATTENDANCE:\{[\s\S]*?\}/g, "")
    .replace(/\n+/g, ". ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Pick the best available TTS voice for the given language */
function selectBestVoice(voices: SpeechSynthesisVoice[], lang: "ur" | "en"): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  if (lang === "ur") {
    const urPrefs = ["Huzaifa", "Maryam", "ur-PK", "ur-IN", "ur"];
    for (const p of urPrefs) {
      const v = voices.find(v => v.name.includes(p) || v.lang.startsWith(p));
      if (v) return v;
    }
    // fallback: Hindi or any English natural voice
    return (
      voices.find(v => v.lang.startsWith("hi")) ||
      voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) ||
      null
    );
  }

  // English priority: natural / neural voices first
  const enPrefs = [
    // Microsoft Neural (Edge / Windows 11)
    "Microsoft Aria",  "Microsoft Jenny", "Microsoft Guy",
    "Microsoft Emma",  "Microsoft Eric",  "Microsoft Brian",
    // Google
    "Google US English", "Google UK English Female", "Google UK English Male",
    // Apple
    "Samantha", "Alex", "Karen", "Moira",
    // Generic
    "en-US", "en-GB",
  ];
  for (const p of enPrefs) {
    const v = voices.find(v => v.name.includes(p) || v.lang === p || v.lang.startsWith(p));
    if (v) return v;
  }
  return voices.find(v => v.lang.startsWith("en")) || null;
}

// ── Formatted message renderer ─────────────────────────────────────────────────

function FormattedMessage({ text, color }: { text: string; color: string }) {
  return (
    <Box>
      {text.split("\n").map((line, i) => {
        const isBullet = /^[-•·]\s/.test(line);
        const parts = line.replace(/^[-•·]\s/, "").split(/\*\*(.+?)\*\*/g);
        return (
          <Box key={i} sx={{ display: "flex", gap: isBullet ? 0.7 : 0, mb: 0.15 }}>
            {isBullet && <Box component="span" sx={{ color, opacity: 0.5, fontSize: "0.75rem", mt: "2px", flexShrink: 0 }}>•</Box>}
            <Typography component="span" sx={{ fontSize: "0.855rem", lineHeight: 1.65, color, display: "block" }}>
              {parts.map((p, j) => j % 2 === 1 ? <Box component="span" key={j} sx={{ fontWeight: 700 }}>{p}</Box> : p)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ── Waveform bar animation ─────────────────────────────────────────────────────

function WaveformBars({ color, count = 5 }: { color: string; count?: number }) {
  return (
    <Stack direction="row" spacing={0.4} alignItems="center" sx={{ height: 18 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} sx={{
          width: 3, borderRadius: 2, background: color,
          animation: "wavebar 1s ease-in-out infinite",
          animationDelay: `${i * 0.12}s`,
          "@keyframes wavebar": {
            "0%,100%": { height: 4 },
            "50%":      { height: 16 },
          },
        }} />
      ))}
    </Stack>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

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
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ── Component ──────────────────────────────────────────────────────────────────

export default function AssistantPanel({ open, onClose, voiceMode, setVoiceMode }: AssistantPanelProps) {
  const { mode } = useThemeMode();
  const navigate = useNavigate();

  const WELCOME: Message = {
    id: "welcome", role: "assistant", timestamp: new Date(),
    content: "Hello! I'm your **Invonta Assistant**.\n\nAsk me anything:\n- \"business summary\"\n- \"add a product\"\n- \"go to sales\"\n- \"check in Sara\"",
  };

  const [messages,    setMessages]    = useState<Message[]>([WELCOME]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [language,    setLanguage]    = useState<"ur" | "en">("ur");
  const [ttsEnabled,  setTtsEnabled]  = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [isOffline,   setIsOffline]   = useState(false);
  const [voices,      setVoices]      = useState<SpeechSynthesisVoice[]>([]);

  const [sttSupported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const messagesEndRef   = useRef<HTMLDivElement>(null);
  const recognitionRef   = useRef<any>(null);
  const bargeInRef       = useRef<any>(null);
  const historyRef       = useRef<Array<{ role: string; content: string }>>([]);
  const voiceModeRef     = useRef(voiceMode);
  const openRef          = useRef(open);
  const loadingRef       = useRef(false);
  const isRecordingRef   = useRef(false);
  const isSpeakingRef    = useRef(false);
  const languageRef      = useRef(language);
  const ttsEnabledRef    = useRef(ttsEnabled);
  const voicesRef        = useRef(voices);
  const loopActiveRef    = useRef(false);

  useEffect(() => { voiceModeRef.current  = voiceMode;  }, [voiceMode]);
  useEffect(() => { openRef.current       = open;       }, [open]);
  useEffect(() => { languageRef.current   = language;   }, [language]);
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { voicesRef.current     = voices;     }, [voices]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    historyRef.current = messages
      .filter(m => m.id !== "welcome")
      .map(m => ({ role: m.role, content: m.content }));
  }, [messages]);

  // ── Load voices ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis?.getVoices() || [];
      if (v.length) setVoices(v);
    };
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, []);

  // ── Stop barge-in recognition ─────────────────────────────────────────────
  const stopBargeIn = useCallback(() => {
    try { bargeInRef.current?.abort(); } catch { /* noop */ }
    bargeInRef.current = null;
  }, []);

  // ── Kokoro TTS (free, runs in-browser via ONNX) ───────────────────────────
  const kokoroRef        = useRef<any>(null);
  const kokoroLoadingRef = useRef(false);
  const [kokoroStatus, setKokoroStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");

  const loadKokoro = useCallback(async () => {
    if (kokoroRef.current || kokoroLoadingRef.current) return;
    kokoroLoadingRef.current = true;
    setKokoroStatus("loading");
    try {
      const { KokoroTTS } = await import("kokoro-js");
      kokoroRef.current = await KokoroTTS.from_pretrained(
        "onnx-community/Kokoro-82M-v1.0_fp16",
        { dtype: "fp16" },
      );
      setKokoroStatus("ready");
    } catch {
      setKokoroStatus("failed");
    } finally {
      kokoroLoadingRef.current = false;
    }
  }, []);

  // Warm up Kokoro as soon as TTS is enabled or voice mode turns on
  useEffect(() => {
    if (ttsEnabled || voiceMode) loadKokoro();
  }, [ttsEnabled, voiceMode, loadKokoro]);

  // ── Shared barge-in starter ───────────────────────────────────────────────
  const startBargeIn = useCallback((
    lang: string,
    onBarge: (transcript: string) => void,
  ) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !sttSupported) return;
    try {
      const bi = new SR();
      bargeInRef.current = bi;
      bi.lang            = lang;
      bi.continuous      = true;
      bi.interimResults  = true;
      bi.maxAlternatives = 1;
      let triggered = false;
      bi.onresult = (e: any) => {
        if (triggered) return;
        const interim = Array.from(e.results as any[])
          .map((r: any) => r[0].transcript).join(" ").trim();
        if (interim.length > 3) { triggered = true; onBarge(interim); }
      };
      bi.onerror = () => {};
      bi.start();
    } catch { /* barge-in unavailable */ }
  }, [sttSupported]);

  // ── Play a Float32Array via Web Audio API with barge-in ───────────────────
  const playAudioBuffer = useCallback((
    samples: Float32Array,
    sampleRate: number,
    lang: string,
  ): Promise<{ bargedIn: boolean; transcript: string }> => {
    return new Promise((resolve) => {
      let audioCtx: AudioContext | null = null;
      let source: AudioBufferSourceNode | null = null;
      let settled = false;

      const done = (bargedIn: boolean, transcript = "") => {
        if (settled) return;
        settled = true;
        stopBargeIn();
        try { source?.stop(); } catch { /* noop */ }
        try { audioCtx?.close(); } catch { /* noop */ }
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        resolve({ bargedIn, transcript });
      };

      try {
        audioCtx = new AudioContext();
        const buf = audioCtx.createBuffer(1, samples.length, sampleRate);
        buf.getChannelData(0).set(samples);
        source = audioCtx.createBufferSource();
        source.buffer = buf;
        source.connect(audioCtx.destination);
        source.onended = () => done(false);

        isSpeakingRef.current = true;
        setIsSpeaking(true);
        source.start();

        startBargeIn(lang, (transcript) => done(true, transcript));
      } catch {
        done(false);
      }
    });
  }, [stopBargeIn, startBargeIn]);

  // ── Kokoro speak ──────────────────────────────────────────────────────────
  const speakWithKokoro = useCallback(async (
    text: string,
  ): Promise<{ bargedIn: boolean; transcript: string } | null> => {
    if (!kokoroRef.current) return null;
    // Kokoro only handles English well; for Urdu fall through to browser TTS
    if (languageRef.current === "ur") return null;

    const cleaned = cleanForSpeech(text);
    if (!cleaned) return null;

    isSpeakingRef.current = true;
    setIsSpeaking(true);

    try {
      const result = await kokoroRef.current.generate(cleaned, { voice: "af_heart" });
      // result.audio: Float32Array, result.sampling_rate: 24000
      const lang = "en-US";
      return await playAudioBuffer(result.audio, result.sampling_rate, lang);
    } catch {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      return null;
    }
  }, [playAudioBuffer]);

  // ── Browser TTS fallback (Urdu + when Kokoro isn't ready) ────────────────
  const speakWithBrowserTts = useCallback((
    text: string,
  ): Promise<{ bargedIn: boolean; transcript: string }> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve({ bargedIn: false, transcript: "" });

      window.speechSynthesis.cancel();
      stopBargeIn();

      const utt  = new SpeechSynthesisUtterance(cleanForSpeech(text));
      const best = selectBestVoice(voicesRef.current, languageRef.current);
      if (best) utt.voice = best;
      utt.lang   = languageRef.current === "ur" ? "ur-PK" : "en-US";
      utt.rate   = languageRef.current === "ur" ? 0.88 : 0.94;
      utt.pitch  = 1.05;
      utt.volume = 1.0;

      let settled = false;
      const done = (bargedIn: boolean, transcript = "") => {
        if (settled) return;
        settled = true;
        stopBargeIn();
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        resolve({ bargedIn, transcript });
      };

      const lang = languageRef.current === "ur" ? "ur-PK" : "en-US";
      utt.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
        startBargeIn(lang, (transcript) => { window.speechSynthesis.cancel(); done(true, transcript); });
      };
      utt.onend   = () => done(false);
      utt.onerror = () => done(false);
      window.speechSynthesis.speak(utt);

      const keepAlive = setInterval(() => {
        if (settled) { clearInterval(keepAlive); return; }
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      }, 10000);
    });
  }, [stopBargeIn, startBargeIn]);

  // ── TTS dispatcher: Kokoro first, browser fallback ───────────────────────
  const speakAsync = useCallback(async (text: string): Promise<{ bargedIn: boolean; transcript: string }> => {
    const kokoroResult = await speakWithKokoro(text);
    if (kokoroResult !== null) return kokoroResult;
    return speakWithBrowserTts(text);
  }, [speakWithKokoro, speakWithBrowserTts]);

  // ── STT: listen once ──────────────────────────────────────────────────────
  const listenOnce = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return resolve(null);

      try { recognitionRef.current?.stop(); } catch { /* noop */ }

      const r = new SR();
      recognitionRef.current = r;
      r.lang            = languageRef.current === "ur" ? "ur-PK" : "en-US";
      r.interimResults  = false;
      r.continuous      = false;
      r.maxAlternatives = 1;

      let settled = false;
      const done = (val: string | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(noSpeechTimer);
        isRecordingRef.current = false;
        setIsRecording(false);
        resolve(val);
      };

      // Safety timeout — Chrome sometimes fires no events at all (permission prompt, device busy)
      const noSpeechTimer = setTimeout(() => done(null), 8000);

      r.onresult = (e: any) => {
        const t = e.results[0]?.[0]?.transcript?.trim() || null;
        done(t);
      };
      r.onerror  = () => done(null);
      r.onend    = () => done(null);

      try {
        r.start();
        isRecordingRef.current = true;
        setIsRecording(true);
      } catch { done(null); }
    });
  }, []);

  const stopRecording = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    isRecordingRef.current = false;
    setIsRecording(false);
  }, []);

  // ── Send a message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string): Promise<string> => {
    if (!text.trim()) return "";
    setMessages(p => [...p, { id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date() }]);
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
      reply   = result?.reply  || "I could not process that.";
      offline = !!result?.offline;
      const action = result?.action;

      if (action?.type === "navigate" && action.route) {
        navigate(action.route);
        onClose();
      } else if (!action && reply.toLowerCase().includes("taking you to")) {
        const lower = reply.toLowerCase();
        const routeMap: [string, string][] = [
          ["products", "/products"], ["sales", "/sales"],
          ["inventory", "/inventory"], ["purchasing", "/purchasing"],
          ["dashboard", "/"], ["customer", "/partners"], ["vendor", "/partners"],
        ];
        const found = routeMap.find(([kw]) => lower.includes(kw));
        if (found) { navigate(found[1]); onClose(); }
      }
    } catch {
      reply   = "Connection failed.";
      offline = true;
    }

    setIsOffline(offline);
    setMessages(p => [...p, { id: `a-${Date.now()}`, role: "assistant", content: reply, timestamp: new Date(), offline }]);
    loadingRef.current = false;
    setLoading(false);
    return reply;
  }, [navigate, onClose]);

  // Keep latest refs so the async loop always sees current versions
  const sendMessageRef  = useRef(sendMessage);
  const listenOnceRef   = useRef(listenOnce);
  const speakAsyncRef   = useRef(speakAsync);
  useEffect(() => { sendMessageRef.current  = sendMessage;  }, [sendMessage]);
  useEffect(() => { listenOnceRef.current   = listenOnce;   }, [listenOnce]);
  useEffect(() => { speakAsyncRef.current   = speakAsync;   }, [speakAsync]);

  // ── Voice loop (runs whether panel is open or closed) ────────────────────
  const runVoiceLoop = useCallback(async () => {
    if (loopActiveRef.current) return;
    loopActiveRef.current = true;

    const SESSION_TIMEOUT_MS = 30000;
    let lastActivityMs = Date.now();
    let shouldPrompt   = false;

    while (voiceModeRef.current) {
      if (shouldPrompt && ttsEnabledRef.current && !openRef.current) {
        await speakAsyncRef.current(IDLE_PROMPT[languageRef.current]);
        shouldPrompt = false;
      }

      if (!voiceModeRef.current) break;

      const transcript = await listenOnceRef.current();
      if (!voiceModeRef.current) break;

      if (transcript) {
        lastActivityMs = Date.now();
        const reply = await sendMessageRef.current(transcript);

        if (!voiceModeRef.current) break;

        if (ttsEnabledRef.current && reply) {
          const { bargedIn, transcript: bargeText } = await speakAsyncRef.current(reply);
          if (bargedIn && bargeText) {
            lastActivityMs = Date.now();
            const nextReply = await sendMessageRef.current(bargeText);
            if (ttsEnabledRef.current && nextReply) {
              await speakAsyncRef.current(nextReply);
            }
          }
        }

        shouldPrompt = false;
        await sleep(400);
      } else {
        const elapsed = Date.now() - lastActivityMs;
        if (elapsed >= SESSION_TIMEOUT_MS) { setVoiceMode(false); break; }
        if (elapsed > 12000 && !openRef.current) shouldPrompt = true;
        await sleep(800);
      }
    }

    loopActiveRef.current = false;
  }, [setVoiceMode]);

  // Start / stop voice loop — runs regardless of panel open state
  useEffect(() => {
    if (voiceMode) {
      runVoiceLoop();
    } else {
      stopRecording();
      stopBargeIn();
      window.speechSynthesis?.cancel();
    }
  }, [voiceMode, runVoiceLoop, stopRecording, stopBargeIn]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClose = () => {
    stopRecording();
    stopBargeIn();
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
      stopBargeIn();
      window.speechSynthesis?.cancel();
    } else {
      setTtsEnabled(true);
    }
  };

  const handleManualMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (isSpeaking) {
        // barge in manually
        window.speechSynthesis.cancel();
        stopBargeIn();
      }
      listenOnce().then(async (t) => {
        if (t) {
          const reply = await sendMessage(t);
          if (ttsEnabledRef.current && reply) {
            const { bargedIn, transcript: bargeText } = await speakAsync(reply);
            if (bargedIn && bargeText) {
              const next = await sendMessage(bargeText);
              if (ttsEnabledRef.current && next) speakAsync(next);
            }
          }
        }
      });
    }
  };

  // ── Style constants ───────────────────────────────────────────────────────
  const isDark    = mode === "dark";
  const bg        = isDark ? "#0d1117" : "#f8fafc";
  const headerBg  = "#0c1220";
  const userBg    = "linear-gradient(135deg, #0ea5e9, #6366f1)";
  const aiBg      = isDark ? "#1e293b" : "#ffffff";
  const aiColor   = isDark ? "#e2e8f0" : "#1e293b";
  const aiBorder  = isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e2e8f0";

  const statusLabel = isSpeaking
    ? "Speaking..."
    : isRecording
      ? "Listening..."
      : kokoroStatus === "loading"
        ? "Loading voice model..."
        : voiceMode
          ? "Voice mode on"
          : isOffline
            ? "Offline mode"
            : kokoroStatus === "ready"
              ? "AI Mode · Kokoro voice"
              : "AI Mode";

  const statusColor = isSpeaking
    ? "#38bdf8"
    : isRecording
      ? "#e11d48"
      : voiceMode
        ? "#f87171"
        : "rgba(148,163,184,0.7)";

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
      {/* ── Header ── */}
      <Box sx={{ background: headerBg, flexShrink: 0 }}>
        <Box sx={{ px: 2, pt: 1.8, pb: 0.8, display: "flex", alignItems: "center", gap: 1.2 }}>
          {/* Avatar with context-aware animation */}
          <Box sx={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: isSpeaking
              ? "linear-gradient(135deg,#0ea5e9,#38bdf8)"
              : voiceMode
                ? "linear-gradient(135deg,#e11d48,#6366f1)"
                : "linear-gradient(135deg,#0ea5e9,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: (isRecording || isSpeaking) ? "hGlow 1.2s ease-in-out infinite" : "none",
            "@keyframes hGlow": {
              "0%,100%": { boxShadow: "0 0 0 0 rgba(14,165,233,0.55)" },
              "50%":     { boxShadow: "0 0 0 9px rgba(14,165,233,0)" },
            },
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
            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.3 }}>
              {isSpeaking && <WaveformBars color="#38bdf8" count={5} />}
              {isRecording && !isSpeaking && <WaveformBars color="#e11d48" count={5} />}
              <Typography sx={{ color: statusColor, fontSize: "0.63rem", fontWeight: 600 }}>
                {statusLabel}
              </Typography>
            </Stack>
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

        {/* Controls row */}
        <Box sx={{ px: 2, pb: 1.4, display: "flex", alignItems: "center", gap: 1 }}>
          {/* Language toggle */}
          <Box sx={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 2, p: "2px", gap: "2px" }}>
            {(["ur", "en"] as const).map((lang) => (
              <Box key={lang} onClick={() => setLanguage(lang)} sx={{
                px: 1.4, py: 0.5, borderRadius: 1.5, cursor: "pointer", userSelect: "none",
                background: language === lang ? "linear-gradient(135deg,#0ea5e9,#6366f1)" : "transparent",
                transition: "background 0.18s",
              }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, lineHeight: 1, color: language === lang ? "#fff" : "rgba(148,163,184,0.55)" }}>
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
          <Tooltip title={ttsEnabled ? "Mute voice" : "Unmute voice"}>
            <IconButton size="small" onClick={() => { setTtsEnabled(v => !v); window.speechSynthesis?.cancel(); stopBargeIn(); }} sx={{ color: ttsEnabled ? "#0ea5e9" : "#475569" }}>
              {ttsEnabled ? <VolumeUpRoundedIcon sx={{ fontSize: 17 }} /> : <VolumeOffRoundedIcon sx={{ fontSize: 17 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Progress bar */}
        <Box sx={{
          height: 2,
          background: loading
            ? "linear-gradient(90deg,#0ea5e9,#6366f1,#0ea5e9)"
            : isSpeaking
              ? "linear-gradient(90deg,#38bdf8,#0ea5e9,#38bdf8)"
              : voiceMode
                ? "rgba(248,113,113,0.25)"
                : "rgba(255,255,255,0.04)",
          backgroundSize: "200% 100%",
          animation: (loading || isSpeaking) ? "slide 1.2s linear infinite" : "none",
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
              {msg.id.startsWith("welcome") && idx === 0 && (
                <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.7 }}>
                  {QUICK_ACTIONS.map(qa => (
                    <Chip
                      key={qa.label} label={qa.label} size="small"
                      onClick={() => { if (!loading) sendMessage(qa.msg); }}
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
                {[0, 1, 2].map(i => (
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

      {/* ── Input bar ── */}
      <Box sx={{
        px: 2, py: 1.4, flexShrink: 0,
        borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
        background: isDark ? "#0d1117" : "#fff",
      }}>
        {(isRecording || isSpeaking) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.8 }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: "50%",
              background: isSpeaking ? "#38bdf8" : "#e11d48",
              animation: "blink 0.9s ease infinite",
              "@keyframes blink": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.2 } },
            }} />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: isSpeaking ? "#38bdf8" : "#e11d48" }}>
              {isSpeaking
                ? (language === "ur" ? "بول رہا ہوں — بولیں تو رک جاؤں گا" : "Speaking — talk to interrupt me")
                : (language === "ur" ? "سن رہا ہوں..." : "Listening...")}
            </Typography>
          </Box>
        )}

        <Stack direction="row" spacing={0.8} alignItems="flex-end">
          {sttSupported && (
            <Tooltip title={isSpeaking ? "Interrupt & speak" : isRecording ? "Stop" : "Speak"}>
              <IconButton
                onClick={handleManualMic}
                disabled={loading}
                size="small"
                sx={{
                  color: isSpeaking ? "#38bdf8" : isRecording ? "#e11d48" : "#6366f1",
                  background: isSpeaking
                    ? "rgba(56,189,248,0.12)"
                    : isRecording
                      ? "rgba(225,29,72,0.09)"
                      : "rgba(99,102,241,0.08)",
                  "&:hover": {
                    background: isSpeaking
                      ? "rgba(56,189,248,0.2)"
                      : isRecording
                        ? "rgba(225,29,72,0.16)"
                        : "rgba(99,102,241,0.14)",
                  },
                  mb: 0.3, width: 38, height: 38,
                  animation: isRecording ? "pulse 1.2s ease infinite" : "none",
                  "@keyframes pulse": { "0%,100%": { boxShadow: "0 0 0 0 rgba(225,29,72,0.4)" }, "50%": { boxShadow: "0 0 0 6px rgba(225,29,72,0)" } },
                }}
              >
                {isRecording ? <MicOffRoundedIcon fontSize="small" /> : <MicRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}

          <TextField
            fullWidth multiline maxRows={3} size="small"
            placeholder={language === "ur" ? "یہاں لکھیں..." : "Type a message..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) { sendMessage(input); setInput(""); }
              }
            }}
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
