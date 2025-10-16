"use client";

import { useState, useEffect, useMemo } from "react";
import DataTable, { Action } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Ban, Eye, Pencil, Trash2 } from "lucide-react";

import UserSerivce from "./service/users-service";
import { UserSummaryResponse } from "./types/user-summary-response";
enum InventoryPanel {
  View = "view",
  Edit = "edit",
  Disable = "disable",
  Delete = "delete",
}

type Props = {
  branchId: number;
};

export default function MainUsers({ branchId }: Props) {
  const [products, setProducts] = useState<UserSummaryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

 // const [selectedProduct, setSelectedProduct] = useState<UserSummaryResponse | null>(null);
 // const [activePanel, setActivePanel] = useState<InventoryPanel | null>(null);

  const openPanel = (panel: InventoryPanel, product: UserSummaryResponse) => {
    console.log(panel, product)
   // setSelectedProduct(product);
   // setActivePanel(panel);
  };

  const usersColumns: ColumnDef<UserSummaryResponse>[] = useMemo(() => {
    const columns: ColumnDef<UserSummaryResponse>[] = [
      { accessorKey: "fullName", header: "Nombre" },
      { accessorKey: "email", header: "Correo" },
      { accessorKey: "phoneNumber", header: "Telefono" },
      { accessorKey: "burden", header: "Cargo" },
    ];

    if (branchId === 0) {
      columns.push({
        accessorKey: "branchNames",
        header: "Disponible en",
      });
    }

    return columns;
  }, [branchId]);


  const inventoryActions: Action<UserSummaryResponse>[] = [
    {
      label: "Ver",
      type: "direct",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => openPanel(InventoryPanel.View, row),
    },
    {
      label: "Editar",
      type: "direct",
      icon: <Pencil className="w-4 h-4" />,
      onClick: (row) => openPanel(InventoryPanel.Edit, row),
    },
    {
      label: "Desactivar",
      type: "dropdown",
      icon: <Ban className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(InventoryPanel.Disable, row),
    },
    {
      label: "Eliminar",
      type: "dropdown",
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      onClick: (row) => openPanel(InventoryPanel.Delete, row),
    },
  ];

  useEffect(() => {
    fetchProducts(0, 10);
  }, [branchId]);


  const fetchProducts = async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const response = await UserSerivce.getUsers(page, pageSize, true, branchId);
      setProducts(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (searchQuery: string) => {
    console.log(searchQuery)
  };

  return (
    <div className="h-full">
      <DataTable<UserSummaryResponse>
        data={products}
        columns={usersColumns}
        actions={inventoryActions}
        fetchData={fetchProducts}
        onSearch={searchProducts}
        totalPages={totalPages}
        loading={loading}
      />
    </div>
  );
}
