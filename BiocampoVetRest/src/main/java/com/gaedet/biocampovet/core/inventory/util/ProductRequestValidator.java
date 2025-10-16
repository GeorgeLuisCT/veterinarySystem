package com.gaedet.biocampovet.core.inventory.util;

import com.gaedet.biocampovet.core.inventory.dto.BaseProductRequest;
import com.gaedet.biocampovet.core.inventory.dto.ProductSaleModeRequest;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import java.util.HashSet;
import java.util.Set;

public class ProductRequestValidator implements ConstraintValidator<ValidProductRequest, BaseProductRequest> {

    @Override
    public boolean isValid(BaseProductRequest request, ConstraintValidatorContext context) {
        boolean valid = true;

        // Validar contentTotal = 1 si unidad es UNIT
        if (!ProductUnitTypeValidator.isValidContentTotal(request.getUnitType(), request.getContentTotal())) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Cuando la unidad es 'Unidad', el contenido total debe ser 1")
                    .addPropertyNode("contentTotal")
                    .addConstraintViolation();
            valid = false;
        }

        // Validar compatibilidad unidad de medida con presentación principal
        if (!ProductUnitPresentationValidator.isUnitCompatibleWithPresentation(request.getPresentation(), request.getUnitType())) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                            "La unidad de medida '" + request.getUnitType().getLabel() + "' no es compatible con la presentación '" + request.getPresentation().getLabel() + "'")
                    .addPropertyNode("saleModes")
                    .addConstraintViolation();
            valid = false;
        }

        if (request.getSaleModes() != null) {
            Set<ProductUnitType> seenUnits = new HashSet<>();

            for (ProductSaleModeRequest mode : request.getSaleModes()) {

                ProductUnitType originalUnit = request.getUnitType();
                ProductUnitType variantUnit = mode.getUnitType();
                Double contentTotal = request.getContentTotal();
                Double quantityEquivalent = mode.getQuantityEquivalent();

                // Validar duplicados
                if (!seenUnits.add(mode.getUnitType())) {
                    context.disableDefaultConstraintViolation();
                    context.buildConstraintViolationWithTemplate(
                                    "El modo de venta '" + mode.getUnitType().getLabel() + "' está duplicado en la lista")
                            .addPropertyNode("saleModes")
                            .addConstraintViolation();
                    valid = false;
                    break;
                }

                // Validar compatibilidad con unidad principal
                if (!ProductUnitTypeValidator.isCompatible(request.getUnitType(), mode.getUnitType())) {
                    context.disableDefaultConstraintViolation();
                    context.buildConstraintViolationWithTemplate(
                                    "El modo de venta '" + mode.getUnitType().getLabel() + "' no es compatible con la unidad '" + request.getUnitType().getLabel() + "'")
                            .addPropertyNode("saleModes")
                            .addConstraintViolation();
                    valid = false;
                    break;
                }

                // Validar que si el modo es UNIT, quantityEquivalent sea 1
                if (mode.getUnitType() == ProductUnitType.UNIT &&
                        (mode.getQuantityEquivalent() == null || mode.getQuantityEquivalent() != 1.0)) {
                    context.disableDefaultConstraintViolation();
                    context.buildConstraintViolationWithTemplate(
                                    "Cuando el modo de venta es 'Unidad', la cantidad equivalente debe ser 1")
                            .addPropertyNode("saleModes")
                            .addConstraintViolation();
                    valid = false;
                    break;
                }

                // Validar que no se exceda el contenido total según conversión
                if (quantityEquivalent != null &&
                        contentTotal != null &&
                        !ProductUnitTypeValidator.isValidQuantityConversion(originalUnit, variantUnit, contentTotal, quantityEquivalent)) {
                    context.disableDefaultConstraintViolation();
                    context.buildConstraintViolationWithTemplate(
                                    "La cantidad equivalente de '" + variantUnit + "' excede el contenido disponible de '" + originalUnit + "'")
                            .addPropertyNode("saleModes")
                            .addConstraintViolation();
                    valid = false;
                    break;
                }
            }
        }

        return valid;
    }
}
