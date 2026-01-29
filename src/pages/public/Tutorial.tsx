import { Box, Container, Paper, Typography } from "@mui/material";

export default function Tutorial() {
  return (
    <Box sx={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(14,165,233,0.18) 0%, #0b1220 40%, #0f172a 100%)", py: 8 }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: "0 30px 60px rgba(15,23,42,0.35)" }}>
          <Typography variant="h4" gutterBottom>Getting Started</Typography>
          <Typography paragraph>
            1) Create products, warehouses, and locations. Keep SKUs unique for clean inventory tracking.
          </Typography>
          <Typography paragraph>
            2) Receive inventory, then issue or transfer stock as you fulfill orders.
          </Typography>
          <Typography paragraph>
            3) Create sales orders and generate invoices. Use reports to monitor low stock and valuation.
          </Typography>
          <Typography paragraph>
            4) Add employees and assign module access based on their responsibilities.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
