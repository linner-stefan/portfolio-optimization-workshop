package com.capco.spa.jpa.entity;

import com.capco.spa.service.exception.SPAInternalApplicationException;

/**
 * Created by Stefan Linner on 18. 7. 2017.
 */
public enum PortfolioLabel {

    Current(-2),
    UserDefined(-1, "User-defined"),

    // efficient portfolios from MATLAB
    A(0),
    B(1),
    C(2),
    D(3),
    E(4),
    F(5),
    G(6),
    H(7),
    I(8),
    J(9),
    K(10),
    L(11),
    M(12),
    N(13),
    O(14),
    P(15),
    Q(16),
    R(17),
    S(18),
    T(19);


    private int portfolioIndex;
    private String labelText;

    PortfolioLabel( int portfolioIndex ){
        this.portfolioIndex = portfolioIndex;
    }

    PortfolioLabel( int portfolioIndex, String labelText ){
        this.portfolioIndex = portfolioIndex;
        this.labelText = labelText;
    }

    public int getPortfolioIndex(){
        return this.portfolioIndex;
    }

    public static PortfolioLabel fromIndex(int index) {
        for ( PortfolioLabel portfolioLabel : PortfolioLabel.values() ) {
            if (portfolioLabel.getPortfolioIndex() == index) {
                return portfolioLabel;
            }
        }
        throw new SPAInternalApplicationException( "Portofolio label index not found " + index );
    }

    @Override
    public String toString(){
        return labelText != null ? labelText : this.name() ;
    }


}
