import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import PageHeader from "../../components/PageHeader";
import { useAgingReport, useReceivablesReport } from "../../hooks/useUdhaar";

export default function UdhaarReports() {
  const { data: receivables } = useReceivablesReport({});
  const { data: aging } = useAgingReport({});

  return (
    <Box>
      <PageHeader title="Udhaar Reports" />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
            <Typography variant="overline">Total Receivable</Typography>
            <Typography variant="h6">{receivables?.totalReceivable ?? 0}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
            <Typography variant="overline">Total Payable</Typography>
            <Typography variant="h6">{receivables?.totalPayable ?? 0}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
            <Typography variant="overline">Net</Typography>
            <Typography variant="h6">{receivables?.net ?? 0}</Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Aging</Typography>
        {aging?.buckets ? (
          <Box sx={{ display: "grid", gap: 1 }}>
            {Object.entries(aging.buckets).map(([label, value]) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography>{label} days</Typography>
                <Typography>{value as any}</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2">No aging data.</Typography>
        )}
      </Box>
    </Box>
  );
}
