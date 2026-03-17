import React from "react";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useToast } from "../../hooks/useToast";
import { useCities, useCountries, useStates } from "../../hooks/useGeo";
import { DEFAULT_CITY, DEFAULT_COUNTRY, DEFAULT_STATE } from "../../constants/locationDefaults";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import RowActionMenu from "../../components/RowActionMenu";

const REQUEST_MARKET_VALUE = "__REQUEST_MARKET__";

export default function ShopRequests() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const { notify } = useToast();
  const client = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["shop-requests", page, rowsPerPage, debouncedSearch],
    queryFn: async () =>
      (
        await api.get("/superadmin/requests", {
          params: { page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined }
        })
      ).data.data
  });
  const { data: markets } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => (await api.get("/superadmin/markets", { params: { page: 1, limit: 1000 } })).data.data
  });
  const approve = useMutation({
    mutationFn: async (payload: any) => (await api.patch(`/superadmin/requests/${payload.id}/approve`, payload.body || {})).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["shop-requests"] })
  });
  const updateRequest = useMutation({
    mutationFn: async (payload: { id: string; body: any }) =>
      (await api.patch(`/superadmin/requests/${payload.id}`, payload.body)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["shop-requests"] })
  });
  const reject = useMutation({
    mutationFn: async (payload: { id: string; reason?: string }) =>
      (await api.patch(`/superadmin/requests/${payload.id}/reject`, { reason: payload.reason })).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["shop-requests"] })
  });

  const [rejectDialog, setRejectDialog] = React.useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [rejectReason, setRejectReason] = React.useState("");
  const [editDialog, setEditDialog] = React.useState<{ open: boolean; row: any | null }>({ open: false, row: null });
  const [editValues, setEditValues] = React.useState<any>({});
  const { data: countryOptions = [] } = useCountries();
  const { data: stateOptions = [] } = useStates(editValues.country);
  const { data: cityOptions = [] } = useCities(editValues.country, editValues.state);

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const handleApprove = async (row: any) => {
    try {
      await approve.mutateAsync({
        id: row._id,
        body: {
          marketId: row.marketId?._id || row.marketId || undefined,
          marketName: row.marketName || undefined,
          country: row.country || DEFAULT_COUNTRY,
          state: row.state || DEFAULT_STATE,
          city: row.city || DEFAULT_CITY
        }
      });
      notify("Request approved", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.id) return;
    try {
      await reject.mutateAsync({ id: rejectDialog.id, reason: rejectReason || undefined });
      notify("Request rejected", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    } finally {
      setRejectDialog({ open: false, id: null });
      setRejectReason("");
    }
  };

  const rows = (data?.items || []).map((row: any) => ({
    ...row,
    modulesText: (row.requestedModules || []).join(", "),
    marketText: row.marketId?.name || row.marketName || "-",
    locationText: [row.country, row.state, row.city].filter(Boolean).join(", ") || "-",
    marketRequestType: row.marketId ? "Existing Market" : row.marketName ? "Requested New Market" : "-"
  }));

  return (
    <Box>
      <PageHeader title="Approval Requests" />
      <DataTable
        columns={[
          { key: "businessName", label: "Business" },
          { key: "marketText", label: "Market" },
          {
            key: "marketRequestType",
            label: "Market Source",
            render: (row: any) => {
              if (row.marketRequestType === "Requested New Market") {
                return <Chip size="small" color="warning" label="Requested New Market" />;
              }
              if (row.marketRequestType === "Existing Market") {
                return <Chip size="small" color="success" label="Existing Market" />;
              }
              return <Chip size="small" variant="outlined" label="Missing" />;
            }
          },
          { key: "locationText", label: "Location" },
          { key: "adminEmail", label: "Admin Email" },
          { key: "modulesText", label: "Requested Modules" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <RowActionMenu
                actions={[
                  {
                    label: "Edit",
                    disabled: row.status !== "PENDING",
                    onClick: () => {
                      setEditDialog({ open: true, row });
                      setEditValues({
                        marketId: row.marketId?._id || row.marketId || REQUEST_MARKET_VALUE,
                        marketName: row.marketName || "",
                        country: row.country || DEFAULT_COUNTRY,
                        state: row.state || DEFAULT_STATE,
                        city: row.city || DEFAULT_CITY
                      });
                    }
                  },
                  { label: "Approve", disabled: row.status !== "PENDING", onClick: () => handleApprove(row) },
                  {
                    label: "Reject",
                    danger: true,
                    disabled: row.status !== "PENDING",
                    onClick: () => setRejectDialog({ open: true, id: row._id })
                  }
                ]}
              />
            )
          }
        ]}
        rows={rows}
        loading={isLoading}
        actions={
          <TextField
            size="small"
            placeholder="Search requests"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ minWidth: 240 }}
          />
        }
        page={page}
        rowsPerPage={rowsPerPage}
        total={data?.total || 0}
        onPageChange={setPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
      />

      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, id: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, row: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Request Market & Location</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Market"
            value={editValues.marketId || REQUEST_MARKET_VALUE}
            onChange={(e) =>
              setEditValues((prev: any) => ({
                ...prev,
                marketId: e.target.value,
                marketName: e.target.value === REQUEST_MARKET_VALUE ? prev.marketName : ""
              }))
            }
            sx={{ mt: 1 }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (value) => {
                if (!value || value === REQUEST_MARKET_VALUE) return "Not listed / create from name";
                const match = (markets?.items || []).find((m: any) => String(m._id) === String(value));
                return match?.name || "Not listed / create from name";
              }
            }}
          >
            <MenuItem value={REQUEST_MARKET_VALUE}>Not listed / create from name</MenuItem>
            {(markets?.items || []).map((m: any) => (
              <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>
            ))}
          </TextField>
          {(editValues.marketId || REQUEST_MARKET_VALUE) === REQUEST_MARKET_VALUE ? (
            <TextField
              fullWidth
              label="Market Name"
              value={editValues.marketName || ""}
              onChange={(e) => setEditValues((prev: any) => ({ ...prev, marketName: e.target.value }))}
              sx={{ mt: 2 }}
            />
          ) : null}
          <TextField
            select
            fullWidth
            label="Country"
            value={editValues.country || ""}
            onChange={(e) => setEditValues((prev: any) => ({ ...prev, country: e.target.value, state: "", city: "" }))}
            sx={{ mt: 2 }}
          >
            <MenuItem value="">Select Country</MenuItem>
            {countryOptions.map((item: string) => (
              <MenuItem key={item} value={item}>{item}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="State"
            value={editValues.state || ""}
            onChange={(e) => setEditValues((prev: any) => ({ ...prev, state: e.target.value, city: "" }))}
            sx={{ mt: 2 }}
            disabled={!editValues.country}
          >
            <MenuItem value="">Select State</MenuItem>
            {stateOptions.map((item: string) => (
              <MenuItem key={item} value={item}>{item}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="City"
            value={editValues.city || ""}
            onChange={(e) => setEditValues((prev: any) => ({ ...prev, city: e.target.value }))}
            sx={{ mt: 2 }}
            disabled={!editValues.country || !editValues.state}
          >
            <MenuItem value="">Select City</MenuItem>
            {cityOptions.map((item: string) => (
              <MenuItem key={item} value={item}>{item}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, row: null })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!editDialog.row?._id) return;
              try {
                const marketIdRaw = String(editValues.marketId || REQUEST_MARKET_VALUE).trim();
                const marketId = marketIdRaw === REQUEST_MARKET_VALUE ? undefined : marketIdRaw;
                const marketName = marketId ? undefined : String(editValues.marketName || "").trim() || undefined;
                await updateRequest.mutateAsync({
                  id: editDialog.row._id,
                  body: {
                    ...editValues,
                    marketId,
                    marketName
                  }
                });
                notify("Request updated", "success");
                setEditDialog({ open: false, row: null });
              } catch (err: any) {
                notify(err?.response?.data?.error?.message || "Failed", "error");
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
