import { Box, Button, Paper, Typography, Grid, TextField } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useReferralSettings, useUpdateReferralSettings } from "../../hooks/useReferrals";
import { useToast } from "../../hooks/useToast";

type FormValues = {
  percent: number;
};

export default function ReferralSettings() {
  const { data } = useReferralSettings();
  const updateSettings = useUpdateReferralSettings();
  const { notify } = useToast();
  const { register, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: { percent: 0 }
  });

  useEffect(() => {
    if (data?.percent !== undefined) {
      setValue("percent", Number(data.percent));
    }
  }, [data, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      await updateSettings.mutateAsync({ percent: Number(values.percent) });
      notify("Referral percent updated", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Update failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Referral Settings</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Referral Percent"
              type="number"
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              {...register("percent", { valueAsNumber: true })}
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" sx={{ py: 1.2, fontWeight: 700 }}>
              Save Settings
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
