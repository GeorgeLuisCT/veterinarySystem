"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { SaleData } from "./sale-data";
import SearchItemsSales, { SearchItemsSalesRef } from "./search-items-sales";
import SalesHeader from "./sales-header";
import { Button } from "@/components/ui/button";

import { X } from "lucide-react";
import { ItemType } from "../types/item-type";
import React from "react";
import { SaleProductForm } from "../form/sale-product-form";
import { useUser } from "@/context/user-context";
import { toRequestSaleProduct } from "../helpers/sale-vet-product-mapper";
import { SaleRequest } from "../types/sale-request";
import SaleService from "../service/sale-service";
import { toast } from "sonner";
import { SaleStatus } from "../enums/sale-status";
import { SaleState, useSales } from "../context/sales-context-type";
import SkeletonSale from "./skeleton-sale";

export default function MainSales() {

  const searchRef = React.useRef<SearchItemsSalesRef>(null);

  const { userInfo } = useUser();

  const { sales, activeSaleId, setActiveSaleId, addNewSale, removeSale, isLoaded } = useSales();

  const [editingItem, setEditingItem] = React.useState<{
    type: ItemType;
    id: number;
    uid?: string;
  } | null>(null);

  const openForm = (type: ItemType, id: number, uid?: string) => {
    setEditingItem({ type, id, uid });
  };

  const handleAddTab = () => {
    const newId = `venta-${Date.now()}`;
    addNewSale(newId);
  };

  function getSaleLabel(id: string, sale: SaleState, index: number): string {
    const version = `v${index + 1}`;
    return sale.customer?.name ? `${sale.customer.name} - ${version}` : `Nueva venta ${index + 1}`;
  }
  const handleSaveSale = async () => {
    const currentSale = sales[activeSaleId];

    console.log("Guardando venta:", currentSale);
    if (!currentSale) {
      console.error("No hay venta activa para guardar");
      return;
    }

    try {
      const saleRequest: SaleRequest = {
        customerId: currentSale.customer?.id ?? undefined,
        saleProducts: currentSale.saleProducts.map(toRequestSaleProduct),
        salePayments: currentSale.payments ?? [],
        status: currentSale.status ?? SaleStatus.PENDING,
      };

      console.log("Venta lista para enviar:", saleRequest);

      await SaleService.createSale(saleRequest);
      toast.success("Venta guardada con éxito");

      const newActiveId = removeSale(activeSaleId);
      if (newActiveId) {
        setActiveSaleId(newActiveId);
      }

    } catch (error) {
      console.error("Error al procesar o enviar la venta:", error);
      toast.error("No se pudo guardar la venta");
    }
  };

  if (!isLoaded) {
    return <SkeletonSale />;
  }

  return (
    <div className="flex flex-col w-full h-full">
      <Tabs value={activeSaleId} onValueChange={setActiveSaleId} className="w-full">
        <TabsList className="flex space-x-2">
          {Object.entries(sales).map(([id, sale], index) => (
            <TabsTrigger key={id} value={id} className="flex items-center space-x-1 group">
              <span>{getSaleLabel(id, sale, index)}</span>
              {Object.keys(sales).length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSale(id);
                  }}
                  className="ml-1 text-red-500 hover:text-red-700 opacity-70 group-hover:opacity-100 cursor-pointer"
                  title="Cerrar venta"
                >
                  <X className="w-4 h-4" />
                </span>
              )}
            </TabsTrigger>
          ))}
          <Button variant="ghost" size="sm" onClick={handleAddTab}>
            + Nueva venta
          </Button>
        </TabsList>

        {Object.keys(sales).map((saleId) => (
          <TabsContent key={saleId} value={saleId} className="w-full h-full">
            <div className="flex flex-col gap-4 w-full p-2">
              <SalesHeader />
              <div className="w-full flex-1 rounded-xl flex flex-col md:flex-row gap-4">
                <div className="w-full flex flex-col gap-4">
                  <SearchItemsSales
                    ref={searchRef}
                    branchId={userInfo?.selectedBranch?.id}
                    onSelectItem={openForm} />
                  <CardContent>
                    <SaleData onEditItem={openForm} />
                  </CardContent>
                </div>
              </div>

              <div className="flex justify-center">
                <Button className="ml-2 cursor-pointer px-8" type="submit"
                  onClick={handleSaveSale}>
                  Registrar venta
                </Button>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {editingItem?.type === ItemType.PRODUCT && (
        <SaleProductForm
          open={!!editingItem}
          onOpenChange={() => setEditingItem(null)}
          productId={editingItem.id}
          animalOptions={sales[activeSaleId]?.animals ?? []}
          uid={editingItem.uid}
          onClearSearch={() => searchRef.current?.clear()}
        />
      )}
    </div>
  );
}

