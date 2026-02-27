import { Box, Button, TextField } from "@mui/material";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export default function Markets() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const navigate = useNavigate();
  const client = useQueryClient();
  const { notify } = useToast();
  const { data } = useQuery({
    queryKey: ["markets", page, rowsPerPage, debouncedSearch],
    queryFn: async () =>
      (
        await api.get("/superadmin/markets", {
          params: { page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined }
        })
      ).data.data
  });
  const deleteMarket = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/superadmin/markets/${id}`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["markets"] })
  });

  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this market?")) return;
    try {
      await deleteMarket.mutateAsync(id);
      notify("Market deleted", "success");
    } catch (err: any) {
      notify(err?.response?.data?.error?.message || "Failed", "error");
    }
  };

  return (
    <Box>
      <PageHeader title="Markets" actionLabel="Create Market" onAction={() => navigate("/superadmin/markets/new")} />
      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "city", label: "City" },
          { key: "state", label: "State" },
          { key: "isActive", label: "Active" },
          {
            key: "actions",
            label: "Actions",
            render: (row: any) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" onClick={() => navigate(`/superadmin/markets/${row._id}/edit`)}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(row._id)}>
                  Delete
                </Button>
              </Box>
            )
          }
        ]}
        rows={data?.items || []}
        actions={
          <TextField
            size="small"
            placeholder="Search markets"
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
    </Box>
  );
}
