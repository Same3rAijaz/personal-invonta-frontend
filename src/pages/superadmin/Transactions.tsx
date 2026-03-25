import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Typography, TextField, Chip, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useState } from "react";

export default function Transactions() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-transactions", page, rowsPerPage, search],
    queryFn: async () => {
      const params: any = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      return (await api.get("/superadmin/subscriptions/transactions", { params })).data.data;
    }
  });

  const items = data?.items || [];
  const total = data?.total || 0;

  const getStatusChip = (status: string) => {
    const map: Record<string, { color: "success" | "error" | "warning" | "default"; label: string }> = {
      paid: { color: "success", label: "Paid" },
      failed: { color: "error", label: "Failed" },
      pending: { color: "warning", label: "Pending" }
    };
    const config = map[status] || { color: "default" as const, label: status };
    return <Chip size="small" color={config.color} label={config.label} />;
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Transaction Ledger</Typography>
        <TextField
          size="small"
          placeholder="Search by shop name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
          }}
          sx={{ minWidth: 260, "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Shop</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Paid At</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "#94a3b8" }}>Loading...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "#94a3b8" }}>No transactions found</TableCell></TableRow>
            ) : (
              items.map((tx: any) => (
                <TableRow key={tx._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {typeof tx.businessId === "object" ? tx.businessId?.name : tx.businessId}
                    </Typography>
                    {typeof tx.businessId === "object" && tx.businessId?.contactPhone && (
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>{tx.businessId.contactPhone}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₨{tx.amount?.toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(tx.status)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>{tx.description || "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString() : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </TableContainer>
    </Box>
  );
}
