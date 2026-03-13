import React from "react";
import { AppBar, Avatar, Box, Button, CircularProgress, Container, IconButton, MenuItem, Stack, TextField, Toolbar, Typography, alpha, useTheme } from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SearchIcon from "@mui/icons-material/Search";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import GoogleIcon from "@mui/icons-material/Google";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import { firebaseGoogleLogin } from "../../api/auth";
import { useMarketplaceAuth } from "../../hooks/useMarketplaceAuth";
import { useToast } from "../../hooks/useToast";
import { getFirebaseAuth } from "../../lib/firebase";
import { keyframes } from "@mui/system";

const aiGlow = keyframes`
  0% {
    filter: drop-shadow(0 0 2px rgba(33, 166, 223, 0.4));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(33, 166, 223, 0.8));
    transform: scale(1.1);
  }
  100% {
    filter: drop-shadow(0 0 2px rgba(33, 166, 223, 0.4));
    transform: scale(1);
  }
`;

type MarketOption = { _id: string; name: string };

type MarketplaceHeaderProps = {
  markets?: MarketOption[];
  selectedMarketId?: string;
  onMarketChange?: (value: string) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  showSearchBar?: boolean;
  semanticMode?: boolean;
  onSemanticModeChange?: (value: boolean) => void;
};

export default function MarketplaceHeader(props: MarketplaceHeaderProps) {
  const {
    markets = [],
    selectedMarketId = "",
    onMarketChange,
    search = "",
    onSearchChange,
    onSearchSubmit,
    showSearchBar = true
  } = props;
  const theme = useTheme();
  const { notify } = useToast();
  const marketplaceAuth = useMarketplaceAuth();
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const displayName =
    marketplaceAuth.profile?.fullName ||
    marketplaceAuth.user?.fullName ||
    marketplaceAuth.profile?.email ||
    marketplaceAuth.user?.email ||
    "Marketplace User";

  const initials = String(displayName)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase();

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const firebaseAuth = getFirebaseAuth();
      const authResult = await signInWithPopup(firebaseAuth, provider);
      const firebaseIdToken = await authResult.user.getIdToken();
      const session = await firebaseGoogleLogin(firebaseIdToken);
      marketplaceAuth.login(session);
      notify("Signed in with Google", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Google sign-in failed", "error");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleMarketplaceLogout = async () => {
    try {
      marketplaceAuth.logout();
      const firebaseAuth = getFirebaseAuth();
      await signOut(firebaseAuth);
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  return (
    <Box>
      <AppBar position="static" elevation={0} sx={{ background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.88)} 100%)` }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: 52, gap: 2, justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Box component="img" src="/Invonta.png" alt="Invonta" sx={{ width: 34, height: 34 }} />
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 22, lineHeight: 1 }}>
                Invonta
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.9), fontWeight: 700, display: { xs: "none", md: "block" } }}>
                Marketplace
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.2} alignItems="center">
              {marketplaceAuth.isAuthenticated ? (
                <>
                  <IconButton component={Link} to="/marketplace/favorites" sx={{ color: "#ffffff", mr: 1 }}>
                    <FavoriteBorderIcon />
                  </IconButton>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {marketplaceAuth.profile?.avatarUrl ? (
                      <Avatar src={marketplaceAuth.profile.avatarUrl} sx={{ width: 32, height: 32, fontSize: 12 }} />
                    ) : (
                      <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: alpha("#ffffff", 0.22), color: "#ffffff" }}>
                        {initials}
                      </Avatar>
                    )}
                    <Typography sx={{ color: "#ffffff", fontWeight: 700, maxWidth: 220 }} noWrap>
                      {displayName}
                    </Typography>
                  </Stack>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleMarketplaceLogout}
                    sx={{ color: "#ffffff", borderColor: alpha("#ffffff", 0.5) }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <IconButton component={Link} to="/marketplace/favorites" sx={{ color: "#ffffff", mr: 1 }}>
                    <FavoriteBorderIcon />
                  </IconButton>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={isGoogleLoading ? <CircularProgress size={14} sx={{ color: "#0b1220" }} /> : <GoogleIcon />}
                    disabled={isGoogleLoading}
                    onClick={handleGoogleLogin}
                    sx={{
                      color: "#0b1220",
                      bgcolor: "#ffffff",
                      fontWeight: 700,
                      minWidth: { xs: 40, sm: "auto" },
                      px: { xs: 1, sm: 2 },
                      "& .MuiButton-startIcon": {
                        margin: { xs: 0, sm: "0 8px 0 -4px" }
                      },
                      "&:hover": { bgcolor: alpha("#ffffff", 0.92) }
                    }}
                  >
                    <Box component="span" sx={{ display: { xs: "none", sm: "block" } }}>
                      Continue with Google
                    </Box>
                  </Button>
                  <Button
                    component={Link}
                    to="/login"
                    size="small"
                    variant="outlined"
                    sx={{
                      color: "#ffffff",
                      borderColor: alpha("#ffffff", 0.35),
                      fontWeight: 700,
                      px: 2,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      textTransform: "none",
                      "&:hover": {
                        borderColor: "#ffffff",
                        bgcolor: alpha("#ffffff", 0.08)
                      }
                    }}
                  >
                    Business Login
                  </Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {showSearchBar ? (
        <Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`, bgcolor: theme.palette.background.paper }}>
          <Container maxWidth="xl" sx={{ py: 1.5 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
              <TextField
                select
                label="Location"
                value={selectedMarketId}
                onChange={(event) => onMarketChange?.(event.target.value)}
                sx={{ width: { xs: "100%", md: 260 } }}
                InputProps={{
                  startAdornment: <LocationOnOutlinedIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                }}
              >
                <MenuItem value="">All Markets</MenuItem>
                {markets.map((market) => (
                  <MenuItem key={market._id} value={market._id}>
                    {market.name}
                  </MenuItem>
                ))}
              </TextField>
              <Stack direction="row" sx={{ flex: 1, position: "relative" }}>
                <TextField
                  fullWidth
                  placeholder="Search anything with AI... (e.g. 'something to record video')"
                  value={search}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSearchSubmit?.();
                    }
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      pl: 1,
                      background: alpha(theme.palette.primary.main, 0.03)
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`, pr: 1, display: 'flex', alignItems: 'center' }}>
                        <AutoAwesomeIcon 
                          sx={{ 
                            fontSize: 20, 
                            color: theme.palette.primary.main,
                            animation: search.trim().length > 0 ? `${aiGlow} 2s infinite ease-in-out` : 'none'
                          }} 
                        />
                      </Box>
                    )
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={onSearchSubmit}
                  sx={{
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    px: { xs: 2, sm: 4 },
                    minWidth: { xs: 'auto', sm: 122 },
                    background: `linear-gradient(135deg, #0b1220 0%, #172542 100%)`,
                    "& .MuiButton-startIcon": {
                       margin: { xs: 0, sm: "0 8px 0 -4px" }
                     }
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    Search
                  </Box>
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>
      ) : null}
    </Box>
  );
}

