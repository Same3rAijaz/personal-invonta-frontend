import React from "react";
import { Box, Button, Checkbox, Drawer, FormControlLabel, Grid, IconButton, Paper, Typography } from "@mui/material";
import TextField from "./CustomTextField";
import CloseIcon from "@mui/icons-material/Close";
import { useForm } from "react-hook-form";
import { useToast } from "../hooks/useToast";
import { useCreateCustomer } from "../hooks/useCustomers";
import { useCreateVendor } from "../hooks/useVendors";
import { useCreateWarehouse } from "../hooks/useWarehouses";
import AddCircleIcon from "@mui/icons-material/AddCircle";

type RelatedEntityType = "customer" | "vendor" | "warehouse";

type RelatedEntityDrawerProps = {
  open: boolean;
  type: RelatedEntityType;
  onClose: () => void;
  onCreated?: (entity: any) => void;
};

function getConfig(type: RelatedEntityType) {
  if (type === "customer") {
    return {
      title: "Create New Customer",
      successMessage: "Customer created successfully"
    };
  }
  if (type === "vendor") {
    return {
      title: "Create New Vendor",
      successMessage: "Vendor created successfully"
    };
  }
  return {
    title: "Create New Warehouse",
    successMessage: "Warehouse created successfully"
  };
}

export default function RelatedEntityDrawer(props: RelatedEntityDrawerProps) {
  const { open, type, onClose, onCreated } = props;
  const { title, successMessage } = getConfig(type);
  const createCustomer = useCreateCustomer();
  const createVendor = useCreateVendor();
  const createWarehouse = useCreateWarehouse();
  const { notify } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    defaultValues: { isActive: true }
  });

  React.useEffect(() => {
    if (open) {
      reset({ isActive: true });
    }
  }, [open, reset, type]);

  const onSubmit = async (values: any) => {
    try {
      const created =
        type === "customer"
          ? await createCustomer.mutateAsync(values)
          : type === "vendor"
            ? await createVendor.mutateAsync(values)
            : await createWarehouse.mutateAsync(values);
      notify(successMessage, "success");
      onCreated?.(created?.data || created);
      onClose();
      reset({ isActive: true });
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed to create entity", "error");
    }
  };

  const isPending =
    type === "customer"
      ? createCustomer.isPending
      : type === "vendor"
        ? createVendor.isPending
        : createWarehouse.isPending;

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose} 
      sx={{ zIndex: 1400 }}
      PaperProps={{ 
        sx: { 
          width: { xs: "100%", sm: 500 }, 
          bgcolor: "background.paper", 
          backgroundImage: "none",
          backdropFilter: "blur(20px)"
        } 
      }}
    >
      <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AddCircleIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>{title}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: "action.hover" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ p: 3, height: "100%", overflowY: "auto" }}>
          <Grid container spacing={2.5} component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid item xs={12} md={type === "warehouse" ? 12 : 6}>
              <TextField
                fullWidth
                label="Name *"
                placeholder="Enter display name"
                {...register("name", { required: "Name is required" })}
                error={!!errors.name}
                helperText={errors.name?.message as string}
              />
            </Grid>
            {type !== "warehouse" ? (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email *"
                  type="email"
                  placeholder="name@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message as string}
                />
              </Grid>
            ) : null}
            {type !== "warehouse" ? (
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Phone" placeholder="+1234567890" {...register("phone")} />
              </Grid>
            ) : null}
            <Grid item xs={12} md={type === "warehouse" ? 12 : 6}>
              <TextField fullWidth label="Address" placeholder="Street layout" {...register("address")} />
            </Grid>
            {type !== "warehouse" ? (
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Payment Terms" placeholder="e.g. Net 30" {...register("paymentTerms")} />
              </Grid>
            ) : null}
            <Grid item xs={12}>
              <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: "background.default", border: "1px solid", borderColor: "divider" }}>
                <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Active and available for orders</Typography>} />
              </Paper>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" fullWidth sx={{ py: 1.5, fontWeight: 800, borderRadius: 2 }} disabled={isPending}>
                {isPending ? "Creating..." : title}
              </Button>
              <Button variant="text" fullWidth onClick={onClose} sx={{ mt: 1, py: 1.2, color: "text.secondary" }}>
                Cancel
              </Button>
            </Grid>
          </Grid>
      </Box>
    </Drawer>
  );
}
