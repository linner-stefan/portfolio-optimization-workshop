package com.capco.spa.utils;

import java.math.BigDecimal;

/**
 * Created by S0CRR8 on 16. 10. 2017.
 */
public class Constants {

    public static final int DEFAULT_SEQUENCER_ALLOCATION_SIZE = 20;

    public static final int BASIC_SCALE = 2;
    public static final int BASIC_PRECISION = 10;

    public static final int SCALE = 10;
    public static final int PRECISION = 20;

    public static final int INT_SCALE = 0;
    public static final int INT_PRECISION = 10;

    public static final int BIG_SCALE = 10;
    public static final int BIG_PRECISION = 30;

    public static final int SUM_SCALE = 2;
    public static final int SUM_PRECISION = 20;

    public static final int ZERO_ONE_SCALE = 10;
    public static final int ZERO_ONE_PRECISION = 11;
    public static final int SHORT_STRING = 32;

    public static final String MDC_REQUEST_ID = "REQUEST_ID";

    public static final BigDecimal SP_CONSTRAINT_DEFAULT = BigDecimal.valueOf( 1e11 ); // 100bn

    public static final BigDecimal NON_EQUITY_SCALING = BigDecimal.valueOf( 10000 ); // 100bn

    public static final BigDecimal EQUITY_SCALING = BigDecimal.valueOf( 1 ); // 100bn

    public static final int MAX_VALUE_DEFAULT = 100;
    public static final int MIN_VALUE_DEFAULT = -100;

    public static final int IV_MIN_YEAR = 2018;




}
