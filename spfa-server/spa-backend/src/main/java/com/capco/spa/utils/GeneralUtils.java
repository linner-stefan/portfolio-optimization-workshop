package com.capco.spa.utils;

import java.util.ArrayList;
import java.util.Map;

import com.capco.spa.jpa.entity.AssetClass;

/**
 * Created by Stefan Linner on 29. 6. 2017.
 */
public class GeneralUtils {

    public static final String KRD_RF_NAME_BASE = " KRD ";

    public static String parseCurrency( String name ){
        if ( name != null && name.length() >= 3 ) {
            int firstSpaceIndex = name.indexOf( ' ' );
            if ( firstSpaceIndex > 0 )
                return name.substring( 0, firstSpaceIndex );
        }
        return null;
    }

    public static double[][] convertToMatrix( ArrayList<ArrayList<Double>> rows ){
        double[][] matrix = new double[ rows.size() ][];

        int rowIndex = 0;
        for ( ArrayList<Double> riskFactorRow : rows ){
            matrix[ rowIndex++ ] = riskFactorRow.stream().mapToDouble(Double::doubleValue).toArray();
        }
        return matrix;
    }

    public static double getSum( double[] vector ){
        double sum = 0.0;
        for ( double value : vector ){
            sum += value;
        }
        return sum;
    }

    public static double getSum( ArrayList<Double> vector ){
        double sum = 0.0;
        for ( double value : vector ){
            sum += value;
        }
        return sum;
    }

    public static double getClosestValueInArray( double[] array, double value) {

        int low = 0;
        int high = array.length - 1;

        if (high < 0)
            throw new IllegalArgumentException("The array cannot be empty");

        while (low < high) {
            int mid = (low + high) / 2;
            assert(mid < high);
            double d1 = Math.abs(array[mid  ] - value);
            double d2 = Math.abs(array[mid+1] - value);
            if (d2 <= d1)
            {
                low = mid+1;
            }
            else
            {
                high = mid;
            }
        }
        return array[high];
    }


}
