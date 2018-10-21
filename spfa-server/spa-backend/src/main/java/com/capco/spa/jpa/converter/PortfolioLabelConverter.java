package com.capco.spa.jpa.converter;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;

import com.capco.spa.jpa.entity.PortfolioLabel;

@Converter
public class PortfolioLabelConverter implements AttributeConverter<PortfolioLabel, Integer> {

    @Override
    public Integer convertToDatabaseColumn( PortfolioLabel portfolioLabel ){
        return portfolioLabel.getPortfolioIndex();
    }

    @Override
    public PortfolioLabel convertToEntityAttribute( Integer index ){
        return PortfolioLabel.fromIndex( index );
    }
}
