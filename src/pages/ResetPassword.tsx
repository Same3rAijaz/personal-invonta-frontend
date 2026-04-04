import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Container, Grid, Paper, Typography } from "@mui/material";
import TextField from "../components/CustomTextField";;
import { resetPassword } from "../api/auth";
import { useToast } from "../hooks/useToast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useThemeMode } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

const schema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(6)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      notify("Reset token missing.", "error");
      return;
    }
    try {
      await resetPassword(token, values.password);
      notify("Password reset successful. Please sign in.", "success");
      navigate("/login");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Reset failed", "error");
    }
  };

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      position: "relative",
      background: isDark 
        ? "radial-gradient(circle at top left, rgba(14,165,233,0.15) 0%, #020617 40%, #0f172a 100%)" 
        : "radial-gradient(circle at top left, rgba(14,165,233,0.08) 0%, #f1f5f9 40%, #e2e8f0 100%)",
      transition: "background 0.3s ease"
    }}>
      <Box sx={{ position: "absolute", top: 24, right: 24, zIndex: 10 }}>
        <ThemeToggle />
      </Box>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <img src="/Invonta.png" alt="Invonta" style={{ width: 48, height: 48 }} />
              <Typography variant="h3" sx={{ color: isDark ? "#fff" : "#0f172a", fontWeight: 800 }}>
                Invonta
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: isDark ? "#e2e8f0" : "#475569", mb: 3 }}>
              Set a new password to regain access.
            </Typography>
            <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              Back to{" "}
              <Link to="/login" style={{ color: "#0ea5e9", textDecoration: "none", fontWeight: 600 }}>
                sign in
              </Link>
            </Typography>
          </Grid>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 4, borderRadius: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ color: "text.primary" }}>Reset password</Typography>
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <TextField
                  fullWidth
                  type="password"
                  label="New password"
                  margin="normal"
                  {...register("password")}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm password"
                  margin="normal"
                  {...register("confirmPassword")}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                />
                <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ mt: 2, py: 1.2, fontWeight: 700 }}>
                  Reset password
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
