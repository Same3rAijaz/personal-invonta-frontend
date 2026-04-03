import React from "react";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

export default function OrderItemsTable({
  items,
  labelByProductId
}: {
  items?: any[];
  labelByProductId?: Map<string, string>;
}) {
  const normalizedItems = items || [];

  if (normalizedItems.length === 0) {
    return <Typography variant="body2" color="text.secondary">No items</Typography>;
  }

  return (
    <Box sx={{ minWidth: 280, maxWidth: 420, whiteSpace: "normal" }}>
      <Table size="small" sx={{ "& td, & th": { borderBottom: "1px solid rgba(148,163,184,0.16)" } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, py: 0.75 }}>Product</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, py: 0.75 }}>Qty</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {normalizedItems.map((item: any, index: number) => {
            const productId = String(item.productId || "");
            const productName = labelByProductId?.get(productId) || item.productName || productId || `Item ${index + 1}`;
            return (
              <TableRow key={`${productId || "item"}-${index}`}>
                <TableCell sx={{ py: 0.75, whiteSpace: "normal" }}>{productName}</TableCell>
                <TableCell align="right" sx={{ py: 0.75 }}>{Number(item.qty || 0)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
