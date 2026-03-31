import {
  Box, Button, Chip, Divider, Grid, MenuItem,
  Paper, Stack, TextField, Typography, Alert
} from "@mui/material";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

type ReturnItem = {
  productId: string;
  qty: number;
  disposition: string;
  borrowOrderId?: string;
  lenderBusinessId?: string;
  agreedUnitCost?: number;
  lenderWarehouseId?: string;
};

export default function SalesReturnCreate() {
  const createReturn = useCreateSalesReturn();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultSoId = searchParams.get("soId") || "";

  const { data: warehouses } = useWarehouses({ page: 1, limit: 1000 });
  const { data: products } = useProducts({ page: 1, limit: 1000 });

  const [originalSalesOrderId, setOriginalSalesOrderId] = React.useState(defaultSoId);
  const [warehouseId, setWarehouseId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [soData, setSoData] = React.useState<any>(null);
  const [loadingSo, setLoadingSo] = React.useState(false);
  const [items, setItems] = React.useState<ReturnItem[]>([]);

  const productMap = React.useMemo(
    () => new Map((products?.items || []).map((p: any) => [String(p._id), p])),
    [products?.items]
  );

  const fetchSO = async (id: string) => {
    if (!id || id.length !== 24) return;
    setLoadingSo(true);
    try {
      const { data } = await api.get(`/sales/sos/${id}`);
      const so = data?.data;
      setSoData(so);
      setItems((so?.items || []).map((i: any) => ({
        productId: String(i.productId),
        qty: 0,
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
    if (!originalSalesOrderId) { notify("Enter the original Sales Order ID", "error"); return; }
    if (!warehouseId) { notify("Select a warehouse", "error"); return; }
    const validItems = items.filter((i) => i.qty > 0);
    if (validItems.length === 0) { notify("Enter at least one return quantity", "error"); return; }

    for (const item of validItems) {
      if (item.disposition === "RETURN_TO_LENDER" && !item.lenderWarehouseId) {
        notify(`Enter lender warehouse ID for ${productMap.get(item.productId)?.name || item.productId}`, "error");
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
      navigate("/sales/returns");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Create Sales Return</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <Grid container spacing={2}>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Original Sales Order ID *"
              value={originalSalesOrderId}
              onChange={(e) => setOriginalSalesOrderId(e.target.value)}
              onBlur={() => fetchSO(originalSalesOrderId)}
              helperText={loadingSo ? "Loading SO..." : soData ? `SO ${soData.number} loaded` : "Enter the SO ID then click away"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Return to Warehouse *"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              {(warehouses?.items || []).map((w: any) => (
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
                <Typography variant="subtitle1" fontWeight={600}>Return Items</Typography>
                {items.some((i) => i.borrowOrderId) && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Some items were borrowed from another shop. Choose "Return to Lender" for those.
                  </Alert>
                )}
              </Grid>

              {items.map((item, idx) => {
                const product = productMap.get(item.productId);
                const soItem = soData?.items?.[idx];
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
                        <Typography variant="body2" color="text.secondary">Sold: {soItem?.qty}</Typography>
                      </Stack>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={2}>
                          <TextField
                            fullWidth
                            label={`Qty (max ${soItem?.qty || 0})`}
                            type="number"
                            size="small"
                            value={item.qty}
                            onChange={(e) => updateItem(idx, "qty", Math.min(Number(e.target.value), soItem?.qty || 0))}
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
                              fullWidth
                              label="Lender Warehouse ID *"
                              size="small"
                              value={item.lenderWarehouseId || ""}
                              onChange={(e) => updateItem(idx, "lenderWarehouseId", e.target.value)}
                              helperText="The lender's warehouse ID to return stock to"
                            />
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                );
              })}
            </>
          )}

          <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              sx={{ py: 1.4, fontWeight: 700 }}
              onClick={handleSubmit}
              disabled={createReturn.isPending || !soData}
            >
              Process Return
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
