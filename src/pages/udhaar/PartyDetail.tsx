import React from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useCreateEntry, useEntries, useParty, useStatement, useUpdateParty, useVoidEntry } from "../../hooks/useUdhaar";

const entryTypes = ["CREDIT", "DEBIT", "ADJUSTMENT", "REFUND"];
const paymentMethods = ["CASH", "BANK", "CARD", "UPI", "OTHER"];

export default function PartyDetail() {
  const { id } = useParams();
  const partyId = id || "";
  const { data: party } = useParty(partyId);
  const { data: entries } = useEntries({ partyId });
  const { data: statement } = useStatement(partyId, { includeOpeningBalance: "true" });
  const createEntry = useCreateEntry();
  const voidEntry = useVoidEntry();
  const updateParty = useUpdateParty();

  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>({ entryType: "CREDIT", amount: "", entryDate: new Date().toISOString().slice(0, 10) });
  const [editForm, setEditForm] = React.useState<any>({});

  React.useEffect(() => {
    if (party) {
      setEditForm({
        displayName: party.displayName || "",
        partyType: party.partyType || "CUSTOMER",
        phone: party.phone || "",
        email: party.email || "",
        address: party.address || "",
        city: party.city || "",
        country: party.country || "",
        notes: party.notes || "",
        creditLimit: party.creditLimit || "",
        status: party.status || "ACTIVE"
      });
    }
  }, [party]);

  const columns = [
    { key: "entryDate", label: "Date", render: (row: any) => new Date(row.entryDate).toLocaleDateString() },
    { key: "entryType", label: "Type" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", render: (row: any) => (
      <Button size="small" onClick={() => voidEntry.mutate({ id: row.id, reason: "User requested" })} disabled={row.status === "VOID"}>Void</Button>
    ) }
  ];

  const rows = (entries?.items || []).map((row: any) => ({
    ...row,
    id: row.id || row._id
  }));

  const handleUpdateParty = async () => {
    await updateParty.mutateAsync({ id: partyId, payload: editForm });
    setEditOpen(false);
  };

  const handleCreate = async () => {
    await createEntry.mutateAsync({ payload: { ...form, partyId, amount: Number(form.amount) } });
    setOpen(false);
    setForm({ entryType: "CREDIT", amount: "", entryDate: new Date().toISOString().slice(0, 10) });
  };

  const handleExportCsv = () => {
    if (!statement?.entries) return;
    const header = ["Date", "Type", "Amount", "RunningBalance"];
    const lines = statement.entries.map((row: any) => [
      new Date(row.entryDate).toISOString().slice(0, 10),
      row.entryType,
      row.amount,
      row.runningBalance
    ].join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${party?.displayName || "statement"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!partyId) {
    return <Typography>Missing party.</Typography>;
  }

  return (
    <Box>
      <PageHeader title={party?.displayName || "Party"} actionLabel="Add Entry" onAction={() => setOpen(true)} />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
            <Typography variant="overline">Balance</Typography>
            <Typography variant="h6">{party?.balance ?? 0}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
            <Typography variant="overline">Total Credit</Typography>
            <Typography variant="h6">{party?.summary?.totalCredit ?? 0}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
            <Typography variant="overline">Total Debit</Typography>
            <Typography variant="h6">{party?.summary?.totalDebit ?? 0}</Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button variant="outlined" onClick={handleExportCsv}>Export Statement CSV</Button>
        <Button variant="outlined" onClick={() => setEditOpen(true)}>Edit Party</Button>
      </Box>

      <DataTable columns={columns} rows={rows} />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Entry</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          <TextField
            select
            label="Entry Type"
            value={form.entryType}
            onChange={(e) => setForm({ ...form, entryType: e.target.value })}
          >
            {entryTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <TextField label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <TextField label="Entry Date" type="date" InputLabelProps={{ shrink: true }} value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} />
          {form.entryType === "DEBIT" ? (
            <TextField select label="Payment Method" value={form.paymentMethod || ""} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              {paymentMethods.map((method) => (
                <MenuItem key={method} value={method}>{method}</MenuItem>
              ))}
            </TextField>
          ) : null}
          <TextField label="Note" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createEntry.isPending}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Party</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          <TextField label="Display Name" value={editForm.displayName || ""} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} />
          <TextField select label="Party Type" value={editForm.partyType || "CUSTOMER"} onChange={(e) => setEditForm({ ...editForm, partyType: e.target.value })}>
            {["CUSTOMER", "VENDOR", "BOTH", "OTHER"].map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <TextField label="Phone" value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <TextField label="Email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <TextField label="Address" value={editForm.address || ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
          <TextField label="City" value={editForm.city || ""} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
          <TextField label="Country" value={editForm.country || ""} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
          <TextField label="Notes" value={editForm.notes || ""} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
          <TextField label="Credit Limit" type="number" value={editForm.creditLimit || ""} onChange={(e) => setEditForm({ ...editForm, creditLimit: Number(e.target.value) })} />
          <TextField select label="Status" value={editForm.status || "ACTIVE"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
            {["ACTIVE", "ARCHIVED"].map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateParty} disabled={updateParty.isPending}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
