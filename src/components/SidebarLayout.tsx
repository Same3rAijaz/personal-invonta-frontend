import React from "react";
import { Box, Typography, IconButton, Button, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useThemeMode } from "../contexts/ThemeContext";

interface SidebarLayoutProps {
  title: string;
  breadcrumb?: string[];
  onCancel?: () => void;
  onSubmit?: () => void;
  children: React.ReactNode;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export default function SidebarLayout({ title, breadcrumb, onCancel, onSubmit, children, submitLabel = "Save", isSubmitting }: SidebarLayoutProps) {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  // Auto-generate breadcrumb if none provided and title exists
  const autoBreadcrumb = React.useMemo(() => {
    if (breadcrumb) return breadcrumb;
    if (!title) return [];
    
    // Simple heuristic: "Edit Customer" -> ["Customers", "Edit"]
    const parts = title.split(" ");
    if (parts.length >= 2) {
      const action = parts[0]; // Create, Edit, New, etc.
      let entity = parts.slice(1).join(" ");
      if (entity.endsWith("y")) entity = entity.slice(0, -1) + "ies"; 
      else if (!entity.endsWith("s")) entity += "s"; 
      return [entity, action];
    }
    return [title];
  }, [title, breadcrumb]);
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: isDark ? "#020617" : "#f8fafc" }}>
      {/* Header Area */}
      <Box sx={{ 
        px: 4, py: 4, 
        background: isDark ? "linear-gradient(135deg, #0f172a 0%, #020617 100%)" : "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(148,163,184,0.15)"}`,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between"
      }}>
        <Box>
          {autoBreadcrumb.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
              {autoBreadcrumb.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{crumb}</Typography>
                  {idx < autoBreadcrumb.length - 1 && <ChevronRightRoundedIcon sx={{ fontSize: 16, color: "#94a3b8" }} />}
                </React.Fragment>
              ))}
            </Box>
          )}
          <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", letterSpacing: -0.5 }}>
            {title}
          </Typography>
        </Box>

        {onCancel && (
          <IconButton 
            onClick={onCancel} 
            sx={{ 
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)", 
              "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)", transform: "rotate(90deg)" },
              transition: "all 0.2s"
            }}
          >
             <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Content Area */}
      <Box sx={{ p: 4, flexGrow: 1, overflowY: "auto" }}>
        {children}
      </Box>

      {/* Footer Area */}
      <Box sx={{ 
        px: 4, py: 3, 
        background: isDark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.85)", 
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(148,163,184,0.15)"}`, 
        display: "flex", justifyContent: "flex-end", gap: 2 
      }}>
        {onCancel && (
          <Button onClick={onCancel} variant="text" sx={{ color: "#64748b", fontWeight: 700, px: 3 }}>
            Cancel
          </Button>
        )}
        {onSubmit ? (
          <Button variant="contained" onClick={onSubmit} disabled={isSubmitting} size="large" sx={{ 
            minWidth: 140, fontWeight: 700, borderRadius: 2,
            background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            boxShadow: "0 8px 20px rgba(99,102,241,0.25)"
          }}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : submitLabel}
          </Button>
        ) : (
          <Button type="submit" form="sidebar-form" variant="contained" disabled={isSubmitting} size="large" sx={{ 
            minWidth: 140, fontWeight: 700, borderRadius: 2,
            background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            boxShadow: "0 8px 20px rgba(99,102,241,0.25)"
          }}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : submitLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}
