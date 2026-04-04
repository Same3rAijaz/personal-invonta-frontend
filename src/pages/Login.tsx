import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Grid, IconButton, InputAdornment, Paper, Typography } from "@mui/material";
import TextField from "../components/CustomTextField";;
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { Link, useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password);
      notify("Welcome back", "success");
      navigate("/");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Login failed", "error");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", background: "radial-gradient(circle at top left, rgba(14,165,233,0.18) 0%, #0b1220 40%, #0f172a 100%)" }}>
      <Grid container sx={{ minHeight: "100vh" }}>
        <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: { xs: 3, md: 8 }, py: { xs: 6, md: 0 } }}>
          <Box sx={{ maxWidth: 460, textAlign: { xs: "center", md: "left" } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, justifyContent: { xs: "center", md: "flex-start" } }}>
              <img src="/Invonta.png" alt="Invonta" style={{ width: 52, height: 52 }} />
              <Typography variant="h3" sx={{ color: "#fff", fontWeight: 800 }}>
                Invonta
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: "#e2e8f0", mb: 3 }}>
              Inventory, attendance, and sales in one modern workspace.
            </Typography>
            <Box sx={{ display: "grid", gap: 1.5, color: "rgba(226,232,240,0.9)", animation: "fadeInUp 700ms ease" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Work smarter, not harder</Typography>
              <Typography variant="body2" sx={{ color: "rgba(226,232,240,0.75)" }}>
                Track inventory, manage teams, and close sales with a single, unified dashboard.
              </Typography>
              <Box sx={{ display: "grid", gap: 1, mt: 1, textAlign: { xs: "center", md: "left" } }}>
                <Typography variant="body2">- Real-time stock visibility</Typography>
                <Typography variant="body2">- Purchase and sales automation</Typography>
                <Typography variant="body2">- Attendance and payroll-ready reports</Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
            display: "flex",
            alignItems: "center",
            px: { xs: 3, md: 8 },
            py: { xs: 6, md: 0 }
          }}
        >
          <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 2, boxShadow: "0 18px 40px rgba(15,23,42,0.12)", width: "100%", maxWidth: 520, mx: "auto", backgroundColor: "#ffffff" }}>
            <Typography variant="h4" gutterBottom>Sign in</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Welcome back. Enter your credentials to continue.
            </Typography>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Email"
                margin="normal"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                label="Password"
                margin="normal"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                {...register("password")}
                error={!!errors.password}
                helperText={errors.password?.message}
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
              <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ mt: 2, borderRadius: 1, py: 1.3 }}>
                Sign in
              </Button>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1 }}>
                Quick actions
              </Typography>
              <Typography sx={{ color: "#475569" }}>
                Need an account?{" "}
                <Link to="/signup" style={{ color: "#0ea5e9", textDecoration: "none" }}>
                  Sign up
                </Link>
              </Typography>
              <Typography sx={{ color: "#475569", mt: 1 }}>
                Trouble signing in?{" "}
                <Link to="/forgot-password" style={{ color: "#0ea5e9", textDecoration: "none" }}>
                  Reset password
                </Link>
              </Typography>
              <Typography sx={{ color: "#475569", mt: 1 }}>
                Looking for nearby products?{" "}
                <Link to="/marketplace" style={{ color: "#0ea5e9", textDecoration: "none" }}>
                  Open marketplace
                </Link>
              </Typography>
              <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Link to="/privacy" style={{ color: "#64748b", textDecoration: "none" }}>Privacy Policy</Link>
                <Link to="/terms" style={{ color: "#64748b", textDecoration: "none" }}>Terms of Service</Link>
                <Link to="/tutorial" style={{ color: "#64748b", textDecoration: "none" }}>User Guide</Link>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
