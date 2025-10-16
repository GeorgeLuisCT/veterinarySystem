package com.gaedet.biocampovet.core.inventory.util;

import javax.validation.Constraint;
import javax.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ProductRequestValidator.class)
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidProductRequest {
    String message() default "Solicitud inválida para el producto";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
