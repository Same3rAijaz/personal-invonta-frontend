import { Box, Button, Paper, Typography, Grid, TextField, Divider, Avatar, Stack, FormControlLabel, Checkbox, MenuItem } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useToast } from "../../hooks/useToast";
import { uploadImage } from "../../utils/upload";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { slugifySeo } from "../../utils/seo";

export default function BusinessProfile() {
  const { notify } = useToast();
  const client = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [ownerPhotoFile, setOwnerPhotoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [ownerPhotoPreview, setOwnerPhotoPreview] = useState<string | null>(null);
  const { user, updateUser } = useAuth();
  const isBusinessOwner = user?.role === "ADMIN";
  const { data: businessData } = useQuery<any>({
    queryKey: ["business", "me"],
    queryFn: async () => (await api.get("/businesses/me")).data.data,
    enabled: isBusinessOwner
  });
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const {
    register: registerUser,
    handleSubmit: handleSubmitUser,
    reset: resetUser
  } = useForm();

  const withCacheBust = (url?: string | null, version?: string | number) => {
    if (!url) return null;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${version || Date.now()}`;
  };

  useEffect(() => {
    if (businessData) {
      reset({
        name: businessData.name || "",
        contactName: businessData.contactName || "",
        contactPhone: businessData.contactPhone || "",
        address: businessData.address || "",
        tagline: businessData.tagline || "",
        description: businessData.description || "",
        shopSlug: businessData.shopSlug || "",
        supportEmail: businessData.supportEmail || "",
        whatsappNumber: businessData.whatsappNumber || "",
        websiteUrl: businessData.websiteUrl || "",
        instagramUrl: businessData.instagramUrl || "",
        facebookUrl: businessData.facebookUrl || "",
        marketplaceVisible: businessData.marketplaceVisible ?? true,
        printSize: businessData.printSize || "A4"
      });
      setLogoPreview(withCacheBust(businessData.logoUrl, businessData.updatedAt || Date.now()));
      setBannerPreview(withCacheBust(businessData.bannerUrl, businessData.updatedAt || Date.now()));
      setOwnerPhotoPreview(withCacheBust(businessData.profileImageUrl, businessData.updatedAt || Date.now()));
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
    mutationFn: async (payload: any) => (await api.patch("/auth/me", payload)).data.data
  });

  const logoPath = useMemo(() => {
    const id = businessData?._id || "business";
    return `businesses/${id}/logo`;
  }, [businessData?._id]);
  const bannerPath = useMemo(() => {
    const id = businessData?._id || "business";
    return `businesses/${id}/banner`;
  }, [businessData?._id]);
  const ownerPhotoPath = useMemo(() => {
    const id = businessData?._id || "business";
    return `businesses/${id}/owner-profile`;
  }, [businessData?._id]);

  const watchedBusinessName = watch("name");
  const watchedShopSlug = watch("shopSlug");
  useEffect(() => {
    if (!watchedShopSlug && watchedBusinessName) {
      setValue("shopSlug", slugifySeo(watchedBusinessName), { shouldDirty: true });
    }
  }, [watchedBusinessName, watchedShopSlug, setValue]);

  const onSubmit = async (values: any) => {
    try {
      let logoUrl = businessData?.logoUrl;
      let bannerUrl = businessData?.bannerUrl;
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, logoPath);
      }
      if (bannerFile) {
        bannerUrl = await uploadImage(bannerFile, bannerPath);
      }
      const updatedBusiness = await mutation.mutateAsync({
        ...values,
        logoUrl,
        bannerUrl,
        shopSlug: slugifySeo(values.shopSlug || values.name || "")
      });
      setLogoPreview(withCacheBust(updatedBusiness?.logoUrl || logoUrl, Date.now()));
      setBannerPreview(withCacheBust(updatedBusiness?.bannerUrl || bannerUrl, Date.now()));
      setLogoFile(null);
      setBannerFile(null);
      notify("Profile updated", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || err?.message || "Failed", "error");
    }
  };

  const onSubmitUser = async (values: any) => {
    try {
      let ownerProfileUrl = businessData?.profileImageUrl;
      if (ownerPhotoFile) {
        ownerProfileUrl = await uploadImage(ownerPhotoFile, ownerPhotoPath);
        await mutation.mutateAsync({ profileImageUrl: ownerProfileUrl });
        setOwnerPhotoPreview(withCacheBust(ownerProfileUrl, Date.now()));
        setOwnerPhotoFile(null);
      }
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
      <PageHeader title={isBusinessOwner ? "Business Profile" : "Profile"} subtitle={isBusinessOwner ? "Manage business branding and owner profile separately." : "Manage your personal details and contact info."} />
      <Grid container spacing={3}>
        {isBusinessOwner ? (
          <>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
                <Stack spacing={2}>
                  <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", minHeight: 160, bgcolor: "rgba(15,23,42,0.08)" }}>
                    {bannerPreview ? (
                      <Box component="img" src={bannerPreview} sx={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                    ) : null}
                    <Avatar src={logoPreview || undefined} sx={{ width: 78, height: 78, position: "absolute", left: 16, bottom: 16, border: "3px solid #fff" }} />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Storefront URL</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {businessData?.shopSlug ? `/${businessData.shopSlug}` : "Set shop slug in storefront settings"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Branding</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Configure only your business identity assets here: logo and shop banner.
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Business Owner</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Owner profile details and photo are managed in the separate owner section below.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Storefront Setup</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Set up business information and digital shop presence in marketplace.
                </Typography>
                <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Business Name" InputLabelProps={{ shrink: true }} {...register("name")} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Contact Name" InputLabelProps={{ shrink: true }} {...register("contactName")} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Contact Phone" InputLabelProps={{ shrink: true }} {...register("contactPhone")} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Address" InputLabelProps={{ shrink: true }} {...register("address")} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Tagline" InputLabelProps={{ shrink: true }} placeholder="A short line shown near your shop title" {...register("tagline")} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Shop Description"
                      InputLabelProps={{ shrink: true }}
                      placeholder="Tell customers what you sell, delivery areas, service quality, and business strengths."
                      {...register("description")}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Shop Slug (SEO URL)" InputLabelProps={{ shrink: true }} {...register("shopSlug")} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel control={<Checkbox defaultChecked {...register("marketplaceVisible")} />} label="Show business publicly on marketplace" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Support Email" InputLabelProps={{ shrink: true }} {...register("supportEmail")} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="WhatsApp Number" InputLabelProps={{ shrink: true }} {...register("whatsappNumber")} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Website URL" InputLabelProps={{ shrink: true }} {...register("websiteUrl")} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Instagram URL" InputLabelProps={{ shrink: true }} {...register("instagramUrl")} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Facebook URL" InputLabelProps={{ shrink: true }} {...register("facebookUrl")} />
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={12} md={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Business Branding</Typography>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                      <Button variant="outlined" component="label">
                        Upload Business Logo
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setLogoFile(file);
                            setLogoPreview(file ? URL.createObjectURL(file) : withCacheBust(businessData?.logoUrl, businessData?.updatedAt || Date.now()));
                          }}
                        />
                      </Button>
                      <Button variant="outlined" component="label">
                        Upload Shop Banner
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setBannerFile(file);
                            setBannerPreview(file ? URL.createObjectURL(file) : withCacheBust(businessData?.bannerUrl, businessData?.updatedAt || Date.now()));
                          }}
                        />
                      </Button>
                    </Stack>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={12} md={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Print & Document Settings</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Select the default paper size to format invoices globally for your business.
                    </Typography>
                    <Stack direction="row">
                       <TextField
                        select
                        fullWidth
                        label="Default Invoice Print Size"
                        InputLabelProps={{ shrink: true }}
                        value={watch("printSize") || "A4"}
                        onChange={(e) => setValue("printSize", e.target.value, { shouldDirty: true })}
                      >
                         <MenuItem value="A4">A4</MenuItem>
                         <MenuItem value="A5">A5</MenuItem>
                         <MenuItem value="80mm">Thermal Receipt (80mm)</MenuItem>
                      </TextField>
                    </Stack>
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
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{isBusinessOwner ? "Business Owner Profile" : "Your profile"}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {isBusinessOwner ? "This section is for business admin details only." : "Update your personal information and contact number."}
            </Typography>
            <Grid container spacing={2} component="form" onSubmit={handleSubmitUser(onSubmitUser)}>
              {isBusinessOwner ? (
                <Grid item xs={12}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
                    <Avatar src={ownerPhotoPreview || undefined} sx={{ width: 72, height: 72 }} />
                    <Button variant="outlined" component="label">
                      Upload Owner Profile Photo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setOwnerPhotoFile(file);
                          setOwnerPhotoPreview(file ? URL.createObjectURL(file) : withCacheBust(businessData?.profileImageUrl, businessData?.updatedAt || Date.now()));
                        }}
                      />
                    </Button>
                  </Stack>
                </Grid>
              ) : null}
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Full Name" InputLabelProps={{ shrink: true }} {...registerUser("fullName")} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email" InputLabelProps={{ shrink: true }} {...registerUser("email")} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Phone Number (E.164)" InputLabelProps={{ shrink: true }} {...registerUser("phoneNumber")} />
              </Grid>
              {isBusinessOwner ? (
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Role" value="Business Admin" InputLabelProps={{ shrink: true }} InputProps={{ readOnly: true }} />
                </Grid>
              ) : null}
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
