import React from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import Customers from "./Customers";
import Vendors from "./Vendors";

export default function Partners() {
  const [tabIndex, setTabIndex] = React.useState(0);

  return (
    <Box sx={{ animation: "fadeInUp 420ms ease" }}>
      <Box sx={{ mb: 3 }}>
         <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>Partners</Typography>
         <Typography color="text.secondary">Seamlessly manage your connections and supply chain in one place.</Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_, nv) => setTabIndex(nv)} textColor="primary" indicatorColor="primary">
          <Tab label="Customers" sx={{ fontWeight: 700 }} />
          <Tab label="Vendors & Suppliers" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <Box sx={{ mt: -2 }}>
           <Customers showHeader={false} />
        </Box>
      )}
      {tabIndex === 1 && (
        <Box sx={{ mt: -2 }}>
           <Vendors showHeader={false} />
        </Box>
      )}
    </Box>
  );
}
