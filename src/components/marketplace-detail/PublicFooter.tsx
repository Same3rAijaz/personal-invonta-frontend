import React from "react";
import { Box, Container, Grid, Link, Stack, Typography, alpha, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function PublicFooter() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#0b1220",
        color: "rgba(255, 255, 255, 0.7)",
        py: 6,
        borderTop: `1px solid ${alpha("#94a3b8", 0.2)}`,
        mt: "auto",
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  component="img"
                  src="/Invonta.png"
                  alt="Invonta"
                  sx={{ width: 32, height: 32 }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: -0.5,
                  }}
                >
                  Invonta
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ maxWidth: 300, lineHeight: 1.6 }}>
                Advanced Operations Suite for modern businesses. Streamline your inventory, 
                sales, and reporting with ease.
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#ffffff" }}>
                A Product by{" "}
                <Link
                  href="https://www.asasatech.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  ASASA Tech
                </Link>
              </Typography>
            </Stack>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" sx={{ color: "#ffffff", fontWeight: 700, mb: 2 }}>
              Platform
            </Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to="/marketplace" sx={{ color: "inherit", textDecoration: "none", fontSize: "0.875rem", "&:hover": { color: "#ffffff" } }}>
                Marketplace
              </Link>
              <Link component={RouterLink} to="/login" sx={{ color: "inherit", textDecoration: "none", fontSize: "0.875rem", "&:hover": { color: "#ffffff" } }}>
                Business Login
              </Link>
              <Link component={RouterLink} to="/signup" sx={{ color: "inherit", textDecoration: "none", fontSize: "0.875rem", "&:hover": { color: "#ffffff" } }}>
                Sign Up
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" sx={{ color: "#ffffff", fontWeight: 700, mb: 2 }}>
              Legal
            </Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to="/privacy" sx={{ color: "inherit", textDecoration: "none", fontSize: "0.875rem", "&:hover": { color: "#ffffff" } }}>
                Privacy Policy
              </Link>
              <Link component={RouterLink} to="/terms" sx={{ color: "inherit", textDecoration: "none", fontSize: "0.875rem", "&:hover": { color: "#ffffff" } }}>
                Terms & Conditions
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ color: "#ffffff", fontWeight: 700, mb: 2 }}>
              About ASASA Tech
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
              ASASA Tech is a leading technology solutions provider specializing in business 
              automation and digital transformation.
            </Typography>
            <Link
              href="https://www.asasatech.com"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-block",
                color: "#ffffff",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${theme.palette.primary.main}`,
                px: 2,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.8125rem",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": {
                  bgcolor: theme.palette.primary.main,
                }
              }}
            >
              Visit Website
            </Link>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, pt: 3, borderTop: `1px solid ${alpha("#94a3b8", 0.1)}`, textAlign: "center" }}>
          <Typography variant="caption">
            © {currentYear} Invonta. All rights reserved. Built with excellence by ASASA Tech.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
