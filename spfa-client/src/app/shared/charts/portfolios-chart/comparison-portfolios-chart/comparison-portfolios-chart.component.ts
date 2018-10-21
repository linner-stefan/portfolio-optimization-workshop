import {PortfoliosChartComponent} from "../portfolios-chart.component";
import {Component, ViewEncapsulation} from "@angular/core";
import {InterpolatedPortfolio} from "../../multi-frontier-chart/multi-frontier-chart.model";
import {AssetClassGroup, Portfolio} from "@app/base/asset-class/asset-class.model";
import {PortfolioChartDataUtils} from "../portfolio-chart-data-utils";
import {Calculation} from "@app/base/calculation/model/calculation.model";
import {PortfolioChartDatumOriginal} from "@app/shared/charts/portfolios-chart/portfolio-chart.model";
import {PortfolioUtil} from "@app/base/calculation/portfolio.util";
import {JavaCalculationsUtil} from "@app/base/calculation/java-calculations.util";

/**
 * Created by Stefan Linner on 15. 8. 2017.
 */
@Component({
  selector: 'comparison-portfolios-chart',
  templateUrl: '../portfolios-chart.component.html',
  styleUrls: ['../../../chart-default.scss','../portfolios-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ComparisonPortfoliosChart extends PortfoliosChartComponent {

  /**
   * Holds efficient portfolio sets only for interpolation purposes.
   * Practically it's just a map of chartDataOriginal arrays for each efficient portfolio set.
   */
  private chartDataOriginalSets: Map<string,PortfolioChartDatumOriginal[]>;

  protected extractChartData(): boolean {

    const chartDataOriginalPrevious = this.chartDataOriginal;

    this.chartDataLabels = [];
    this.chartDataLayers = [];
    this.chartDataOriginal = [];
    this.chartDataOriginalSets = new Map();
    const calculation = this.calculationService.getCalculation();
    const assetClassGroups: AssetClassGroup[]  = calculation.assetClassGroups;

    this.chartDataLayers = PortfolioChartDataUtils.extractPortfolioLayers(assetClassGroups);

    this.extractedIndividualPortfolios(assetClassGroups, calculation);

    this.extractEfficientPortfolios( assetClassGroups, chartDataOriginalPrevious );

    this.updateCtr( chartDataOriginalPrevious );

    console.log("comparison portfolios charDataLabels:",this.chartDataLabels);
    console.log("comparison portfolios chartDataLayers:",this.chartDataLayers);
    console.log("comparison portfolios chartDataOriginal:",this.chartDataOriginal);

    return true;
  }

  /**
   * For each interpolated portfolio initializes chartDataOriginal
   * with the first portfolio A in the set.
   *
   * @returns {boolean}
   */
  private extractEfficientPortfolios(assetClassGroups: AssetClassGroup[],
                                     chartDataOriginalPrevious: PortfolioChartDatumOriginal[]) {
    this.efficientPortfolios.forEach(set => {
      let chartDatum;

      let portfoliosLabels = PortfolioChartDataUtils.extractPortfolioLabels(set);
      let setLabel = set[0].setLabel;

      const previousDatum = chartDataOriginalPrevious.filter( previousDatum =>
        previousDatum.interpolated && previousDatum.portfolio && previousDatum.portfolio.setLabel == setLabel )[0];
      if ( previousDatum ){
        chartDatum = previousDatum;
      }
      else {
        chartDatum = new PortfolioChartDatumOriginal();
        chartDatum.label = "Optimal";
        chartDatum.setLabel = setLabel;
      }

      let chartDataOriginal =
        PortfolioChartDataUtils.initializeChartData(assetClassGroups, portfoliosLabels, setLabel, this.calculation);

      this.chartDataLabels.push(setLabel);

      this.chartDataOriginalSets.set(setLabel, chartDataOriginal);
      this.chartDataOriginal.push( chartDatum );

    });
  }

  private extractedIndividualPortfolios(assetClassGroups: AssetClassGroup[], calculation: Calculation) {
    if (this.individualPortfolios && this.individualPortfolios.length) {

      let portfolios: Portfolio[] = [];
      for (let i = 0; i < this.individualPortfolios.length; i++) {
        portfolios.splice(i, 0, this.individualPortfolios[i]);
      }

      this.chartDataLabels = PortfolioChartDataUtils.extractPortfolioLabels(portfolios);
      this.chartDataOriginal = PortfolioChartDataUtils.initializeChartData(assetClassGroups, this.chartDataLabels,
        calculation.efficientPortfoliosUser[0].setLabel, this.calculation);
    }
  }

  protected getPortfolioDatum( index: number, setLabel: string = null ): PortfolioChartDatumOriginal {

    return this.chartDataOriginalSets.get( setLabel )[ index ];

  }

  protected onInterpolatedPortfolioHandler(receivedPortfolios: InterpolatedPortfolio[]){

    if ( receivedPortfolios && receivedPortfolios.length ){

      receivedPortfolios.forEach( receivedPortfolio => {

        if ( receivedPortfolio != null ) {

          let leftIndex = receivedPortfolio.portfolioLeftIndex;
          let rightIndex = receivedPortfolio.portfolioRightIndex;

          const setLabel = receivedPortfolio.efficientPortfolioSet[0].setLabel;
          let portfolioLeft = this.getPortfolioDatum(leftIndex, setLabel);
          let portfolioRight = this.getPortfolioDatum(rightIndex, setLabel);

          let portfolioInterpolated = this.createInterpolatedPortfolioDatum(portfolioLeft, portfolioRight,
            receivedPortfolio, setLabel);

          portfolioInterpolated.portfolio = PortfolioUtil.calculateInterpolatedPortfolio( receivedPortfolio,
            receivedPortfolio.efficientPortfolioSet, this.calculation.assetClasses );

          let setIndex = this.chartDataLabels.lastIndexOf(setLabel);

          this.chartDataOriginal[setIndex] = portfolioInterpolated;

          let update = JavaCalculationsUtil.preparePortfolioUpdateCtr( portfolioInterpolated.portfolio, this.calculation );
          // this.debouncedUpdatePortfolioCtrEmitterMap.get( portfolioInterpolated.portfolio.setLabel )
          //   .next( update );
          // interpolated portfolio ctr will be updated in the next extractChartData() call

        }
        else {
          // remove bar?
        }

      });

      this.updateChart();
    }

  }

  private updateCtr(chartDataOriginalPrevious: PortfolioChartDatumOriginal[]) {
    chartDataOriginalPrevious.forEach( previousDatum => {
      const portfolioFrom = previousDatum.portfolio;
      if ( ! portfolioFrom ){
        return;
      }
      const setLabel = portfolioFrom.setLabel;

      const portfolioDatumTo = this.chartDataOriginal.filter( datum => datum.interpolated && datum.setLabel == setLabel )[0];
      const portfolioDatumWithCtr = PortfolioChartDataUtils.initializeChartData(this.calculation.assetClassGroups,
        [undefined], undefined, this.calculation, portfolioFrom.allocations)[0];

      PortfolioChartDataUtils.copyCtr( portfolioDatumWithCtr, portfolioDatumTo, this.chartDataLayers );
    } );
  }
}
