"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/user-context";
import { PlusCircle, History } from "lucide-react";
import InventoryMovementForm from "../../../_components/inventory-movement-form";
import MainInventoryMovements from "../components/main-inventory-movements";
import { InventoryMovementType } from "../../../_enums/inventory-movement-type";

export default function InventoryPurchasePage() {
  const { userInfo } = useUser();
  const branchId = userInfo?.selectedBranch?.id ?? 0;

  return (
    <div className="w-full h-full">
      <Tabs defaultValue="form" className="h-full">
        <div className="flex items-center">
          <TabsList className="flex space-x-2">
            <TabsTrigger value="form" className="flex items-center space-x-1">
              <PlusCircle className="w-4 h-4" />
              <span>Nueva</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center space-x-1">
              <History className="w-4 h-4" />
              <span>Historial</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="form">
          <InventoryMovementForm 
           allowedTypes={[InventoryMovementType.PURCHASE]}
           label="Compra"
          />
        </TabsContent>

        <TabsContent value="data">
          <MainInventoryMovements
            branchId={branchId}
            types={[InventoryMovementType.PURCHASE]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
