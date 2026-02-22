import React from "react";
import { AppBar, Box, Button, Container, InputAdornment, MenuItem, Stack, TextField, Toolbar, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { alpha, useTheme } from "@mui/material/styles";

type MarketOption = { _id: string; name: string };

type MarketplaceHeaderProps = {
  markets: MarketOption[];
  selectedMarketId: string;
  onMarketChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
};

export default function MarketplaceHeader(props: MarketplaceHeaderProps) {
  const { markets, selectedMarketId, onMarketChange, search, onSearchChange, onSearchSubmit } = props;
  const theme = useTheme();

  return (
    <Box>
      <AppBar position="static" elevation={0} sx={{ background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.88)} 100%)` }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: 68, gap: 2, justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Box component="img" src="/Invonta.png" alt="Invonta" sx={{ width: 34, height: 34 }} />
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 34, lineHeight: 1 }}>
                Invonta
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.9), fontWeight: 700, display: { xs: "none", md: "block" } }}>
                Marketplace
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.2} alignItems="center">
              <Button href="/login" color="inherit" sx={{ color: "#fff", textDecoration: "underline", minWidth: 0, px: 1 }}>
                Login
              </Button>
              <Button href="/signup" variant="contained" sx={{ bgcolor: theme.palette.secondary.main, color: theme.palette.primary.main, borderRadius: 999 }}>
                Sell
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`, bgcolor: theme.palette.background.paper }}>
        <Container maxWidth="xl" sx={{ py: 1.5 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
            <TextField
              select
              label="Location"
              value={selectedMarketId}
              onChange={(event) => onMarketChange(event.target.value)}
              sx={{ width: { xs: "100%", md: 260 } }}
            >
              <MenuItem value="">All Markets</MenuItem>
              {markets.map((market) => (
                <MenuItem key={market._id} value={market._id}>
                  {market.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              placeholder="Find products, shops and more..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button variant="contained" onClick={onSearchSubmit} sx={{ minWidth: 112 }}>
                      <SearchIcon sx={{ mr: 0.8 }} />
                      Search
                    </Button>
                  </InputAdornment>
                )
              }}
            />
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

