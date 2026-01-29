import { Box, Container, Paper, Typography } from "@mui/material";

export default function Privacy() {
  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(14,165,233,0.18) 0%, #0b1220 40%, #0f172a 100%)", py: 8 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: "0 30px 60px rgba(15,23,42,0.35)" }}>
          <Typography variant="h4" gutterBottom>Privacy Policy</Typography>
          <Typography paragraph>
            Invonta collects account details, business profile data, and activity logs to deliver inventory and sales features.
            We do not sell your data.
          </Typography>
          <Typography paragraph>
            We store uploaded images and documents in cloud storage you control. Access is limited to your organization.
          </Typography>
          <Typography paragraph>
            You can request data removal by contacting support. Admins can export core records for compliance.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
