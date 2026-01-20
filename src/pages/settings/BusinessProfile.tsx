import { Box, Button, Paper, Typography, Grid, TextField, Divider, Avatar } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useToast } from "../../hooks/useToast";
import { uploadImage } from "../../utils/upload";

export default function BusinessProfile() {
  const { notify } = useToast();
  const client = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["business", "me"],
    queryFn: async () => (await api.get("/businesses/me")).data.data
  });
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (data) {
      reset({
        name: data.name || "",
        contactName: data.contactName || "",
        contactPhone: data.contactPhone || "",
        address: data.address || ""
      });
      setLogoPreview(data.logoUrl || null);
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await api.patch("/businesses/me", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["business", "me"] })
  });

  const logoPath = useMemo(() => {
    const id = data?._id || "business";
    return `businesses/${id}/logo`;
  }, [data?._id]);

  const onSubmit = async (values: any) => {
    try {
      let logoUrl = data?.logoUrl;
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, logoPath);
      }
      await mutation.mutateAsync({ ...values, logoUrl });
      notify("Profile updated", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || err?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Business Profile</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Business Name" {...register("name")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Contact Name" {...register("contactName")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Contact Phone" {...register("contactPhone")} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Address" {...register("address")} />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar src={logoPreview || undefined} sx={{ width: 64, height: 64 }} />
              <Button variant="outlined" component="label">
                Upload Logo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setLogoFile(file);
                    setLogoPreview(file ? URL.createObjectURL(file) : data?.logoUrl || null);
                  }}
                />
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.4, fontWeight: 700 }}>
              Save Profile
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
