import { InventoryMovementProductLocal, InventoryMovementProductRequest } from "../_types/inventory-movement-product-request";
import { InventoryMovementType } from "../_enums/inventory-movement-type";
import { toast } from "sonner";

export function validateMovementProductExtra(
  data: InventoryMovementProductRequest,
  type: InventoryMovementType
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  if (type === InventoryMovementType.PURCHASE) {
    if (!data.unitCost || data.unitCost <= 0) {
      errors.unitCost = "El costo unitario es obligatorio y debe ser mayor a 0";
    }

    if (!data.expirationDate || data.expirationDate.trim() === "") {
      errors.expirationDate = "La fecha de vencimiento es obligatoria";
    }
  }

  return errors;
}

export function sanitizeProductsForMovementType(
  products: InventoryMovementProductLocal[],
  movementType: InventoryMovementType
): InventoryMovementProductLocal[] {
  return products.map((p) => {
    const cleaned = { ...p };

    if (movementType !== InventoryMovementType.PURCHASE) {
      delete cleaned.unitCost;
      delete cleaned.expirationDate;
    }

    return cleaned;
  });
}

export function warnIfIncompleteProductsForPurchase(
  products: InventoryMovementProductLocal[],
  movementType: InventoryMovementType
) {
  if (movementType !== InventoryMovementType.PURCHASE) return;

  const hasIncomplete = products.some(
    (p) => p.unitCost == null || p.expirationDate == null
  );

  if (hasIncomplete) {
    toast.warning(
      "Algunos productos no tienen 'Costo Unitario' o 'Fecha de Vencimiento'. Edítalos o elimínalos antes de guardar."
    );
  }
}

export function getProductValidationErrors(
  products: InventoryMovementProductLocal[],
  movementType: InventoryMovementType
): string[] {
  if (movementType !== InventoryMovementType.PURCHASE) return [];

  return products
    .map((product, index) => {
      const missingFields: string[] = [];

      if (product.unitCost == null) missingFields.push("Costo Unitario");
      if (product.expirationDate == null) missingFields.push("Fecha de Vencimiento");

      return missingFields.length > 0
        ? `Producto ${index + 1}: falta ${missingFields.join(" y ")}`
        : null;
    })
    .filter(Boolean) as string[];
}