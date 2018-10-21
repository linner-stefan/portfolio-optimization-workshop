package com.capco.spa.utils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;

/**
 * Created by Stefan Linner on 11. 7. 2017.
 */
@Slf4j
public class OutputUtils {

    private static final int CALCULATION_OUTPUT_SCALE = 8;

    public static String matrixToString( double[][] matrix ){
        return matrixToString( matrix, false );
    }

    public static String matrixToString( double[][] matrix, boolean scale ){
        if ( matrix == null ) return null;

        StringBuilder sb = new StringBuilder();
        sb.append( "[\n" );
        int rows = 0;
        int cols = 0;
        for ( double[] aMatrix : matrix ) {
            cols = 0;
            for ( double value : aMatrix ) {
                sb.append( scale ? FormatUtil.formatDouble( value, CALCULATION_OUTPUT_SCALE ) : value );
                sb.append( ", " );
                ++ cols;
            }
            sb.append( ";\n" );
            ++ rows;
        }
        sb.append( ']' );
        sb.append( "\n[" ).append( rows ).append( "x" ).append( cols ).append( "]" );
        return sb.toString();
    }

    public static String vectorToString( double[] vector ){
        return vectorToString( vector, false );
    }

    public static String vectorToString( double[] vector, boolean scale ){
        if ( vector == null ) return null;

        StringBuilder sb = new StringBuilder();

        // with indexes
        sb.append( '[' );
        int cols = 0;
        for ( double value : vector ) {
            sb.append( cols ).append( " -> " )
                    .append( scale ? FormatUtil.formatDouble( value, CALCULATION_OUTPUT_SCALE ) : value )
                    .append( ", " );
            ++ cols;
        }
        sb.append( "]\n" );

        // without indexes for MATLAB
        sb.append( '[' );
        cols = 0;
        for ( double value : vector ) {
            sb.append( scale ? FormatUtil.formatDouble( value, CALCULATION_OUTPUT_SCALE ) : value )
                    .append( ", " );
            ++ cols;
        }
        sb.append( "]\n" );

        sb.append( "[1x" ).append( cols ).append( "]" );
        return sb.toString();
    }

    public static String vectorToString( Map<String,ArrayList<Double>> map ){
        return vectorToString( map, false );
    }

    public static String vectorToString( Map<String,ArrayList<Double>> map, boolean scale ){
        if ( map == null ) return null;

        StringBuilder sb = new StringBuilder();
        for ( Map.Entry<String,ArrayList<Double>> entry : map.entrySet() ) {
            String key = entry.getKey();
            ArrayList<Double> vector = entry.getValue();

            sb.append( key ).append( " = " );
            sb.append( '[' );
            int cols = 0;
            for ( double value : vector ) {
                sb.append( scale ? FormatUtil.formatDouble( value, CALCULATION_OUTPUT_SCALE ) : value )
                        .append( ", " );
                ++ cols;
            }
            sb.append( "]\n" );
            sb.append( "[1x" ).append( cols ).append( "]" );
            sb.append( "\n" );
        }

        return sb.toString();
    }

    public static String vectorOfStringToString( Collection<String> vector ){
        if ( vector == null ) return null;

        int size = vector.size();

        StringBuilder sb = new StringBuilder();

        // with indexes
        sb.append( '{' );
        int index = 0;
        for ( String value : vector ) {
            sb.append( index++ ).append( " -> " ).append( String.format( "'%s', ", value ) );
        }
        sb.append( "}\n" );

        // without indexes for MATLAB
        sb.append( '{' );
        for ( String value : vector ) {
            sb.append( String.format( "'%s', ", value ) );
        }
        sb.append( '}' );


        return sb.toString() + "\n[1x" + size + "]";
    }

    public static String vectorOfStringToString( Map<String,ArrayList<String>> map ){
        if ( map == null ) return null;

        StringBuilder sb = new StringBuilder();
        for ( Map.Entry<String,ArrayList<String>> entry : map.entrySet() ) {
            String key = entry.getKey();
            ArrayList<String> vector = entry.getValue();

            sb.append( key ).append( " = " );

            if ( vector == null ) return null;

            int size = vector.size();

            sb.append( '{' );
            for ( String value : vector ) {
                sb.append( String.format( "'%s', ", value ) );
            }
            sb.append( '}' );
            sb.append( "\n[1x" ).append( size ).append( "]\n" );
        }

        return sb.toString();
    }

    public static String mapToString( Map map ){
        if ( map == null ) return null;

        StringBuilder sb = new StringBuilder();
        try {
            for ( Object entry : map.entrySet() ) {
                Object key = ( (Map.Entry) entry ).getKey();
                Object value = ( (Map.Entry) entry ).getValue();

                sb.append( key ).append( ": " ).append( value ).append( '\n' );
            }
        } catch ( Exception e ) {
            log.warn( "Unable to create string representation of the map", e );
        }

        return sb.toString();
    }

    public static String matrixToString( Map<String,ArrayList<ArrayList<Double>>> map ){
        if ( map == null ) return null;

        StringBuilder sb = new StringBuilder();
        for ( Map.Entry<String,ArrayList<ArrayList<Double>>> entry : map.entrySet() ) {
            String key = entry.getKey();
            ArrayList<ArrayList<Double>> value = entry.getValue();

            sb.append( key ).append( ": \n" );
            sb.append( matrixToString( GeneralUtils.convertToMatrix( value ) ) );
            sb.append( '\n' );
        }

        return sb.toString();
    }

}
