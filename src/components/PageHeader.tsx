import { Box, Button, Typography, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          mb: 1,
          "& .MuiBreadcrumbs-li": { fontSize: { xs: "0.78rem", sm: "0.85rem" }, fontWeight: 600 },
          "& .MuiBreadcrumbs-ol": { flexWrap: "wrap" },
        }}
      >
        <MuiLink component={Link} to="/" color="inherit" underline="hover">
          Home
        </MuiLink>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const title = value.charAt(0).toUpperCase() + value.slice(1);
          return last ? (
            <Typography color="text.primary" key={to} sx={{ fontSize: { xs: "0.78rem", sm: "0.85rem" }, fontWeight: 700 }}>
              {title}
            </Typography>
          ) : (
            <MuiLink component={Link} to={to} color="inherit" underline="hover" key={to}>
              {title}
            </MuiLink>
          );
        })}
      </Breadcrumbs>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.15, wordBreak: "break-word" }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {actionLabel && onAction ? (
          <Button
            variant="contained"
            onClick={onAction}
            sx={{ alignSelf: { xs: "stretch", sm: "auto" }, flexShrink: 0 }}
          >
            {actionLabel}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
