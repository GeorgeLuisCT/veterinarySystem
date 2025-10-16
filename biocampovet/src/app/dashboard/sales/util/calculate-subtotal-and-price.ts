export interface PriceCalcParams {
  price: number;
  discount: number;
  quantity: number;
  subtotal: number;
  precision?: number; // opcional: cuántos decimales redondear
}

export interface PriceCalcResult {
  newSubtotal?: number;
  newPrice?: number;
}

/**
 * Redondea un número a `precision` decimales.
 */
function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Compara dos números con tolerancia (para evitar loops infinitos por punto flotante)
 */
function areDifferent(a: number, b: number, tolerance = 0.001): boolean {
  return Math.abs(a - b) > tolerance;
}

/**
 * Calcula el subtotal y/o precio basado en los valores actuales del formulario.
 * Evita loops infinitos comparando valores actuales vs calculados.
 */
export function calculateSubtotalAndPrice({
  price,
  discount,
  quantity,
  subtotal,
  precision = 2,
}: PriceCalcParams): PriceCalcResult {
  const expectedSubtotal = round(price * quantity - discount, precision);
  const result: PriceCalcResult = {};

  if (areDifferent(subtotal, expectedSubtotal)) {
    result.newSubtotal = expectedSubtotal;

    if (quantity > 0) {
      const recalculatedPrice = round((subtotal + discount) / quantity, precision);
      if (areDifferent(recalculatedPrice, price)) {
        result.newPrice = recalculatedPrice;
      }
    }
  }

  return result;
}
