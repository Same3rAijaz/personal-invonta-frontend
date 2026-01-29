import { Box, Button, Paper, Typography, Grid, TextField, Divider, Avatar, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useToast } from "../../hooks/useToast";
import { uploadImage } from "../../utils/upload";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../hooks/useAuth";

export default function BusinessProfile() {
  const { notify } = useToast();
  const client = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { user, updateUser } = useAuth();
  const isBusinessOwner = user?.role === "ADMIN";
  const { data: businessData } = useQuery({
    queryKey: ["business", "me"],
    queryFn: async () => (await api.get("/businesses/me")).data.data,
    enabled: isBusinessOwner
  });
  const { register, handleSubmit, reset } = useForm();
  const {
    register: registerUser,
    handleSubmit: handleSubmitUser,
    reset: resetUser
  } = useForm();

  useEffect(() => {
    if (businessData) {
      reset({
        name: businessData.name || "",
        contactName: businessData.contactName || "",
        contactPhone: businessData.contactPhone || "",
        address: businessData.address || ""
      });
      setLogoPreview(businessData.logoUrl || null);
    }
  }, [businessData, reset]);

  useEffect(() => {
    if (user) {
      resetUser({
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || ""
      });
    }
  }, [user, resetUser]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => (await api.patch("/businesses/me", payload)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["business", "me"] })
  });

  const profileMutation = useMutation({
    mutationFn: async (payload: any) => (await api.patch("/auth/me", payload)).data
  });

  const logoPath = useMemo(() => {
    const id = businessData?._id || "business";
    return `businesses/${id}/logo`;
  }, [businessData?._id]);

  const onSubmit = async (values: any) => {
    try {
      let logoUrl = businessData?.logoUrl;
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, logoPath);
      }
      await mutation.mutateAsync({ ...values, logoUrl });
      notify("Profile updated", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || err?.message || "Failed", "error");
    }
  };

  const onSubmitUser = async (values: any) => {
    try {
      const payload = { fullName: values.fullName, phoneNumber: values.phoneNumber };
      const updated = await profileMutation.mutateAsync(payload);
      updateUser({ ...user, ...updated });
      notify("Profile updated", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || err?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader
        title={isBusinessOwner ? "Business Profile" : "Profile"}
        subtitle={isBusinessOwner ? "Manage your company details and branding." : "Manage your personal details and contact info."}
      />
      <Grid container spacing={3}>
        {isBusinessOwner ? (
          <>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar src={logoPreview || undefined} sx={{ width: 72, height: 72 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {businessData?.name || "Your Business"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Profile status: Active
                      </Typography>
                    </Box>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Primary Contact</Typography>
                    <Typography variant="body2">{businessData?.contactName || "-"}</Typography>
                    <Typography variant="body2" color="text.secondary">{businessData?.contactPhone || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Business Address</Typography>
                    <Typography variant="body2">{businessData?.address || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Branding</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload a logo to personalize invoices, reports, and the dashboard.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Company details</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Keep these details up to date for accurate records and communication.
                </Typography>
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
                  <Grid item xs={12} md={7}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar src={logoPreview || undefined} sx={{ width: 56, height: 56 }} />
                      <Button variant="outlined" component="label">
                        Upload Logo
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setLogoFile(file);
                            setLogoPreview(file ? URL.createObjectURL(file) : businessData?.logoUrl || null);
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
                      Save Business Profile
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </>
        ) : null}
        <Grid item xs={12} md={isBusinessOwner ? 12 : 8} lg={isBusinessOwner ? 12 : 6}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Your profile</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Update your personal information and contact number.
            </Typography>
            <Grid container spacing={2} component="form" onSubmit={handleSubmitUser(onSubmitUser)}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Full Name" {...registerUser("fullName")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email" {...registerUser("email")} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Phone Number (E.164)" {...registerUser("phoneNumber")} />
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
        </Grid>
      </Grid>
    </Box>
  );
}
