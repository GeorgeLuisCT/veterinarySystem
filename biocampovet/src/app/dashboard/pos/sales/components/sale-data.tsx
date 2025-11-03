import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useSales } from "../context/sales-context-type";
import { ItemType, getItemTypeLabel } from "../types/item-type";
import { EmployeeSummaryResponse } from "@/app/dashboard/staff/employees/types/employee-summary-response";
import { SaleStatus, SaleStatusLabels } from "../enums/sale-status";
import { getProductUnitTypeLabelByQuantity, ProductUnitType } from "../../../inventory/_enums/product-unit-type";

type BaseItem = {
  uid: string;
  type: ItemType;
  animal?: string;
  name: string;
  quantity: number;
  price: number;
  discount: number;
};

type UsedProductDisplay = {
  name: string;
  quantity: number;
  unit: ProductUnitType;
};

type ProductItem = BaseItem & { type: ItemType.PRODUCT };


type CombinedItem = ProductItem;

export function SaleData({ onEditItem }: { onEditItem: (type: ItemType, id: number, uid: string) => void }) {
  const {
    activeSaleId,
    sales,
    removeSaleProduct,
  } = useSales();

  const currentSale = sales[activeSaleId] || {};

  const combinedItems: CombinedItem[] = [
    ...(currentSale.saleProducts ?? []).map((item) => ({
      uid: item.uid!,
      type: ItemType.PRODUCT,
      animal: item.animal?.name || "N/A",
      name: item.product.name,
      quantity: item.quantityEquivalent,
      price: item.price,
      discount: item.discount ?? 0,
    })),
  ];


  const responsiveWidths = {
    tipo: "max-w-[10vw] md:max-w-[8vw] lg:max-w-[5vw]",
    animal: "max-w-[15vw] md:max-w-[12vw] lg:max-w-[10vw]",
    nombre: "max-w-[35vw] md:max-w-[30vw] lg:max-w-[12vw]",
    encargado: "max-w-[20vw] md:max-w-[16vw] lg:max-w-[12vw]",
    productos: "max-w-[25vw] md:max-w-[20vw] lg:max-w-[10vw]",
    estado: "max-w-[12vw] md:max-w-[10vw] lg:max-w-[8vw]",
    notas: "max-w-[20vw] md:max-w-[16vw] lg:max-w-[8vw]",
  };

  const handleDelete = (type: ItemType, uid: string) => {
    if (type === ItemType.PRODUCT) removeSaleProduct(uid);

  };

  const handleEdit = (type: ItemType, uid: string) => {
    if (type === ItemType.PRODUCT) {
      const item = currentSale.saleProducts?.find(p => p.uid === uid);
      if (item) onEditItem(type, item.product.id, uid);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Animal</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Descuento</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {combinedItems.length > 0 ? (
          combinedItems.map((item) => (
            <TableRow key={item.uid} className="group cursor-pointer">
              <TableCell><div className={`truncate group-hover:whitespace-normal group-hover:overflow-visible ${responsiveWidths.tipo}`}>{getItemTypeLabel(item.type)}</div></TableCell>
              <TableCell><div className={`truncate group-hover:whitespace-normal group-hover:overflow-visible ${responsiveWidths.animal}`}>{item.animal}</div></TableCell>
              <TableCell><div className={`truncate group-hover:whitespace-normal group-hover:overflow-visible ${responsiveWidths.nombre}`}>{item.name}</div></TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.price.toFixed(2)}</TableCell>
              <TableCell>{item.discount.toFixed(2)}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={11} className="text-center text-gray-500">
              No hay datos disponibles.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
