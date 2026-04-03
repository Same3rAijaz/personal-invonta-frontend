import React from "react";
import { Box, Button, Checkbox, Divider, Drawer, FormControlLabel, Grid, IconButton, Paper, TextField, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useForm } from "react-hook-form";
import { useToast } from "../hooks/useToast";
import { useCreateCustomer } from "../hooks/useCustomers";
import { useCreateVendor } from "../hooks/useVendors";
import { useCreateWarehouse } from "../hooks/useWarehouses";

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
      title: "Create Customer",
      successMessage: "Customer created"
    };
  }
  if (type === "vendor") {
    return {
      title: "Create Vendor",
      successMessage: "Vendor created"
    };
  }
  return {
    title: "Create Warehouse",
    successMessage: "Warehouse created"
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
      onCreated?.(created);
      onClose();
      reset({ isActive: true });
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const isPending =
    type === "customer"
      ? createCustomer.isPending
      : type === "vendor"
        ? createVendor.isPending
        : createWarehouse.isPending;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 480 } } }}>
      <Box sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ p: 2.5 }}>
        <Paper elevation={0} sx={{ p: 0, boxShadow: "none" }}>
          <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid item xs={12} md={type === "warehouse" ? 12 : 6}>
              <TextField
                fullWidth
                label="Name *"
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
                <TextField fullWidth label="Phone" {...register("phone")} />
              </Grid>
            ) : null}
            <Grid item xs={12} md={type === "warehouse" ? 12 : 6}>
              <TextField fullWidth label="Address" {...register("address")} />
            </Grid>
            {type !== "warehouse" ? (
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Payment Terms" {...register("paymentTerms")} />
              </Grid>
            ) : null}
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Active" />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth sx={{ py: 1.3, fontWeight: 700 }} disabled={isPending}>
                {title}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Drawer>
  );
}
