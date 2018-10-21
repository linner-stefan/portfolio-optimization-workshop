import {Calculation} from "./model/calculation.model";
import {AssetClass, Portfolio, PortfolioAllocation} from "../asset-class/asset-class.model";
import {ValueUtil} from "@app/shared/value.util";
import {PortfolioCtrUpdateOutDto} from "@app/base/calculation/model/java-calculations.model";
import {InterpolatedPortfolio} from "@app/shared/charts/multi-frontier-chart/multi-frontier-chart.model";
import {MultiFrontierAxis} from "@shared/charts/multi-frontier-chart/multi-frontier-chart.config";

export class PortfolioUtil {

  static getInterpolatedPoint( portfolios: Portfolio[], trackingError?: number ) : InterpolatedPortfolio {

    const firstPortfolio = portfolios[0];

    if ( !trackingError ){
      trackingError = firstPortfolio.trackingError;
    }

    if (trackingError < firstPortfolio.trackingError){
      trackingError = firstPortfolio.trackingError;
      console.warn('Optimal tracking error is outside of the Efficient Portfolio domain! ' +
        'Using TE the from the portfolio ' + firstPortfolio.label);
    }

    const lastPortfolio = portfolios[ portfolios.length -1 ];
    if (trackingError > lastPortfolio.trackingError ){
      trackingError = lastPortfolio.trackingError;
      console.warn('Optimal tracking error is outside of the Efficient Portfolio domain! ' +
        'Using TE the from the portfolio ' + lastPortfolio.label);
    }

    for (let i = 0; i < portfolios.length -1; i++) {

      if ( portfolios[i].trackingError <= trackingError && trackingError <= portfolios[i +1].trackingError ) {

        let interpolated = new InterpolatedPortfolio();
        interpolated.efficientPortfolioSet = portfolios;
        interpolated.portfolioLeftIndex = i;
        interpolated.portfolioRightIndex = i +1;
        interpolated.position = ( trackingError -portfolios[i].trackingError ) / ( portfolios[i +1].trackingError -portfolios[i].trackingError );
        return interpolated;
      }
    }

    return null;
  }

  static calculateOptimalPortfolio( calculation: Calculation, interpolated: InterpolatedPortfolio ) {
    calculation.optimalPortfolio = PortfolioUtil.calculateInterpolatedPortfolio( interpolated,
      calculation.efficientPortfoliosUser, calculation.assetClasses );
  }

  static calculateInterpolatedPortfolio( interpolated: InterpolatedPortfolio, efficientPortfoliosSet: Portfolio[],
                                         assetClasses: AssetClass[] ): Portfolio {

    if (assetClasses == undefined) {
      return null;
    }

    if ( interpolated ) {

      if ( interpolated.portfolioLeftIndex == interpolated.portfolioRightIndex ){

        let portfolio = efficientPortfoliosSet[ interpolated.portfolioLeftIndex ];

        let optimalPortfolio: Portfolio = new Portfolio();
        optimalPortfolio.allocations = [];
        optimalPortfolio.allocationsMap = new Map<number,PortfolioAllocation>();
        optimalPortfolio.label = "Optimal";
        optimalPortfolio.setLabel = portfolio.setLabel;
        optimalPortfolio.portfolioReturn =  portfolio.portfolioReturn;
        optimalPortfolio.trackingError = portfolio.trackingError;

        assetClasses.forEach( ac => {

          let portfolioAllocation: PortfolioAllocation = new PortfolioAllocation();
          portfolioAllocation.assetClass = ac;
          portfolioAllocation.assetClassId = ac.id;
          if (ac.portfolioAllocations === undefined || ac.portfolioAllocations.length == 0) {
            return null;
          }
          portfolioAllocation.navTotal = ac.portfolioAllocations[ interpolated.portfolioLeftIndex +2 ].navTotal;
          portfolioAllocation.navPercentage = ac.portfolioAllocations[ interpolated.portfolioLeftIndex +2 ].navPercentage;

          optimalPortfolio.allocations.push(portfolioAllocation);
          optimalPortfolio.allocationsMap.set( portfolioAllocation.assetClassId, portfolioAllocation );
        } );

        return optimalPortfolio;

      } else {

        let leftPortfolio: Portfolio = efficientPortfoliosSet[interpolated.portfolioLeftIndex];
        let rightPortfolio: Portfolio = efficientPortfoliosSet[interpolated.portfolioRightIndex];

        let interpolatePortfolio: Portfolio =  new Portfolio();
        interpolatePortfolio.allocations = [];
        interpolatePortfolio.allocationsMap = new Map<number,PortfolioAllocation>();
        interpolatePortfolio.label = "Optimal";
        interpolatePortfolio.setLabel = leftPortfolio.setLabel;
        interpolatePortfolio.portfolioReturn = leftPortfolio.portfolioReturn + interpolated.position * (rightPortfolio.portfolioReturn - leftPortfolio.portfolioReturn);
        interpolatePortfolio.trackingError = leftPortfolio.trackingError + interpolated.position * (rightPortfolio.trackingError - leftPortfolio.trackingError);

        assetClasses.forEach(ac => {

          let portfolioAllocation: PortfolioAllocation = new PortfolioAllocation();
          portfolioAllocation.assetClass = ac;
          portfolioAllocation.assetClassId = ac.id;

          if (ac.portfolioAllocations === undefined || ac.portfolioAllocations.length == 0) {
            return null;
          }

          let portfolioAllocationLeft = ac.portfolioAllocations[interpolated.portfolioLeftIndex + 2];
          let portfolioAllocationRight = ac.portfolioAllocations[interpolated.portfolioRightIndex + 2];

          portfolioAllocation.navTotal = portfolioAllocationLeft.navTotal + interpolated.position * (portfolioAllocationRight.navTotal - portfolioAllocationLeft.navTotal);
          portfolioAllocation.navPercentage = portfolioAllocationLeft.navPercentage + interpolated.position * (portfolioAllocationRight.navPercentage - portfolioAllocationLeft.navPercentage);

          interpolatePortfolio.allocations.push(portfolioAllocation);
          interpolatePortfolio.allocationsMap.set(portfolioAllocation.assetClassId, portfolioAllocation);
        });

        return interpolatePortfolio;

      }
    } else {

      return null;
    }
  }

  static getPortfolioSnapshot( portfolios: Portfolio[] ) {
    let table = '';
    let portfolioKeys: string[] = [];
    let assetClassNames: string[] = [];
    let data: number[][] = []; // rows are AC's, columns are portfolios

    // portfolioKeys
    portfolios.forEach( p => {
      let portfolioKey = PortfolioUtil.extractUniquePortfolioLabel(p);
      portfolioKeys.push( portfolioKey )
    } );

    // assetClassNames
    portfolios[0].allocations.forEach( pa => {
      let acName = pa.assetClass.group.name;
      assetClassNames.push( acName );
    });

    // data preparation - navPercentage
    assetClassNames.forEach( acName => {
      data[acName] = [];
    });
    portfolios.forEach(p => {
      p.allocations.forEach( pa => {
        let acName = pa.assetClass.group.name;
        let portfolioKey = PortfolioUtil.extractUniquePortfolioLabel(p);

        data[acName][portfolioKey] = pa.navPercentage ;
      });

    });

    table = PortfolioUtil.outputPortfolioToTable(table, 'Asset Class weight', portfolioKeys, assetClassNames, data);

    data = [];
    // data preparation - ctr
    assetClassNames.forEach( acName => {
      data[acName] = [];
    });
    portfolios.forEach(p => {
      p.allocations.forEach( pa => {
        let acName = pa.assetClass.group.name;
        let portfolioKey = PortfolioUtil.extractUniquePortfolioLabel(p);

        data[acName][portfolioKey] = pa.ctr ;
      });

    });

    table = PortfolioUtil.outputPortfolioToTable(table, 'Asset Class CtR', portfolioKeys, assetClassNames, data);

    return table;
  }

  private static outputPortfolioToTable(table: string, name: string, portfolioKeys: string[], assetClassNames: string[], data: number[][]) {
    table += name+'\t';

    // header
    portfolioKeys.forEach(portfolioKey => {
      table += portfolioKey + '\t';
    });

    // data output
    assetClassNames.forEach(acName => {

      let row = '\r\n' + acName;
      portfolioKeys.forEach(portfolioKey => {
        row += '\t' + ValueUtil.getPercentRounded(data[acName][portfolioKey], 3);
      });

      table += row;
    });

    return table + '\r\n\r\n';
  }

  private static extractUniquePortfolioLabel(portfolio) {
    return portfolio.label + ( portfolio.setLabel ? ` (${portfolio.setLabel})` : '' );
  }

  static getPortfolioFrontierMultiSnapshot( portfolios: Portfolio[],axisXType: MultiFrontierAxis, axisYType: MultiFrontierAxis ) {

    let table = '\t';
    portfolios.forEach( p => {
      table += PortfolioUtil.extractUniquePortfolioLabel( p ) + '\t';
    } );
    let xValuesString = '\r\n'+axisXType.label;

    portfolios.forEach(p => {
      xValuesString += '\t' + axisXType.value(p.trackingError);
    } );

    let yValuesString = '\r\n'+axisYType.label;

    portfolios.forEach(p => {
      yValuesString += '\t' + axisYType.value(p.portfolioReturn);
    } );

    return table +xValuesString +yValuesString;
  }

  static getCurrentPortfolio( calculation: Calculation ) : Portfolio {

    return calculation.currentPortfolio;
  }

  static getUserDefinedPortfolio( calculation: Calculation ) : Portfolio {

    return calculation.userDefinedPortfolio;
  }

  static getOptimalPortfolio (calculation: Calculation ): Portfolio {
    return calculation.optimalPortfolio;
  }

  static updatePortfolioCtr( portfolio: Portfolio, updateDto: PortfolioCtrUpdateOutDto ){
    portfolio.allocations.forEach( pa => {
      pa.ctr = updateDto.assetClassToCtrMap[ pa.assetClassId ];
    });
  }
}
