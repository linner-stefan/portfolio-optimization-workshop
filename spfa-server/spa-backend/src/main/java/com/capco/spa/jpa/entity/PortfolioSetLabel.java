package com.capco.spa.jpa.entity;

/**
 * Created by Stefan Linner on 18. 7. 2017.
 */
public enum PortfolioSetLabel {

    Market("Market (Frontier)"),
    UserDefined("User-defined (Frontier)"),
    Investment("IS 1-Year Outlook (Frontier)");

    private String labelText;

    PortfolioSetLabel(){}

    PortfolioSetLabel( String labelText ){
        this.labelText = labelText;
    }

    @Override
    public String toString(){
        return labelText != null ? labelText : this.name() ;
    }
}
