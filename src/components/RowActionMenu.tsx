import React from "react";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";

export type RowActionItem = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
};

export default function RowActionMenu({ actions }: { actions: RowActionItem[] }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const visibleActions = actions.filter(Boolean);

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton
        size="small"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-label="Open actions menu"
      >
        <MoreVertRoundedIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { minWidth: 200, borderRadius: 2 } }}
      >
        <Box sx={{ px: 2, py: 1.1, borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
          <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 0.8 }}>
            Actions
          </Typography>
        </Box>
        {visibleActions.map((action) => (
          <MenuItem
            key={action.label}
            disabled={action.disabled}
            onClick={() => {
              handleClose();
              action.onClick();
            }}
            sx={action.danger ? { color: "error.main" } : undefined}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
