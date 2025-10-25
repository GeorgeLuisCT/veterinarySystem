import { ProductUnitType, ProductUnitTypeLabels } from "../_enums/product-unit-type";
import { ProductPresentationType, ProductPresentationTypeLabels } from "../_enums/product-presentation-type";


const DERIVED_UNITS = new Set([
  ProductUnitType.LITER,
  ProductUnitType.MILLILITER,
  ProductUnitType.GRAM,
  ProductUnitType.MILLIGRAM,
  ProductUnitType.MICROGRAM,
]);


export function getMainUnitLabelText(
  unitType: ProductUnitType,
  quantity: number,
  price: number,
  presentation?: ProductPresentationType
): string {
  const formattedPrice = `S/ ${price.toFixed(2)}`;

  // Caso especial producto completo
  if (
    (presentation === ProductPresentationType.LOOSE || presentation === ProductPresentationType.NONE) &&
    unitType === ProductUnitType.UNIT &&
    quantity === 1
  ) {
    return `Producto completo  en ${ProductPresentationTypeLabels[presentation].toLowerCase()} - ${formattedPrice} *(Original)*`;
  }

  // Presentaciones contenedoras donde cantidad indica volumen o peso contenido
  if (
    presentation === ProductPresentationType.BOTTLE ||
    presentation === ProductPresentationType.JAR ||
    presentation === ProductPresentationType.CAN ||
    presentation === ProductPresentationType.BAG ||
    presentation === ProductPresentationType.GALLON
  ) {
    // Aquí asumimos que unitType es unidad de medida (litro, kilogramo, etc)
    const unitLabel = ProductUnitTypeLabels[unitType].toLowerCase();
    const presLabel = ProductPresentationTypeLabels[presentation];
    return `${presLabel} de ${quantity} ${unitLabel}${quantity === 1 ? '' : 's'} - ${formattedPrice} *(Original)*`;
  }

  // Casos donde no se menciona la presentación, solo unidad y cantidad
  const unitLabel = ProductUnitTypeLabels[unitType].toLowerCase();
  return `${quantity} ${unitLabel}${quantity === 1 ? '' : 's'} - ${formattedPrice} *(Original)*`;
}



export function getSaleLabelText(
  modeUnit: ProductUnitType,
  quantity: number,
  price: number,
  baseUnit: ProductUnitType,
  presentation?: ProductPresentationType
): string {
  const formattedPrice = `S/ ${price.toFixed(2)}`;
  const modeLabel = ProductUnitTypeLabels[modeUnit];

  // Si el modo de venta es una unidad derivada (medida pura), mostrar solo cantidad + unidad + precio
  if (DERIVED_UNITS.has(modeUnit)) {
    const unitLabel = ProductUnitTypeLabels[modeUnit].toLowerCase();
    const pluralUnitLabel = quantity === 1 ? unitLabel : `${unitLabel}s`;
    return `${quantity} ${pluralUnitLabel} - ${formattedPrice} *(Fraccionado)*`;
  }

  // Obtener label de la presentación o unidad base
  const presentationLabel = presentation
    ? ProductPresentationTypeLabels[presentation].toLowerCase()
    : ProductUnitTypeLabels[baseUnit].toLowerCase();

  const pluralPresentation =
    quantity === 1 ? presentationLabel : `${presentationLabel}s`;

  // Si modo de venta es caja, paquete => "Caja de 5 bolsas"
  if (
    modeUnit === ProductUnitType.BOX ||
    modeUnit === ProductUnitType.PACK ) {
    return `${modeLabel} de ${quantity} ${pluralPresentation} - ${formattedPrice} *(Conjunto)*`;
  }

  // Otros casos normales
  const pluralModeLabel = quantity === 1 ? modeLabel.toLowerCase() : `${modeLabel.toLowerCase()}s`;
  return `${quantity} ${pluralModeLabel} en ${pluralPresentation} - ${formattedPrice} *(Fraccionado)*`;
}