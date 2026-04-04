import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Container, Grid, Paper, Typography } from "@mui/material";
import TextField from "../components/CustomTextField";;
import { resetPassword } from "../api/auth";
import { useToast } from "../hooks/useToast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

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
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(14,165,233,0.18) 0%, #0b1220 40%, #0f172a 100%)" }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <img src="/Invonta.png" alt="Invonta" style={{ width: 48, height: 48 }} />
              <Typography variant="h3" sx={{ color: "#fff", fontWeight: 800 }}>
                Invonta
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: "#e2e8f0", mb: 3 }}>
              Set a new password to regain access.
            </Typography>
            <Typography sx={{ color: "#94a3b8" }}>
              Back to{" "}
              <Link to="/login" style={{ color: "#38bdf8", textDecoration: "none" }}>
                sign in
              </Link>
            </Typography>
          </Grid>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 4, borderRadius: 4, boxShadow: "0 30px 60px rgba(15,23,42,0.35)" }}>
              <Typography variant="h4" gutterBottom>Reset password</Typography>
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
