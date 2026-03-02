import React from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import { useCreateParty, useParties } from "../../hooks/useUdhaar";
import { useCustomers } from "../../hooks/useCustomers";
import { useVendors } from "../../hooks/useVendors";

const partyTypes = ["CUSTOMER", "VENDOR", "BOTH", "OTHER"];

export default function UdhaarParties() {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>({ partyType: "CUSTOMER", displayName: "" });
  const [selectedSourceId, setSelectedSourceId] = React.useState("");
  const { data, isLoading } = useParties({ search });
  const { data: customersData } = useCustomers();
  const { data: vendorsData } = useVendors();
  const createParty = useCreateParty();

  const columns = [
    { key: "displayName", label: "Name", render: (row: any) => <Link to={`/udhaar/parties/${row.id}`}>{row.displayName}</Link> },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "balance", label: "Balance" },
    { key: "status", label: "Status" }
  ];

  const rows = (data?.items || []).map((row: any) => ({
    ...row,
    id: row.id || row._id
  }));

  const customers = customersData?.items || [];
  const vendors = vendorsData?.items || [];

  const handleSubmit = async () => {
    await createParty.mutateAsync(form);
    setOpen(false);
    setSelectedSourceId("");
    setForm({ partyType: "CUSTOMER", displayName: "" });
  };

  return (
    <Box>
      <PageHeader title="Udhaar Parties" actionLabel="Add Party" onAction={() => setOpen(true)} />
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField size="small" placeholder="Search by name/phone/email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Box>
      <DataTable columns={columns} rows={rows} loading={isLoading} />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Party</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          <TextField
            label="Display Name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <TextField
            select
            label="Party Type"
            value={form.partyType}
            onChange={(e) => {
              const partyType = e.target.value;
              setSelectedSourceId("");
              setForm((prev: any) => {
                const metadata = { ...(prev.metadata || {}) };
                delete metadata.sourceType;
                delete metadata.sourceId;
                return { ...prev, partyType, metadata };
              });
            }}
          >
            {partyTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          {form.partyType === "CUSTOMER" ? (
            <TextField
              select
              label="Select Customer"
              value={selectedSourceId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedSourceId(id);
                const customer = customers.find((row: any) => row._id === id);
                if (!customer) return;
                setForm((prev: any) => ({
                  ...prev,
                  displayName: customer.name || prev.displayName,
                  email: customer.email || "",
                  phone: customer.phone || "",
                  address: customer.address || "",
                  metadata: { ...(prev.metadata || {}), sourceType: "CUSTOMER", sourceId: customer._id }
                }));
              }}
            >
              {customers.map((row: any) => (
                <MenuItem key={row._id} value={row._id}>{row.name}</MenuItem>
              ))}
            </TextField>
          ) : null}
          {form.partyType === "VENDOR" ? (
            <TextField
              select
              label="Select Vendor"
              value={selectedSourceId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedSourceId(id);
                const vendor = vendors.find((row: any) => row._id === id);
                if (!vendor) return;
                setForm((prev: any) => ({
                  ...prev,
                  displayName: vendor.name || prev.displayName,
                  email: vendor.email || "",
                  phone: vendor.phone || "",
                  address: vendor.address || "",
                  metadata: { ...(prev.metadata || {}), sourceType: "VENDOR", sourceId: vendor._id }
                }));
              }}
            >
              {vendors.map((row: any) => (
                <MenuItem key={row._id} value={row._id}>{row.name}</MenuItem>
              ))}
            </TextField>
          ) : null}
          {form.partyType === "OTHER" ? (
            <TextField
              select
              label="Party Category"
              value={form.metadata?.category || ""}
              onChange={(e) => setForm((prev: any) => ({ ...prev, metadata: { ...(prev.metadata || {}), category: e.target.value } }))}
            >
              {["Friend", "Family", "Other"].map((value) => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              ))}
            </TextField>
          ) : null}
          <TextField label="Phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="Email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Opening Balance" type="number" value={form.openingBalance || ""} onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })} />
          <TextField label="Opening Balance Date" type="date" InputLabelProps={{ shrink: true }} value={form.openingBalanceDate || ""} onChange={(e) => setForm({ ...form, openingBalanceDate: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={createParty.isPending}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
