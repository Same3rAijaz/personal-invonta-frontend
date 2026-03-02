import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};

const defaultOptions: Required<ConfirmOptions> = {
  title: "Confirm Action",
  message: "Are you sure you want to continue?",
  confirmText: "Confirm",
  cancelText: "Cancel"
};

export function useConfirmDialog() {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<Required<ConfirmOptions>>(defaultOptions);
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback((nextOptions?: ConfirmOptions) => {
    setOptions({ ...defaultOptions, ...(nextOptions || {}) });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const closeWith = React.useCallback((value: boolean) => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
  }, []);

  const confirmDialog = (
    <Dialog open={open} onClose={() => closeWith(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {options.title}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 0.5 }}>
        <Stack spacing={1}>
          <Typography color="text.secondary">{options.message}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={() => closeWith(false)}>{options.cancelText}</Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => closeWith(true)}
          sx={{
            borderRadius: 2,
            boxShadow: "0 10px 20px rgba(220,38,38,0.25)",
            px: 2.2
          }}
        >
          {options.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { confirm, confirmDialog };
}
