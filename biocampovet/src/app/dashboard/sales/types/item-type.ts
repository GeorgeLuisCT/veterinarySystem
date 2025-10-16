export enum ItemType {
  PRODUCT = "PRODUCT",
}

export const ItemTypeLabels: Record<ItemType, string> = {
  PRODUCT: "Producto",
};

export function getItemTypeLabel(type: ItemType): string {
  return ItemTypeLabels[type] || type;
}
