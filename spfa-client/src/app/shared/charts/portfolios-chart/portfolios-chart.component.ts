import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from "@angular/core";
import * as d3 from "d3";
import {ChartTooltip} from "../../chart-tooltip";
import {CalculationService} from "@app/base/calculation/calculation.service";
import {AssetClassGroup, Portfolio} from "@app/base/asset-class/asset-class.model";
import {ValueUtil} from "../../value.util";
import {PortfolioChartDataUtils} from "./portfolio-chart-data-utils";
import {ChartConfig} from "../../chart-config";
import {Subject, Subscription} from "rxjs";
import {PortfolioUtil} from "@app/base/calculation/portfolio.util";
import {NotificationService} from "../../notification/notification.service";
import {InterpolatedPortfolio} from "../multi-frontier-chart/multi-frontier-chart.model";
import {JavaCalculationsService} from "@app/base/calculation/java-calculations.service";
import {Calculation} from "@app/base/calculation/model/calculation.model";
import {
  PortfolioAllocationChartDatum,
  PortfolioChartDatumOriginal
} from "@app/shared/charts/portfolios-chart/portfolio-chart.model";
import {PortfolioCtrUpdate} from "@app/base/calculation/model/java-calculations.model";
import {JavaCalculationsUtil} from "@app/base/calculation/java-calculations.util";
import {MdDialog} from "@angular/material";
import {CopyPortfolioComponent} from "@app/shared/charts/portfolios-chart/copy-portfolio/copy-portfolio.component";

/**
 * Component is extended with ComparisonPortfoliosChartComponent!
 */
@Component({
  selector: 'portfolios-chart',
  templateUrl: 'portfolios-chart.component.html',
  styleUrls: ['../../chart-default.scss','portfolios-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PortfoliosChartComponent implements AfterViewInit, OnInit, OnDestroy {

  @ViewChild('chart') private chartContainer: ElementRef;

  @Input()
  protected efficientPortfolios: Portfolio[][];
  //noinspection JSMismatchedCollectionQueryUpdate
  @Input()
  protected individualPortfolios: Portfolio[] = [];

  @Input()
  protected onInterpolatedPortfolio: Subject<InterpolatedPortfolio[]>;

  @Input()
  calculatesOptimal: boolean = false;

  @Input()
  protected onOptimalPortfolioCalculated: Subject<any>;

  @Input()
  protected onOptimizeAllocations: EventEmitter<Portfolio>;

  @Input()
  protected onUserDefinedPortfolioRefresh: EventEmitter<any>;

  // protected debouncedUpdatePortfolioCtrEmitterMap = new Map<string,EventEmitter<PortfolioCtrUpdate>>();

  protected subscriptions: Array<Subscription> = [];

  protected calculation: Calculation;

  useSecondaryAxisY = false;

  /**
   * interpolated portfolio datum index in chart data
   */
  private optimalPortfolioIndex: number;
  private optimalPortfolioLabel: string;
  /**
   * last received InterpolatedPoint.portfolioLeftIndex from onInterpolatedPortfolio EventEmitter
   */
  private portfolioLeftIndexLastReceived: number;

  /**
   * stacked y values - https://github.com/d3/d3-shape/blob/master/README.md#stack
   * after d3.stack(), we can still access this.chartDataOriginal from this array with ['data'] key
   *
   * @type {Array}
   */
  private chartData: Array<any> = [];
  /**
   * Unstacked y values.
   * For to porpose of the d3.stack and its keys selection, looks like this has to be just a simple array.
   * Order of the array doesn't matter, important order is given by this.chartDataLayers.
   * @type {Array}
   */
  protected chartDataOriginal: PortfolioChartDatumOriginal[] = [];
  protected chartDataLabels: Array<string>;
  /**
   * number of chart layers / stacked bars (number of top level asset classes in each portfolio)
   */
  protected chartDataLayers: Array<string>;

  public config = {
    margin: { top: 20, bottom: 55, left: 65, right: 20},
    barPadding: 0.5,    // in % ?
    //colors: ["#627d77", "#a1b1ad", "#00a9e0", "#54c6eb", "#b1e7f8"],   // colors from UX team
    colors: ChartConfig.acColors,
    tickCount: 3,
    interpolatedStroke: 3,
    debugMode: false,
    ctrNegativeTolerance: -0.1,   // value between ctrNegativeTolerance and 0 are converted to 0
    portfolioCtrUpdateDebounce: 500 // ms
  };

  private text = {
    axisX: 'Portfolio',
    axisY: 'USD bn',
    axisYSecondary: 'Contribution to Risk (%)',
    interpolatedPortfolioLabel: 'Optimal'
  };

  dynamicStyles = {
    loaderDisplay: "block",
  };

  private chart: any;
  private width: number;
  private height: number;

  private xAxis: any;
  private yAxis: any;
  private yAxisGrid : any;

  protected xScale: any;
  private yScale: any;
  private colorScale = d3.scaleOrdinal(Array.from(this.config.colors.values()));
  private tooltip: any;

  constructor( protected calculationService: CalculationService,
               protected javaCalculationsService: JavaCalculationsService,
               private notificationService: NotificationService,
               private dialog: MdDialog
  ) {
    this.calculation = this.calculationService.getCalculation();
  }

  onCalculationRefresh(): void {
    this.extractChartData();

    this.createChart();
    this.updateChart();
  }

  ngOnInit(): void {
    this.dynamicStyles.loaderDisplay = "none";
  }

  ngAfterViewInit(): void {

    // this.initializeUpdatePortfolioCtrEmitters();

    this.extractChartData();
    if ( ! this.chartDataOriginal )
      return;

    this.createChart();
    this.updateChart();

    this.subscriptions.push( this.onInterpolatedPortfolio.subscribe( interpolatedPortfolio => {

      this.onInterpolatedPortfolioHandler(interpolatedPortfolio);

    }) );


    if ( this.onUserDefinedPortfolioRefresh ) {
      this.subscriptions.push( this.onUserDefinedPortfolioRefresh
        .debounceTime(500)
        .subscribe(() => {

          this.extractChartData();
          this.updateChart();

          // let update = JavaCalculationsUtil.preparePortfolioUpdateCtr(
          //   PortfolioUtil.getUserDefinedPortfolio( this.calculation ), this.calculation );
          // this.javaCalculationsService.updatePortfolioCtr( update );
        }) );
    }

    this.subscriptions.push( this.javaCalculationsService.onPortfolioCtrRefresh.subscribe(() => {
        this.extractChartData();
        this.updateChart();
      }) );

  }

  protected extractChartData(): boolean {

    const calculation = this.calculationService.getCalculation();
    let assetClassGroups: AssetClassGroup[]  = calculation.assetClassGroups;
    let portfolios: Portfolio[] = [];

    portfolios = calculation.efficientPortfoliosUser;

    for ( let i = 0; i < this.individualPortfolios.length; i++ ){
      portfolios.splice( i, 0, this.individualPortfolios[i] );
    }

    if ( ! assetClassGroups || ! portfolios || ! assetClassGroups.length || ! portfolios.length ) {
      console.info( "No data for the portfolios chart!" );
      return false;
    }

    let optimalInterpolated, optimalPosition;
    if ( this.isOptimalInterpolated() ){
      optimalInterpolated = this.chartDataOriginal[ this.optimalPortfolioIndex ];
      optimalPosition = this.chartDataLabels.indexOf(this.text.interpolatedPortfolioLabel);
    }

    this.chartDataLabels = PortfolioChartDataUtils.extractPortfolioLabels(portfolios);
    this.chartDataLayers = PortfolioChartDataUtils.extractPortfolioLayers(assetClassGroups);
    this.chartDataOriginal = PortfolioChartDataUtils.initializeChartData(
      assetClassGroups, this.chartDataLabels, calculation.efficientPortfoliosUser[0].setLabel,this.calculation);

    if ( optimalInterpolated && optimalPosition ){
      const optimalWithCtr = PortfolioChartDataUtils.initializeChartData(assetClassGroups, ["Optimal"], undefined,this.calculation)[0];
      PortfolioChartDataUtils.copyCtr( optimalWithCtr, optimalInterpolated, this.chartDataLayers );
      this.insertInterpolatedPortfolio( optimalPosition, optimalInterpolated );
    }

    console.log("portfolios chartDataOriginal:",this.chartDataOriginal);

    return true;
  }

  /**
   * Checks if we have the Optimal portfolio, and if this portfolio is interpolated from two other efficient portfolios.
   * That would mean, the Optimal is not exactly one of efficient portfolios A - I.
   * @returns {boolean}
   */
  private isOptimalInterpolated() {
    return this.optimalPortfolioIndex && this.optimalPortfolioLabel == this.text.interpolatedPortfolioLabel;
  }

  generateRandomData() {
    this.chartDataOriginal = [];
    this.chartDataLayers = ['assetClass1','assetClass2','assetClass3','assetClass4','assetClass5'];
    this.chartDataLabels = ['Current','U.Def','A','B','C','D','E','F','G','H','I'];

    for (let i = 0; i < this.chartDataLabels.length; i++) {
      let datum =  new PortfolioChartDatumOriginal();
      datum.label = this.chartDataLabels[i];
      datum.setLabel = "User-defined";

      this.chartDataLayers.forEach( (e,j) => {
        datum.layers[ this.chartDataLayers[j] ] = new PortfolioAllocationChartDatum();
        datum.layers[ this.chartDataLayers[j] ].navTotal = 1000000000 + Math.floor(Math.random() * 1000000000000);
      });

      this.chartDataOriginal.push( datum );
    }

    // normalize data
    let maxGlobal = d3.max( this.chartDataOriginal, d => {
      let internalMax = 0;
      this.chartDataLayers.forEach( (e,i) => internalMax += d[ this.chartDataLayers[i] ].navTotal  );
      return internalMax;
    });
    this.chartDataOriginal.forEach( datum => {
      let maxCurrent = 0;
      this.chartDataLayers.forEach((e,i) => {
        maxCurrent += datum.layers[ this.chartDataLayers[i] ].navTotal;
      });

      this.chartDataLayers.forEach((e,i) => {
        let globalPercent = maxGlobal / maxCurrent;
        let navTotal = globalPercent * datum.layers[ this.chartDataLayers[i] ].navTotal;
        datum.layers[ this.chartDataLayers[i] ].navTotal = navTotal;
        datum.layers[ this.chartDataLayers[i] ].navPercentage = navTotal / maxGlobal;
      });
    });

  }

  ngOnDestroy(): void {
    this.subscriptions.forEach( s => s.unsubscribe() );
  }

  private initializeUpdatePortfolioCtrEmitters() {
    this.efficientPortfolios.forEach(set => {
      const emitter = new EventEmitter<PortfolioCtrUpdate>();

      this.subscriptions.push(
        emitter
          .debounceTime(this.config.portfolioCtrUpdateDebounce)
          .subscribe((update: PortfolioCtrUpdate) => {
            // this.javaCalculationsService.updatePortfolioCtr(update);
          })
      );

      // this.debouncedUpdatePortfolioCtrEmitterMap.set(set[0].setLabel, emitter);
    });
  }

  private stackChartData(){
    let valueLambda;
    if ( this.useSecondaryAxisY ){
      valueLambda = (d,key) => d.layers[key] && d.layers[key].ctr ? this.processNegativeCtr( d.layers[key].ctr ) * 100 : 0;
    }
    else {
      valueLambda = (d,key) => d.layers[key] ? d.layers[key].navTotal : 0
    }

    let stack = d3.stack()
      .keys( this.chartDataLayers )
      .value( valueLambda )
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    this.chartData = stack( this.chartDataOriginal as any[] );

  }

  private processNegativeCtr(ctr: number): number {
    if ( ValueUtil.isNumber( ctr ) && ctr < 0){
      if ( ctr < this.config.ctrNegativeTolerance ) {
        console.warn( "Negative portfolio CtR value '%.4f' is smaller than negative tolerance '%f'!" ,
          ctr, this.config.ctrNegativeTolerance);
      }
      return 0;
    }
    return ctr;
  }

  private createChart() {

    if ( ! this.chartDataOriginal.length )
      return;

    this.stackChartData();

    let config = this.config;
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - config.margin.left - config.margin.right;
    this.height = element.offsetHeight - config.margin.top - config.margin.bottom;

    this.dynamicStyles.loaderDisplay = "none";

    // tooltip
    d3.select(element).select('.chart-tooltip').remove();
    this.tooltip = d3.select(element).append("div")
      .attr("class", "chart-tooltip")
      .style("display", "none");

    d3.select(element).select('svg').remove();
    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // define X & Y domains
    let xDomain = this.getXDomain();
    let yDomain = this.getYDomain();

    // create scales
    this.xScale = d3.scaleBand().padding(this.config.barPadding).domain(xDomain).rangeRound([0, this.width]);
    this.yScale = d3.scaleLinear().domain(yDomain as any).range([this.height, 0]);

    // x & y axis
    this.xAxis = svg.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top + this.height})`)
      .call(this.getXAxis());
    this.xAxis.append('text')
      .attr('class', 'axis-label')
      .attr('x', '50%')
      .attr('y', 35 )
      .style('text-anchor', 'middle')
      .style('alignment-baseline', 'hanging ') // hanging = top
      .text( this.text.axisX );
    this.xAxis.append('path')
      .attr('class', 'axis-x-line')
      .attr('d', `M0,0H${this.width}`);
    this.yAxis = svg.append('g')
      .attr('class', 'axis axis-y')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`)
      .call(this.getYAxis());
    this.yAxis.append('text')
      .attr('class', 'axis-label')
      .attr('x', - this.height / 2)
      .attr('y', -50)
      .attr("transform", `rotate(-90 )`)
      .style('text-anchor', 'middle')
      .text( this.useSecondaryAxisY ? this.text.axisYSecondary : this.text.axisY );
    this.yAxisGrid = svg.append('g')
      .attr('class', 'axis-grid')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`)
      .call(this.getYAxisGrid());
    this.yAxis.append('path')
      .attr('class', 'axis-y-line')
      .attr('d', `M0,0V${this.height}`);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'plotArea')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);

  }

  protected updateChart() {

    if (! this.chartDataOriginal || ! this.chart)
      return;

    this.stackChartData();

    // update scales & axis
    if (this.chartData.length) {
      this.xScale.domain(this.getXDomain());
      this.yScale.domain(this.getYDomain());
      this.xAxis.transition().call(this.getXAxis());
      this.yAxis.transition().call(this.getYAxis());
      this.yAxisGrid.transition().call(this.getYAxisGrid());
    }

    // LAYERS - STACKS

    let layer = this.chart.selectAll(".layer")
      .data(this.chartData);

    // enter
    let layerUpdateAndEnter = layer.enter()
      .append("g")
      .attr('class', "layer" )
    .merge(layer)   // enter + update
      .style("fill", (d, i) => this.colorScale(i) );

    // exit
    layer.exit().remove();

    // BAR IN LAYER - individual rectangles

    let rect = layerUpdateAndEnter.selectAll("rect.bar")
      .data( d => d );

    // enter rect in entering and updating layers
    rect.enter()
      .append("rect")
      .classed('bar', true)
      .classed('interpolated', d => d.data.label == this.optimalPortfolioLabel )
      .attr('x',d => this.xScale( d.data.label ))
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => this.height - this.yScale(d[1] - d[0]))
      .attr('y', d => this.yScale(d[1]) )
      .on("mouseover", this.onShowTooltip)
      .on("mouseout", this.onHideTooltip)
      .transition()
      .on('start', d => {   // hack for interpolated stroke
        if ( d.data.label == this.optimalPortfolioLabel ){
          this.chart.select('.interpolatedStroke').style('display','block');
        }
      });

    // update rect in entering and updating layers
    rect
      .attr('y', d => this.yScale(d[1]) )
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => this.height - this.yScale(d[1] - d[0]))
      .transition()
      .attr('x', d => this.xScale( d.data.label ))
      .on('end', d => {
        if ( d.data.label == this.optimalPortfolioLabel ){
          this.chart.select('.interpolatedStroke').style('display','block');
        }
      });

    // exit rect in entering and updating layers
    rect.exit()
      .remove();

    // INTERPOLATED STROKE - another rect behind the interpolated bar
    this.chart.select('.interpolatedStroke').remove();
    if ( this.optimalPortfolioIndex && this.chartDataOriginal[ this.optimalPortfolioIndex ] ){
      let interpolated = this.chartDataOriginal[ this.optimalPortfolioIndex ];
      this.chart.append("rect")
        .classed('interpolatedStroke',true)
        .style('display', 'none')
        .attr('x', this.xScale( interpolated.label ) )
        .attr('y', 0 )
        .attr('width', this.xScale.bandwidth() )
        .attr('height', this.height)
    }

    if (this.config.debugMode) {
      console.log('optimalLabel = %s, optimalPortfolioIndex = %d, chartDataOriginal[ optimalPortfolioIndex ] = ',
        this.optimalPortfolioLabel, this.optimalPortfolioIndex, this.chartDataOriginal[this.optimalPortfolioIndex]);
    }

  }

  protected onInterpolatedPortfolioHandler(receivedPortfolios: InterpolatedPortfolio[]){

    if ( receivedPortfolios && receivedPortfolios.length && receivedPortfolios[0] ){

      let receivedPortfolio = receivedPortfolios[0];

      let leftIndex = receivedPortfolio.portfolioLeftIndex;
      let rightIndex = receivedPortfolio.portfolioRightIndex;

      // INTERPOLATED
      if ( leftIndex != rightIndex ) {

        this.interpolatePortfolio(leftIndex, rightIndex, receivedPortfolio);

        let update = JavaCalculationsUtil.preparePortfolioUpdateCtr( this.calculation.optimalPortfolio, this.calculation );
        // this.debouncedUpdatePortfolioCtrEmitterMap.get( this.calculation.optimalPortfolio.setLabel )
        //   .next( update );
        // optimal portfolio ctr will be updated in the extractedChartData()
      }
      // OPTIMAL PORTFOLIO SET TO EXISTING - now we only need to highlight existing
      else {

        this.highlightExistingPortfolio(leftIndex);
      }
    }
    // nothing came
    else if ( this.optimalPortfolioIndex ) {

      this.removeInterpolatedFromChartData();

      this.optimalPortfolioIndex = null;
      this.optimalPortfolioLabel = null;
      this.portfolioLeftIndexLastReceived = null;

      this.updateChart();
    }
    else {
      this.portfolioLeftIndexLastReceived = null;
    }
  }

  private highlightExistingPortfolio(index: number) {

    // optimal exists and is interpolated
    if ( this.optimalPortfolioLabel == this.text.interpolatedPortfolioLabel) {
      this.removeInterpolatedFromChartData();
    }

    this.optimalPortfolioIndex = index + this.individualPortfolios.length;
    this.optimalPortfolioLabel = this.chartDataOriginal[index + this.individualPortfolios.length].label;

    this.portfolioLeftIndexLastReceived = index;
    this.onOptimalPortfolioCalculated.next();

    this.updateChart();
  }

  private removeInterpolatedFromChartData() {
    if ( this.chartDataLabels.indexOf(this.text.interpolatedPortfolioLabel) > 0 ) {
      this.chartDataLabels.splice(this.chartDataLabels.indexOf(this.text.interpolatedPortfolioLabel), 1);
      this.chartDataOriginal.splice(this.optimalPortfolioIndex, 1);
    }
  }

  protected getPortfolioDatum( index: number, setLabel: string = null ): PortfolioChartDatumOriginal {
    return this.chartDataOriginal[ index +this.individualPortfolios.length ];
  }

  protected interpolatePortfolio(leftIndex: number, rightIndex: number, interpolated: InterpolatedPortfolio) {

    let portfolioLeft = this.getPortfolioDatum(leftIndex);
    let portfolioRight = this.getPortfolioDatum(rightIndex);
    let portfolioInterpolated = this.createInterpolatedPortfolioDatum(portfolioLeft, portfolioRight,
      interpolated, this.text.interpolatedPortfolioLabel);

    this.processInterpolatedPortfolio(portfolioInterpolated, interpolated, rightIndex);
  }

  protected createInterpolatedPortfolioDatum(portfolioLeft: PortfolioChartDatumOriginal, portfolioRight: PortfolioChartDatumOriginal,
                                             interpolated: InterpolatedPortfolio, label: string): PortfolioChartDatumOriginal {
    let portfolioInterpolated = new PortfolioChartDatumOriginal();
    portfolioInterpolated.label = label;
    portfolioInterpolated.setLabel = interpolated.efficientPortfolioSet[0].setLabel;
    portfolioInterpolated.interpolated = true;

    this.chartDataLayers.forEach(layer => {
      portfolioInterpolated.layers[layer] = new PortfolioAllocationChartDatum();

      portfolioInterpolated.layers[layer].navTotal =
        portfolioLeft.layers[layer].navTotal + interpolated.position *
        (portfolioRight.layers[layer].navTotal - portfolioLeft.layers[layer].navTotal);
      portfolioInterpolated.layers[layer].navPercentage =
        portfolioLeft.layers[layer].navPercentage + interpolated.position *
        (portfolioRight.layers[layer].navPercentage - portfolioLeft.layers[layer].navPercentage);
      portfolioInterpolated.layers[layer].ctr = 0;   // needs to be calculated on BE

    });
    return portfolioInterpolated;
  }

  private processInterpolatedPortfolio(portfolioInterpolated: PortfolioChartDatumOriginal, interpolated: InterpolatedPortfolio, rightIndex: number) {
    // interpolated portfolio isn't currently displayed, or previously was highlighted
    if (!this.optimalPortfolioIndex || this.optimalPortfolioLabel != this.text.interpolatedPortfolioLabel) {

      this.insertInterpolatedPortfolio(rightIndex + this.individualPortfolios.length, portfolioInterpolated);

      this.updateChart();
    }
    // interpolated portfolio is displayed, but on a different position (last received is different then currently received)
    else if (this.portfolioLeftIndexLastReceived != null
      && this.portfolioLeftIndexLastReceived != interpolated.portfolioLeftIndex) {

      // previously was interpolated
      if (this.optimalPortfolioLabel == this.text.interpolatedPortfolioLabel) {

        // move label to a correct position
        this.chartDataLabels.splice(this.chartDataLabels.indexOf(this.text.interpolatedPortfolioLabel), 1);
        this.chartDataLabels.splice(rightIndex + this.individualPortfolios.length, 0, portfolioInterpolated.label);
      }

      this.chartDataOriginal[this.optimalPortfolioIndex] = portfolioInterpolated;

      this.updateChart();

    }
    // interpolated portfolio is displayed, on a correct position
    // when only interpolated portfolio changes, we don't need to update the whole chart
    else {
      this.chartDataOriginal[this.optimalPortfolioIndex] = portfolioInterpolated;

      this.stackChartData();

      // TODO: update data only for .interpolated bars, without data-join, and transition only .interpolated

      let layer = this.chart.selectAll(".layer")
        .data(this.chartData);
      let layerUpdateAndEnter = layer.enter().merge(layer);
      let rect = layerUpdateAndEnter.selectAll("rect")
        .data(d => d);

      d3.selectAll('.interpolated')
        .attr('y', d => {
          return this.yScale(d[1]);
        })
        .attr('height', d => this.height - this.yScale(d[1] - d[0]));

    }

    this.portfolioLeftIndexLastReceived = interpolated.portfolioLeftIndex;
    this.onOptimalPortfolioCalculated.next();
  }

  private insertInterpolatedPortfolio(rightIndex: number, portfolioInterpolated: PortfolioChartDatumOriginal) {
    this.optimalPortfolioIndex = this.chartDataOriginal.length;
    this.optimalPortfolioLabel = portfolioInterpolated.label;

    this.chartDataLabels.splice(rightIndex, 0, portfolioInterpolated.label);
    this.chartDataOriginal.push(portfolioInterpolated);
  }

  onChangeAxisY(checked: boolean){
    this.useSecondaryAxisY = checked;
    this.yAxis.selectAll('text')
      .text( this.useSecondaryAxisY ? this.text.axisYSecondary : this.text.axisY );
    this.updateChart();
  }

  public onShowTooltip = (d,i,j) => {
    d3.event.stopPropagation();

    let currentRect = j[i];
    let currentLayerDatum: any = d3.select( currentRect.parentNode ).datum();
    let layerKey = currentLayerDatum.key;

    let rect = d3.select(d3.event.currentTarget);
    rect.style("stroke", "black" );

    const navTotal = ValueUtil.formatBillion( d.data.layers[layerKey].navTotal );
    const navPercentage = ValueUtil.formatPercentRounded( d.data.layers[layerKey].navPercentage );
    const ctr = ValueUtil.formatPercentRounded( d.data.layers[layerKey].ctr, 2 );

    // tooltip content
    let html = '<strong>' + layerKey + '</strong><br/>';
    html += 'NAV: ' + navTotal + ' (' + navPercentage + ')';
    html += '<br/>CtR: ' + ctr;

    ChartTooltip.showTooltip( this.tooltip, this.chartContainer.nativeElement, html );
  };

  public onHideTooltip = (d,i) => {
    d3.event.stopPropagation();

    let rect = d3.select(d3.event.currentTarget);
    rect.style('stroke', 'none');

    ChartTooltip.hideTooltip( this.tooltip );
  };

  private getXAxis(){
    return d3.axisBottom(this.xScale);
  }
  private getYAxis(){
    return d3.axisLeft(this.yScale)
      .ticks(this.config.tickCount)
      .tickFormat( d => {
        if ( this.useSecondaryAxisY ){
          return d+"%"
        }
        else {
          return ValueUtil.getBillion( d as number ).toFixed();
        }
      } );
  }
  private getYAxisGrid(){
    return d3.axisLeft(this.yScale)
      .ticks(this.config.tickCount)
      .tickSize(-this.width)
      .tickFormat( d => "" );
  }

  private getXDomain() {
    return this.chartDataLabels;
  }
  private getYDomain() {
    return [0, d3.max(this.chartData[this.chartData.length - 1] as any, d => (d as any)[1])];
  }

  copyToUserDefined() {

    let dialogRef = this.dialog.open( CopyPortfolioComponent );

    let portfolios = [PortfolioUtil.getCurrentPortfolio(this.calculation) ];
    if ( this.optimalPortfolioIndex ) {
      portfolios.push(PortfolioUtil.getOptimalPortfolio(this.calculation));
    }
    this.efficientPortfolios.forEach( efPort => portfolios.push(...efPort));

    dialogRef.componentInstance.portfolios = portfolios;
    dialogRef.componentInstance.emitter = this.onOptimizeAllocations;

  }

  copyToClipboard() {
    let portfolios: Portfolio[] = this.individualPortfolios.slice();
    this.efficientPortfolios.forEach( ep => {
      ep.forEach( p => portfolios.push( p ) );
    });
    this.notificationService.openCopyDialog( PortfolioUtil.getPortfolioSnapshot( portfolios ) );
  }
}
