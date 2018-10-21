package com.capco.spa.jpa.entity;

public enum AssetClassType {

    /** Fixed Incomes 'FI' currently come only from Avalon,
     * only the 'FIGOV', 'FICR', 'FIKRD' from RF definition should be used in the app
     */
    @Deprecated
    FI,

    /**
     * Govt & govt related
     */
    FIGOV,

    /**
     * Govt & govt related - Key Rate Duration
     * Government bonds and cash asset classes
     * "01 - Cash and Cash Equivalents", "02 - Govt & govt related bonds" and "10 - Other"
     */
    FIKRD,

    /**
     * Credit products
     */
    FICR,

    /**
     * Inflation Linked Securities
     */
    ILS,

    /**
     * Equities & HF / Real Estate
     */
    EQ
}