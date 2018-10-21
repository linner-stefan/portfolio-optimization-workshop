package com.capco.spa.utils;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.capco.spa.service.exception.SPAInternalApplicationException;

/**
 * Created by S0CRR8 on 3. 10. 2017.
 */
public class FormatUtil {

    private final static ObjectMapper objectMapper = new ObjectMapper();

    static {
        objectMapper.enable( DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS);
    }

    public static final int SCALE = 10;

    public static double scaleDouble( Double value, int scale) {
        if ( Double.isFinite( value )) {
            return BigDecimal.valueOf( value ).setScale( scale, RoundingMode.HALF_UP ).stripTrailingZeros().doubleValue();
        }
        return value;
    }

    public static double divide(double a, double b) {
        if (b==0.0) {
            return 0.0;
        }
        return a/b;
    }

    public static double scaleDouble( Double value) {
        if ( Double.isFinite( value )) {
            return BigDecimal.valueOf( value ).setScale( SCALE, RoundingMode.HALF_UP ).stripTrailingZeros().doubleValue();
        }
        return value;
    }

    public static String formatBigDecimal( BigDecimal value, int scale) {
        return value.setScale(scale, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }

    public static String formatBigDecimal( BigDecimal value) {
        return value.setScale(SCALE, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }

    public static String formatDouble( Double value, int scale) {
        if ( Double.isFinite( value )){
            return BigDecimal.valueOf( value ).setScale( scale, RoundingMode.HALF_UP ).stripTrailingZeros().toPlainString();
        }
        return value.toString();
    }

    public static String formatDouble( Double value) {
        if ( Double.isFinite( value )) {
            return BigDecimal.valueOf( value ).setScale( SCALE, RoundingMode.HALF_UP ).stripTrailingZeros().toPlainString();
        }
        return value.toString();
    }

    public static String writeValueAsJsonString( Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch ( JsonProcessingException e ) {
            throw new SPAInternalApplicationException( e );
        }
    }

    public static <T> T readJsonString( String string, Class<T> c) {
        try {
            return objectMapper.readValue( string, c );
        } catch ( IOException e ) {
            throw new SPAInternalApplicationException( e );
        }
    }

    public static BigDecimal getScaledValue( BigDecimal newValue, int scale) {
        if (newValue==null) {
            return null;
        }
        return newValue.setScale( scale, BigDecimal.ROUND_HALF_UP )/*.stripTrailingZeros()*/;
    }

    public static BigDecimal getScaledValue( BigDecimal newValue) {
        return getScaledValue( newValue, SCALE );
    }
}
