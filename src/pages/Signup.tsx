import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Container, Grid, Paper, TextField, Typography } from "@mui/material";
import { signup as signupApi } from "../api/auth";
import { useToast } from "../hooks/useToast";
import { Link, useNavigate } from "react-router-dom";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  referralCode: z.string().trim().optional()
});

type FormValues = z.infer<typeof schema>;

export default function Signup() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await signupApi(values.email, values.password, values.referralCode || undefined);
      notify("Account created. Please sign in.", "success");
      navigate("/login");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Signup failed", "error");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, #fef3c7 0%, #0f172a 40%, #0b1323 100%)" }}>
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
              Create your account and start managing inventory in minutes.
            </Typography>
            <Typography sx={{ color: "#94a3b8" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#f97316", textDecoration: "none" }}>
                Sign in
              </Link>
            </Typography>
            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Link to="/privacy" style={{ color: "#94a3b8", textDecoration: "none" }}>Privacy</Link>
              <Link to="/terms" style={{ color: "#94a3b8", textDecoration: "none" }}>Terms</Link>
              <Link to="/tutorial" style={{ color: "#94a3b8", textDecoration: "none" }}>Tutorial</Link>
            </Box>
          </Grid>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 4, borderRadius: 4, boxShadow: "0 24px 50px rgba(0,0,0,0.25)" }}>
              <Typography variant="h5" gutterBottom>Create account</Typography>
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <TextField
                  fullWidth
                  label="Email"
                  margin="normal"
                  {...register("email")}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Password"
                  margin="normal"
                  {...register("password")}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
                <TextField
                  fullWidth
                  label="Referral Code (optional)"
                  margin="normal"
                  {...register("referralCode")}
                  error={!!errors.referralCode}
                  helperText={errors.referralCode?.message}
                />
                <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ mt: 2, py: 1.2, fontWeight: 700 }}>
                  Create account
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
