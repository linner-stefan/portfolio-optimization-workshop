import {AssetClassGroup, Portfolio, PortfolioAllocation} from "@app/base/asset-class/asset-class.model";
import {AcHelper} from "@app/base/asset-class/asset-class-helper";
import {ValueUtil} from "../../value.util";
import {
  PortfolioAllocationChartDatum,
  PortfolioChartDatumOriginal
} from "@app/shared/charts/portfolios-chart/portfolio-chart.model";
import {Calculation} from "@app/base/calculation/model/calculation.model";
import {PortfolioUtil} from "@app/base/calculation/portfolio.util";

export class PortfolioChartDataUtils{

  static extractPortfolioLabels(portfolios: Portfolio[]) : Array<string> {
    let labels = [];
    portfolios.forEach( portfolio => labels.push( portfolio.label ) );
    return labels;
  }

  static extractPortfolioLayers(assetClassGroup: AssetClassGroup[]) : Array<string> {
    let layers = [];
    assetClassGroup.forEach( acg => layers.push( acg.name ) );
    return layers;
  }

  /**
   * TODO: refactor
   * @param assetClassGroups
   * @param labels
   * @param setLabel
   * @param calculation
   * @param portfolioAllocations
   * @returns {PortfolioChartDatumOriginal[]}
   */
  static initializeChartData( assetClassGroups: AssetClassGroup[],
                             labels: Array<string>, setLabel: string,
                              calculation: Calculation,
                              portfolioAllocations?: PortfolioAllocation[]): PortfolioChartDatumOriginal[] {
    let chartData: PortfolioChartDatumOriginal[] = [];

    for (let labelIndex = 0; labelIndex < labels.length; labelIndex++) {
      let datum = new PortfolioChartDatumOriginal();
      let label = labels[ labelIndex ];

      datum.label = label;
      datum.setLabel = setLabel;

      let ctrUndefined = false;
      assetClassGroups.forEach( acg => {
        let layer = acg.name;

        datum.layers[ layer ] = new PortfolioAllocationChartDatum();
        datum.layers[ layer ].ctr = 0;

        // workshop temp
        portfolioAllocations = calculation.efficientPortfoliosUser[labelIndex].allocations;

        PortfolioChartDataUtils.aggregateAcProperties( datum.layers[ layer ], acg, label, setLabel, calculation, portfolioAllocations );

        if ( ! ValueUtil.isNumber( datum.layers[ layer ].ctr ) ){
          ctrUndefined = true;
        }

        datum.layers[ layer ].navTotal = datum.layers[ layer ].navTotal > 0 ? datum.layers[ layer ].navTotal : 0;
        datum.layers[ layer ].navPercentage = datum.layers[ layer ].navPercentage > 0 ? datum.layers[ layer ].navPercentage : 0;
      });

      // if at least one CtR values is undefined, due to allocation changes in user-defined portfolio, we have to invalidate all layers
      if ( ctrUndefined ){
        PortfolioChartDataUtils.invalidateCtRValues( datum, assetClassGroups );
      }

      chartData.push( datum );

    }

    return chartData;
  }

  static aggregateAcProperties(datum: PortfolioAllocationChartDatum, assetClassGroup: AssetClassGroup,
                               label: string, setLabel: string, calculation: Calculation,
                               portfolioAllocations?: PortfolioAllocation[]): void {

    if ( AcHelper.hasSubClasses( assetClassGroup ) ) {
      assetClassGroup.subClasses.forEach(acg => {

        PortfolioChartDataUtils.aggregateAcProperties(datum, acg, label, setLabel, calculation, portfolioAllocations  );

      });

    }
    else {
      let allocation = PortfolioChartDataUtils.getAllocation(portfolioAllocations, assetClassGroup, label, setLabel, calculation);

      datum.navTotal += allocation.navTotal;
      datum.navPercentage += allocation.navPercentage;
      datum.ctr += allocation.ctr;

    }

  }

  private static getAllocation(portfolioAllocations: PortfolioAllocation[], assetClassGroup: AssetClassGroup,
                               label: string, setLabel: string, calculation: Calculation) {
    let allocation;
    if (portfolioAllocations) {
      allocation = portfolioAllocations.filter(pa => pa.assetClassId == assetClassGroup.assetClass.id)[0];
    }
    else {
      if (label === 'Optimal') {
        allocation = PortfolioUtil.getOptimalPortfolio(calculation).allocationsMap.get(assetClassGroup.assetClass.id);
      }
      else {
        // TODO: performance, could be retrieved from Portfolio.allocationMap
        allocation = assetClassGroup.assetClass.portfolioAllocations.find(allocation =>
          allocation.portfolioLabel == label &&
          ( allocation.portfolioSetLabel == setLabel || !allocation.portfolioSetLabel )
        );
      }
    }
    return allocation;
  }

  static invalidateCtRValues( datum: PortfolioChartDatumOriginal, assetClassGroups: AssetClassGroup[] ): void{
    assetClassGroups.forEach( acg => {
      let layer = acg.name;
      datum.layers[layer].ctr = undefined;
    });
  }

  static copyCtr(fromChartDatum: PortfolioChartDatumOriginal, toChartDatum: PortfolioChartDatumOriginal, layers: string[]) {
    layers.forEach( layer => {
      toChartDatum.layers[ layer ].ctr = fromChartDatum.layers[ layer ].ctr;
    });
  }
}


