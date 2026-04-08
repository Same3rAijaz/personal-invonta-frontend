import { Box, Button, Chip, Divider, Grid, MenuItem, Paper, Stack, Typography, Alert, IconButton, Tooltip } from "@mui/material";
import TextField from "../../components/CustomTextField";
import React from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { useCreateSalesReturn } from "../../hooks/useSalesReturns";
import { useToast } from "../../hooks/useToast";
import { useWarehouses } from "../../hooks/useWarehouses";
import { useProducts } from "../../hooks/useProducts";
import { api } from "../../api/client";

const DISPOSITIONS = [
  { value: "RESTOCK", label: "Restock (put back on shelf)" },
  { value: "RETURN_TO_LENDER", label: "Return to Lender (borrowed item)" },
  { value: "DAMAGED", label: "Damaged (write off)" }
];

const RETURNABLE_STATUSES = ["SHIPPED", "INVOICED"];

type ReturnItem = {
  productId: string;
  qty: number;
  maxQty: number;
  disposition: string;
  borrowOrderId?: string;
  lenderBusinessId?: string;
  agreedUnitCost?: number;
  lenderWarehouseId?: string;
};

interface SalesReturnCreateProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultSoId?: string;
}

export default function SalesReturnCreate({ onSuccess, onCancel, defaultSoId = "" }: SalesReturnCreateProps) {
  const createReturn = useCreateSalesReturn();
  const { notify } = useToast();

  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const { data: products } = useProducts({ page: 1, limit: 1000 });

  const [originalSalesOrderId, setOriginalSalesOrderId] = React.useState(defaultSoId);
  const [soInput, setSoInput] = React.useState(defaultSoId);
  const [warehouseId, setWarehouseId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [soData, setSoData] = React.useState<any>(null);
  const [loadingSo, setLoadingSo] = React.useState(false);
  const [items, setItems] = React.useState<ReturnItem[]>([]);

  const productMap = React.useMemo(
    () => new Map((products?.items || []).map((p: any) => [String(p._id), p])),
    [products?.items]
  );

  const warehouseList: any[] = warehouses?.items || [];

  const fetchSO = async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoadingSo(true);
    try {
      let so: any = null;

      // Try by ObjectId first (24 hex chars), then fall back to SO number search
      if (trimmed.length === 24 && /^[a-fA-F0-9]{24}$/.test(trimmed)) {
        const { data } = await api.get(`/sales/sos/${trimmed}`);
        so = data?.data;
      } else {
        // Search by SO number (e.g. "SO-001")
        const { data } = await api.get(`/sales/sos`, { params: { number: trimmed, limit: 1 } });
        const items = data?.data?.items || [];
        if (items.length > 0) so = items[0];
      }

      if (!so) {
        notify("Sales order not found", "error");
        setSoData(null);
        setItems([]);
        return;
      }

      setSoData(so);
      setOriginalSalesOrderId(String(so._id));
      setItems((so?.items || []).map((i: any) => ({
        productId: String(i.productId),
        qty: i.qty,           // pre-fill with full sold qty (full return by default)
        maxQty: i.qty,        // store max for capping without relying on soData in closures
        disposition: i.borrowOrderId ? "RETURN_TO_LENDER" : "RESTOCK",
        borrowOrderId: i.borrowOrderId || undefined,
        lenderBusinessId: i.lenderBusinessId || undefined,
        agreedUnitCost: i.agreedUnitCost || 0,
        lenderWarehouseId: undefined
      })));
    } catch {
      setSoData(null);
      setItems([]);
      notify("Sales order not found", "error");
    } finally {
      setLoadingSo(false);
    }
  };

  React.useEffect(() => {
    if (defaultSoId) fetchSO(defaultSoId);
  }, []);

  const updateItem = (idx: number, field: string, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!originalSalesOrderId) { notify("Enter the original Sales Order ID or number", "error"); return; }
    if (!warehouseId) { notify("Select a warehouse", "error"); return; }

    if (soData && !RETURNABLE_STATUSES.includes(soData.status)) {
      notify(`Cannot return a ${soData.status} order. Only SHIPPED or INVOICED orders can be returned.`, "error");
      return;
    }

    const validItems = items
      .filter((i) => Number(i.qty) > 0)
      .map((i) => ({ ...i, qty: Number(i.qty) }));

    if (validItems.length === 0) { notify("Enter at least one return quantity", "error"); return; }

    for (const item of validItems) {
      if (item.disposition === "RETURN_TO_LENDER" && !item.lenderWarehouseId) {
        const product = productMap.get(item.productId) as any;
        notify(`Select a lender warehouse for ${product?.name || item.productId}`, "error");
        return;
      }
    }

    try {
      await createReturn.mutateAsync({
        originalSalesOrderId,
        warehouseId,
        notes: notes || undefined,
        items: validItems
      });
      notify("Sales return processed", "success");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      notify(err?.response?.data?.message || err?.response?.data?.error?.message || "Failed to process return", "error");
    }
  };

  const soStatusColor = (status: string) => {
    if (status === "SHIPPED" || status === "INVOICED") return "success";
    if (status === "CONFIRMED") return "info";
    if (status === "DRAFT") return "default";
    return "warning";
  };

  return (
    <SidebarLayout title="Create Sales Return" onCancel={onCancel} isSubmitting={createReturn.isPending} submitLabel="Process Return" onSubmit={handleSubmit}>
      <Grid container spacing={2}>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Sales Order ID or Number *"
            value={soInput}
            onChange={(e) => setSoInput(e.target.value)}
            onBlur={() => fetchSO(soInput)}
            onKeyDown={(e) => { if (e.key === "Enter") fetchSO(soInput); }}
            helperText={
              loadingSo
                ? "Loading..."
                : soData
                ? `SO ${soData.number} loaded`
                : "Enter the SO ID or number (e.g. SO-001), then press Enter or click away"
            }
          />
          {soData && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Chip
                label={`Status: ${soData.status}`}
                size="small"
                color={soStatusColor(soData.status) as any}
              />
              {!RETURNABLE_STATUSES.includes(soData.status) && (
                <Alert severity="warning" sx={{ py: 0, px: 1, flex: 1 }}>
                  Only SHIPPED or INVOICED orders can be returned.
                </Alert>
              )}
            </Stack>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Return to Warehouse *"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            {warehouseList.map((w: any) => (
              <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField fullWidth label="Notes" multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Grid>

        {soData && (
          <>
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={600}>Return Items</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" onClick={() => setItems((prev) => prev.map((i) => ({ ...i, qty: i.maxQty })))}>
                    Return All
                  </Button>
                  <Button size="small" variant="outlined" color="inherit" onClick={() => setItems((prev) => prev.map((i) => ({ ...i, qty: 0 })))}>
                    Clear All
                  </Button>
                </Stack>
              </Stack>
              {items.some((i) => i.borrowOrderId) && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Some items were borrowed from another shop. Choose "Return to Lender" for those and select the lender's warehouse.
                </Alert>
              )}
            </Grid>

            {items.map((item, idx) => {
              const product = productMap.get(item.productId) as any;
              return (
                <Grid item xs={12} key={idx}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Box>
                        <Typography fontWeight={600}>{product?.name || item.productId}</Typography>
                        {item.borrowOrderId && (
                          <Chip label="Borrowed Product" size="small" color="warning" sx={{ mt: 0.5 }} />
                        )}
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">Sold: {item.maxQty}</Typography>
                        <Tooltip title="Return all">
                          <Button size="small" onClick={() => updateItem(idx, "qty", item.maxQty)} sx={{ minWidth: 0, px: 1 }}>All</Button>
                        </Tooltip>
                        <Tooltip title="Remove from return">
                          <Button size="small" color="inherit" onClick={() => updateItem(idx, "qty", 0)} sx={{ minWidth: 0, px: 1 }}>None</Button>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          label="Return Qty"
                          type="number"
                          size="small"
                          value={item.qty}
                          helperText={`max: ${item.maxQty}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              updateItem(idx, "qty", 0);
                            } else {
                              updateItem(idx, "qty", Math.min(Math.max(0, Number(val)), item.maxQty));
                            }
                          }}
                          inputProps={{ min: 0, max: item.maxQty }}
                        />
                      </Grid>
                      <Grid item xs={6} md={4}>
                        <TextField
                          select
                          fullWidth
                          label="Disposition"
                          size="small"
                          value={item.disposition}
                          onChange={(e) => updateItem(idx, "disposition", e.target.value)}
                        >
                          {DISPOSITIONS.map((d) => (
                            <MenuItem key={d.value} value={d.value}
                              disabled={d.value === "RETURN_TO_LENDER" && !item.borrowOrderId}
                            >
                              {d.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      {item.disposition === "RETURN_TO_LENDER" && (
                        <Grid item xs={12} md={6}>
                          <TextField
                            select
                            fullWidth
                            label="Lender Warehouse *"
                            size="small"
                            value={item.lenderWarehouseId || ""}
                            onChange={(e) => updateItem(idx, "lenderWarehouseId", e.target.value)}
                            helperText="Select the lender's warehouse to return stock to"
                          >
                            {warehouseList.map((w: any) => (
                              <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              );
            })}
          </>
        )}

      </Grid>
    </SidebarLayout>
  );
}
