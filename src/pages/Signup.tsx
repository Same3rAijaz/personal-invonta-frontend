import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Typography
} from "@mui/material";
import TextField from "../components/CustomTextField";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useToast } from "../hooks/useToast";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { PublicCategoryNode } from "../api/public";
import { useCities, useCountries, useStates } from "../hooks/useGeo";
import { DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_STATE } from "../constants/locationDefaults";
import { useThemeMode } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

const REQUEST_MARKET_VALUE = "__REQUEST_MARKET__";
const OTP_RESEND_COOLDOWN_SECONDS = 60;

// ─── Shared page chrome ───────────────────────────────────────────────────────

function PageLayout({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  return (
    <Box sx={{
      minHeight: "100vh",
      position: "relative",
      background: isDark
        ? "radial-gradient(circle at top left, rgba(14,165,233,0.15) 0%, #020617 40%, #0f172a 100%)"
        : "radial-gradient(circle at top left, rgba(14,165,233,0.08) 0%, #f1f5f9 40%, #e2e8f0 100%)",
      transition: "background 0.3s ease",
      overflowX: "hidden"
    }}>
      <Box sx={{ position: "absolute", top: 24, right: 24, zIndex: 10 }}>
        <ThemeToggle />
      </Box>
      <Grid container sx={{ minHeight: "100vh" }}>
        {/* Left branding panel */}
        <Grid item xs={12} md={6} sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, md: 8 },
          py: { xs: 6, md: 0 },
          height: "100vh",
          overflow: "hidden",
          background: isDark ? "rgba(15, 23, 42, 0.3)" : "rgba(255, 255, 255, 0.05)"
        }}>
          <Box sx={{ maxWidth: 460, textAlign: { xs: "center", md: "left" } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, justifyContent: { xs: "center", md: "flex-start" } }}>
              <img src="/Invonta.png" alt="Invonta" style={{ width: 52, height: 52 }} />
              <Typography variant="h3" sx={{ color: isDark ? "#fff" : "#0f172a", fontWeight: 800 }}>
                Invonta
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: isDark ? "#e2e8f0" : "#475569", mb: 3 }}>
              Launch your inventory system with approvals, access control, and invoices in minutes.
            </Typography>
            <Box sx={{ display: "grid", gap: 1.5, color: isDark ? "rgba(226,232,240,0.9)" : "rgba(15,23,42,0.8)" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Built for growing teams</Typography>
              <Typography variant="body2" sx={{ color: isDark ? "rgba(226,232,240,0.75)" : "#64748b" }}>
                Set up your business profile and activate only the modules you need today.
              </Typography>
              <Box sx={{ display: "grid", gap: 1, mt: 1, textAlign: { xs: "center", md: "left" } }}>
                <Typography variant="body2">- Approvals and role-based access</Typography>
                <Typography variant="body2">- Inventory control and stock tracking</Typography>
                <Typography variant="body2">- Reports you can export instantly</Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Right content panel */}
        <Grid item xs={12} md={6} sx={{
          background: isDark ? "#020617" : "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
          display: "flex",
          alignItems: "flex-start",
          px: { xs: 3, md: 8 },
          py: { xs: 4, md: 4 },
          height: "100vh",
          overflowY: "auto"
        }}>
          <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 2, width: "100%", maxWidth: 640, mx: "auto" }}>
            {children}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── OTP verification dialog (centered modal) ─────────────────────────────────

function OtpVerifyDialog({
  open,
  email,
  onVerified,
  onClose
}: {
  open: boolean;
  email: string;
  onVerified: (token: string) => Promise<void>;
  onClose: () => void;
}) {
  const { notify } = useToast();
  const [otp, setOtp] = React.useState("");
  const [otpError, setOtpError] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(OTP_RESEND_COOLDOWN_SECONDS);

  // Reset state each time the dialog opens
  React.useEffect(() => {
    if (open) {
      setOtp("");
      setOtpError("");
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    }
  }, [open]);

  // Countdown timer
  React.useEffect(() => {
    if (!open || cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, cooldown]);

  const handleVerify = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
      setOtpError("Enter the 6-digit code from your email");
      return;
    }
    setOtpError("");
    setVerifying(true);
    try {
      const { data: body } = await api.post("/public/signup/verify-otp", { email, otp: trimmedOtp });
      const token = body.data.verifiedToken;
      await onVerified(token);
    } catch (err: any) {
      setOtpError(err?.response?.data?.error?.message || "Invalid or expired code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/public/signup/send-otp", { email });
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setOtp("");
      setOtpError("");
      notify("A new code has been sent to " + email, "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to resend code. Please try again.", "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={verifying ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, p: 0.5 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        <EmailOutlinedIcon sx={{ color: "primary.main", fontSize: 26 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            Verify your email
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            A 6-digit code was sent to your email
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
          We sent a code to:
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700, color: "primary.main", mb: 2.5 }}>
          {email}
        </Typography>

        <TextField
          fullWidth
          label="Verification Code"
          value={otp}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter" && otp.length === 6) handleVerify(); }}
          error={!!otpError}
          helperText={otpError || "Check your inbox (and spam folder)"}
          inputProps={{ inputMode: "numeric", maxLength: 6, style: { letterSpacing: "0.4em", fontSize: "1.5rem", fontWeight: 700 } }}
          autoFocus
          disabled={verifying}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
        />

        <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
          <Button
            variant="text"
            size="small"
            onClick={handleResend}
            disabled={cooldown > 0 || resending || verifying}
            sx={{ textTransform: "none", p: 0.5 }}
          >
            {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={onClose}
            disabled={verifying}
            sx={{ textTransform: "none", color: "text.secondary", p: 0.5 }}
          >
            Cancel
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleVerify}
          disabled={verifying || otp.length < 6}
          sx={{ py: 1.3, fontWeight: 700, borderRadius: 1 }}
        >
          {verifying ? <CircularProgress size={22} color="inherit" /> : "Verify & Create Account"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Business setup form ──────────────────────────────────────────────────────

function BusinessSetupForm({
  onSubmitForm,
  sendingOtp
}: {
  onSubmitForm: (values: any) => Promise<void>;
  sendingOtp: boolean;
}) {
  const [showPassword, setShowPassword] = React.useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<any>({
    defaultValues: {
      marketId: REQUEST_MARKET_VALUE,
      country: DEFAULT_COUNTRY,
      state: DEFAULT_STATE,
      city: DEFAULT_CITY
    }
  });

  const { data: markets } = useQuery({
    queryKey: ["public-markets-signup"],
    queryFn: async () => (await api.get("/public/markets")).data.data
  });
  const { data: categories = [] } = useQuery<PublicCategoryNode[]>({
    queryKey: ["public-categories-signup"],
    queryFn: async () => (await api.get("/public/products/categories")).data.data || []
  });

  const marketId = watch("marketId");
  const businessCategoryId = watch("businessCategoryId");
  const country = watch("country", DEFAULT_COUNTRY);
  const state = watch("state", DEFAULT_STATE);
  const city = watch("city", DEFAULT_CITY);

  const { data: countryOptions = [] } = useCountries();
  const { data: stateOptions = [] } = useStates(country);
  const { data: cityOptions = [] } = useCities(country, state);

  // Seed location defaults
  React.useEffect(() => {
    setValue("country", DEFAULT_COUNTRY, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    setValue("state", DEFAULT_STATE, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    setValue("city", DEFAULT_CITY, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [setValue]);

  React.useEffect(() => {
    if (marketId && marketId !== REQUEST_MARKET_VALUE) setValue("marketName", "");
  }, [marketId, setValue]);

  React.useEffect(() => {
    if (!country && countryOptions.includes(DEFAULT_COUNTRY)) setValue("country", DEFAULT_COUNTRY);
  }, [country, countryOptions, setValue]);

  React.useEffect(() => {
    if (!state && stateOptions.includes(DEFAULT_STATE)) setValue("state", DEFAULT_STATE);
  }, [state, stateOptions, setValue]);

  React.useEffect(() => {
    if (!city && cityOptions.includes(DEFAULT_CITY)) setValue("city", DEFAULT_CITY);
  }, [city, cityOptions, setValue]);

  React.useEffect(() => {
    if (stateOptions.length > 0 && state && !stateOptions.some((item: string) => item === state)) {
      setValue("state", "");
      setValue("city", "");
    }
  }, [state, stateOptions, setValue]);

  React.useEffect(() => {
    if (cityOptions.length > 0 && city && !cityOptions.some((item: string) => item === city)) {
      setValue("city", "");
    }
  }, [city, cityOptions, setValue]);

  // Category tree helpers
  const categoriesById = React.useMemo(() => {
    const map = new Map<string, PublicCategoryNode>();
    (categories || []).forEach((item) => map.set(String(item._id), item));
    return map;
  }, [categories]);

  const selectedCategory = React.useMemo(() => {
    if (!businessCategoryId) return null;
    return categoriesById.get(String(businessCategoryId)) || null;
  }, [businessCategoryId, categoriesById]);

  const childrenByParent = React.useMemo(() => {
    const map = new Map<string, PublicCategoryNode[]>();
    (categories || []).forEach((item) => {
      const key = item.parentId ? String(item.parentId) : "root";
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    });
    map.forEach((list, key) => map.set(key, [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)))));
    return map;
  }, [categories]);

  const selectedPathIds = React.useMemo(() => {
    if (!selectedCategory) return [] as string[];
    return [...(selectedCategory.pathIds || []), String(selectedCategory._id)];
  }, [selectedCategory]);

  const categoryLevels = React.useMemo(() => {
    const levels: PublicCategoryNode[][] = [];
    let parentKey = "root";
    for (let level = 0; level < 10; level += 1) {
      const options = childrenByParent.get(parentKey) || [];
      if (options.length === 0) break;
      levels.push(options);
      const selectedId = selectedPathIds[level];
      if (!selectedId) break;
      parentKey = selectedId;
    }
    return levels;
  }, [childrenByParent, selectedPathIds]);

  const busy = isSubmitting || sendingOtp;

  return (
    <>
      <Typography variant="h4" gutterBottom sx={{ color: "text.primary" }}>
        Set up your shop
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Fill in your business details to get started.
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmitForm)}>
        <input type="hidden" {...register("businessCategoryId")} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Business Name *"
              {...register("businessName", { required: "Business Name is required" })}
              error={!!errors.businessName}
              helperText={errors.businessName?.message as string}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Contact Name *"
              {...register("contactName", { required: "Contact Name is required" })}
              error={!!errors.contactName}
              helperText={errors.contactName?.message as string}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Contact Phone *"
              {...register("contactPhone", { required: "Contact Phone is required" })}
              error={!!errors.contactPhone}
              helperText={errors.contactPhone?.message as string}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
            />
          </Grid>

          {/* Category breadcrumb */}
          <Grid item xs={12}>
            <Box sx={{
              minHeight: 40, px: 1.5, py: 1, borderRadius: 1, border: "1px solid",
              borderColor: "divider", backgroundColor: "background.default",
              display: "flex", alignItems: "center", gap: 1
            }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mr: 0.5 }}>
                Selected Category:
              </Typography>
              <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>
                {selectedCategory?.path || (selectedCategory?.pathNames || []).join(" > ") || "None selected"}
              </Typography>
            </Box>
          </Grid>

          {categoryLevels.map((options, level) => (
            <Grid item xs={12} md={4} key={`signup-category-level-${level}`}>
              <TextField
                select
                fullWidth
                label={level === 0 ? "Business Category" : `Sub Category ${level}`}
                value={selectedPathIds[level] || ""}
                onChange={(event) => {
                  const selectedId = String(event.target.value || "");
                  const nextPath = selectedPathIds.slice(0, level);
                  if (selectedId) nextPath[level] = selectedId;
                  const finalId = nextPath[nextPath.length - 1] || "";
                  setValue("businessCategoryId", finalId, { shouldDirty: true, shouldValidate: true });
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
              >
                <MenuItem value="">None</MenuItem>
                {options.map((item) => (
                  <MenuItem key={item._id} value={item._id}>{item.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          ))}

          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Market" {...register("marketId")} value={marketId || ""} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
              <MenuItem value={REQUEST_MARKET_VALUE}>Not listed / Request market</MenuItem>
              {(markets || []).map((m: any) => (
                <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Country" {...register("country")} value={country || ""} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
              <MenuItem value="">Select Country</MenuItem>
              {countryOptions.map((item: string) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="State" {...register("state")} disabled={!country} value={state || ""} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
              <MenuItem value="">Select State</MenuItem>
              {stateOptions.map((item: string) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="City" {...register("city")} disabled={!country || !state} value={city || ""} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}>
              <MenuItem value="">Select City</MenuItem>
              {cityOptions.map((item: string) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {marketId === REQUEST_MARKET_VALUE && (
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="Market Name (request new market)" {...register("marketName")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Address *"
              {...register("address", { required: "Address is required" })}
              error={!!errors.address}
              helperText={errors.address?.message as string}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Admin Name *"
              {...register("adminName", { required: "Admin Name is required" })}
              error={!!errors.adminName}
              helperText={errors.adminName?.message as string}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Admin Email *"
              type="email"
              {...register("adminEmail", {
                required: "Admin Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" }
              })}
              error={!!errors.adminEmail}
              helperText={errors.adminEmail?.message as string}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Admin Password *"
              type={showPassword ? "text" : "password"}
              {...register("adminPassword", {
                required: "Admin Password is required",
                minLength: { value: 6, message: "Minimum 6 characters" }
              })}
              error={!!errors.adminPassword}
              helperText={errors.adminPassword?.message as string}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={() => setShowPassword((prev) => !prev)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="Referral Code (optional)" {...register("referralCode")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }} />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={busy}
              sx={{ py: 1.4, fontWeight: 700, borderRadius: 1 }}
            >
              {busy ? <CircularProgress size={22} color="inherit" /> : "Create Account"}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 3, borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
        <Typography sx={{ color: "text.secondary" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#0ea5e9", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </Typography>
        <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Link to="/privacy" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>Terms of Service</Link>
          <Link to="/tutorial" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.85rem" }}>User Guide</Link>
        </Box>
      </Box>
    </>
  );
}

// ─── Root page component ──────────────────────────────────────────────────────

export default function Signup() {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const { notify } = useToast();
  const navigate = useNavigate();

  const [otpDialogOpen, setOtpDialogOpen] = React.useState(false);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [pendingFormValues, setPendingFormValues] = React.useState<any>(null);

  // Called when form is submitted — validate email → send OTP → open dialog
  const handleFormSubmit = async (values: any) => {
    setSendingOtp(true);
    try {
      await api.post("/public/signup/send-otp", { email: values.adminEmail });
      setPendingFormValues(values);
      setOtpDialogOpen(true);
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to send verification code. Please try again.", "error");
    } finally {
      setSendingOtp(false);
    }
  };

  // Called after OTP is verified — creates the account
  const handleOtpVerified = async (token: string) => {
    const values = pendingFormValues;
    const selectedMarketIdRaw = String(values.marketId || "").trim();
    const selectedMarketId = selectedMarketIdRaw === REQUEST_MARKET_VALUE ? "" : selectedMarketIdRaw;

    const payload: any = {
      ...values,
      adminEmail: values.adminEmail,
      emailVerifiedToken: token,
      marketId: selectedMarketId || undefined,
      marketName: selectedMarketId ? undefined : String(values.marketName || "").trim() || undefined
    };

    await api.post("/public/signup", payload);
    setOtpDialogOpen(false);
    notify("Account created successfully! Please log in.", "success");
    navigate("/login");
  };

  return (
    <PageLayout isDark={isDark}>
      <BusinessSetupForm onSubmitForm={handleFormSubmit} sendingOtp={sendingOtp} />
      <OtpVerifyDialog
        open={otpDialogOpen}
        email={pendingFormValues?.adminEmail || ""}
        onVerified={handleOtpVerified}
        onClose={() => setOtpDialogOpen(false)}
      />
    </PageLayout>
  );
}
