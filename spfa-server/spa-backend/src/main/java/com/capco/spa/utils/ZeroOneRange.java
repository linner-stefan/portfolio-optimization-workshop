package com.capco.spa.utils;


import static java.lang.annotation.ElementType.ANNOTATION_TYPE;
import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.METHOD;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import javax.validation.Constraint;
import javax.validation.Payload;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;

@Retention( RetentionPolicy.RUNTIME)
@Target({ METHOD, FIELD, ANNOTATION_TYPE })
@Constraint(validatedBy = { })
@Documented
@Min( 0 )
@Max( 1 )
public @interface ZeroOneRange {
    String message() default "Value must be within therange 0 to 1";

    Class<?>[] groups() default { };

    Class<? extends Payload>[] payload() default { };
}
