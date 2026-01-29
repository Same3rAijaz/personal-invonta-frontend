import { Box, Container, Paper, Typography } from "@mui/material";

export default function Terms() {
  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(14,165,233,0.18) 0%, #0b1220 40%, #0f172a 100%)", py: 8 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: "0 30px 60px rgba(15,23,42,0.35)" }}>
          <Typography variant="h4" gutterBottom>Terms & Conditions</Typography>
          <Typography paragraph>
            Invonta provides inventory, sales, and attendance tooling. You are responsible for data accuracy and user access.
          </Typography>
          <Typography paragraph>
            Do not upload illegal or infringing content. Usage may be suspended for violations or abuse.
          </Typography>
          <Typography paragraph>
            We may update features and policies as the platform evolves.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
