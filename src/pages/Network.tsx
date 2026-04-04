import React from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import ShopFriends from "./friends/ShopFriends";
import ShopDiscover from "./friends/ShopDiscover";

export default function Network() {
  const [tabIndex, setTabIndex] = React.useState(0);

  return (
    <Box sx={{ animation: "fadeInUp 420ms ease" }}>
      <Box sx={{ mb: 3 }}>
         <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>Network & Ecosystem</Typography>
         <Typography color="text.secondary">Connect with other shops and expand your community reach.</Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_, nv) => setTabIndex(nv)} textColor="primary" indicatorColor="primary">
          <Tab label="Shop Friends" sx={{ fontWeight: 700 }} />
          <Tab label="Discover Shops" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <Box sx={{ mt: -2 }}>
           <ShopFriends />
        </Box>
      )}
      {tabIndex === 1 && (
        <Box sx={{ mt: -2 }}>
           <ShopDiscover />
        </Box>
      )}
    </Box>
  );
}
