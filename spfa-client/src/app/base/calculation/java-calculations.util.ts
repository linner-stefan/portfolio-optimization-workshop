import {PortfolioCtrUpdate, PortfolioCtrUpdateInDto} from "@app/base/calculation/model/java-calculations.model";
import {Portfolio, PortfolioAllocationDto} from "@app/base/asset-class/asset-class.model";
import {Calculation} from "@app/base/calculation/model/calculation.model";
/**
 * Created by Stefan Linner on 04/12/2017.
 */

export class JavaCalculationsUtil {
  static preparePortfolioUpdateCtr(portfolio: Portfolio, calculation: Calculation): PortfolioCtrUpdate{
    if ( ! portfolio ) return;

    const inDto: PortfolioCtrUpdateInDto = new PortfolioCtrUpdateInDto();
    inDto.portfolioAllocations = [];
    portfolio.allocations.forEach( pa => {
      const newPa = new PortfolioAllocationDto();

      newPa.id = pa.id;
      newPa.assetClassName = pa.assetClass.name;
      newPa.assetClassId = pa.assetClassId;
      newPa.navPercentage = pa.navPercentage;

      inDto.portfolioAllocations.push( newPa );
    });

    const update: PortfolioCtrUpdate = new PortfolioCtrUpdate();
    update.data = inDto;
    update.portfolio = portfolio;
    update.calculation = calculation;

    return update;
  }
}
