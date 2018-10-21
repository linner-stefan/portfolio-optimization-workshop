import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from "@angular/core";
import * as d3 from "d3";
import * as math from "mathjs";
import {CalculationService} from "@app/base/calculation/calculation.service";
import {ChartTooltip} from "../../chart-tooltip";
import {SSTRatio} from "@app/base/calculation/model/sst-ratio.model";
import {Subject} from "rxjs";
import {PortfolioUtil} from "@app/base/calculation/portfolio.util";
import {ValueUtil} from "../../value.util";
import {
  InterpolatedPoint,
  InterpolatedPortfolio,
  MultiFrontier,
  MultiFrontierChartDatum,
  MultiFrontierChartIndividualDatum,
  MultiFrontierConstants
} from "./multi-frontier-chart.model";
import {Portfolio} from "@app/base/asset-class/asset-class.model";
import {Calculation} from "@app/base/calculation/model/calculation.model";
import {NotificationService} from "../../notification/notification.service";
import {
  AxisX0,
  AxisX1,
  AxisX2,
  AxisX3,
  AxisY0,
  AxisY1,
  MultiFrontierAxis
} from "@app/shared/charts/multi-frontier-chart/multi-frontier-chart.config";
import {ChartForceLabels} from "@app/shared/charts/chart-force-labels/chart-force-labels.component";
import {
  ChartForceDatum,
  ChartForceDatumRepulsion
} from "@app/shared/charts/chart-force-labels/chart-force-labels.model";
import {GeometryUtil} from "@app/util/geometry.util";

@Component({
  selector: 'multi-frontier-chart',
  templateUrl: 'multi-frontier-chart.component.html',
  styleUrls: ['../../chart-default.scss','multi-frontier-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MultiFrontierChartComponent implements AfterViewInit,OnInit,OnDestroy {

  @Input()
  singleFrontier: boolean = false;

  @Input()
  private emitOutside: boolean = true;

  @ViewChild('chart') private chartContainer: ElementRef;

  @Input()
  private onInterpolatedPortfolio: Subject<InterpolatedPortfolio[]>;

  @Input()
  private onOptimalTrackingErrorChange: EventEmitter<any>;

  @Input()
  private onSSTRatioChange: EventEmitter<any>;
  private onSSTRatioChangeSubscription;


  @HostListener('window:resize')
  onResize() {
    // TODO: responsive resize
  }

  private calculation: Calculation;
  private sstRatio: SSTRatio;
  private navSum: number;

  /**
   * Array (one for every frontier curve) of currently displayed data arrays in the chart
   */
  private chartData: MultiFrontier[] = [];
  /**
   * [minDomain, maxDomain]
   * minDomain - minimum x value in chartData
   * maxDomain - maximum x value in chartData
   */
  private chartDataDomainX;
  /**
   * Individual points displayed in the chart separately from the frontier curve
   */
  chartDataIndividualPoints: MultiFrontierChartIndividualDatum[] = [];

  private interpolatedPortfolio: InterpolatedPortfolio = new InterpolatedPortfolio();
  private isInterpolatedPoint = false;

  dynamicStyles = {
    loaderDisplay: "block",
  };

  config = {
    axisXTypes: undefined,
    axisYTypes: undefined,
    margin: { top: 20, bottom: 55, left: 65, right: 20},  // also fox Axis ticks
    marginAxisLabel: { bottom: 40, left: 20},
    dotRadius: 3,                   //px
    dotRadiusForLabelRepulsion: 5,  //px
    labelRepulsionDensity: 1/20,
    selectorCircleRadius: 4,        //px
    labelOffset: 20,
    individualPointRectSize: 16,
    individualPointLabelOffset: 24,
    textNewLineSize: 10,
    tooltipExtraOffset: -20,
    colors: ['#0F4DBC', '#087bce', '#00A9E0' ],
    colorCurrent: '#64ab1c',
    colorUserDefined: '#087bce',
    drawVerticalSelectorOutsideOfDomain: false,
  };

  constConfig = {
    taxRate: 0.23,
    reportedShortfall: 17.638,  // USD
    alpha: 3.44883676004801,
    expenseRatio: 0.0017
  };

  axisXType: MultiFrontierAxis;
  axisYType: MultiFrontierAxis;
  constants: MultiFrontierConstants;

  private chart: any;
  private width: number;
  private height: number;

  private xAxis: any;
  private yAxis: any;
  private labels : any;
  private chartForceLabels: ChartForceLabels;
  private chartForceData: ChartForceDatum[];
  private chartForceDataRepulsion: ChartForceDatumRepulsion[];  // dummy points to prevent overlaps with the curve

  static readonly ROUND: number = 2;

  private xScale: any;
  private yScale: any;
  private tooltip: any;

  private plotAreaDataPoints: any;
  private mouseCapture: any;
  private verticalSelector: any;
  private verticalSelectorCircles: any;

  private line = d3.line()
    .x( (d:any) => this.xScale(d.x( this.axisXType )) )
    .y( (d:any) => this.yScale(d.y( this.axisYType )) );

  constructor(
    private calculationService: CalculationService,
    private notificationService: NotificationService ) {

    this.calculation = calculationService.getCalculation();

    this.constants = new MultiFrontierConstants(
      ValueUtil.getBillion( this.calculation.navSum ),
      this.constConfig.taxRate,
      this.constConfig.reportedShortfall,
      this.constConfig.alpha,
      0,
      0,
      this.constConfig.expenseRatio
    );

    this.config.axisXTypes = [new AxisX0(this.constants), new AxisX1(this.constants), new AxisX2(this.constants), new AxisX3(this.constants)];
    this.config.axisYTypes = [new AxisY0(this.constants), new AxisY1(this.constants)];

    this.axisXType = this.config.axisXTypes[0];
    this.axisYType = this.config.axisYTypes[0];
  }

  ngOnInit(): void {
    this.dynamicStyles.loaderDisplay = "none";
  }

  ngAfterViewInit(): void {

    this.sstRatio = this.calculation.sstRatio;
    if ( this.singleFrontier ) {
      this.navSum = this.calculation.navSum;
    }

    if ( ! this.extractChartData() )
      return;

    this.createAndUpdateChart();

    if ( this.singleFrontier ) {
      this.onSSTRatioChangeSubscription = this.onSSTRatioChange.subscribe( () => {

        this.constants.diversificationFactor = this.calculation.sstRatio.diversificationFactor;
        this.extractCreateAndUpdate();

      });
    }
  }

  onCalculationRefresh(){
    console.log("frontier chart onRefresh");
    this.extractCreateAndUpdate();
  }

  extractCreateAndUpdate(){
    this.chartData = [];
    this.chartDataIndividualPoints = [];
    if ( ! this.extractChartData() )
      return;

    this.createAndUpdateChart();

    this.updateVerticalSelector();
  }

  createAndUpdateChart() {
    this.createChart();
    this.updateChart();
  }

  private extractChartData(): boolean {

    const calculation: Calculation = this.calculationService.getCalculation();

    this.mergeEqualPoints();

    if ( this.singleFrontier ) {

      // efficient portfolios
      this.appendToChartData(calculation.efficientPortfoliosUser);

      return true;
    }
    else {

      this.appendToChartData(calculation.efficientPortfoliosUser);
      this.appendToChartData(calculation.efficientPortfoliosMarket);
      this.appendToChartData(calculation.efficientPortfoliosIs);

      return true;
    }
  }

  private appendToChartDataIndividual(point: Portfolio, color: string ) {
    let datum = new MultiFrontierChartIndividualDatum(point.trackingError, point.portfolioReturn,
      point.label, point.setLabel, color);

    this.chartDataIndividualPoints.push(datum);
  }

  private appendToChartData(portfolios: Portfolio[]): boolean {
    if (!portfolios || !portfolios.length) {
      console.info("No data for the frontier chart!");
      return false;
    }

    let data: MultiFrontierChartDatum[] = [];
    portfolios.forEach(portfolio => {

      let datum = new MultiFrontierChartDatum(portfolio.trackingError, portfolio.portfolioReturn,
        portfolio.label, portfolio.setLabel);
      data.push(datum);

    });
    this.chartData.push(new MultiFrontier(data[0].frontierName, data, portfolios));
  }

  private mergeEqualPoints() {
    let previousDatum: MultiFrontierChartIndividualDatum;
    let indexesToRemove: number[] = [];
    this.chartDataIndividualPoints.forEach((datum, index) => {

      //noinspection JSSuspiciousNameCombination
      if (previousDatum
        && math.round(previousDatum.x( this.axisXType ) * 100, MultiFrontierChartComponent.ROUND) == math.round(datum.x( this.axisXType ) * 100, MultiFrontierChartComponent.ROUND)
        && math.round(previousDatum.y( this.axisYType ) * 100, MultiFrontierChartComponent.ROUND) == math.round(datum.y( this.axisYType ) * 100, MultiFrontierChartComponent.ROUND)) {

        previousDatum.label += ', ' + datum.label;
        indexesToRemove.push(index);

      }

      previousDatum = datum;
    });

    indexesToRemove.forEach( index => this.chartDataIndividualPoints.splice( index, 1 ) );
  }

  ngOnDestroy(): void {
    ChartTooltip.hideTooltip( this.tooltip );
    if ( this.onSSTRatioChangeSubscription )
      this.onSSTRatioChangeSubscription.unsubscribe();
  }

  private generateData() {
    let mockDataX = [0.009104996, 0.011682351, 0.015377855, 0.01986376, 0.02578428, 0.03278029, 0.040624446, 0.048793272, 0.057806937];
    let mockDataY = [0.008587407, 0.010481744, 0.012376082, 0.014270419, 0.016164756, 0.018059093, 0.019953431, 0.021847768, 0.023742105];

    let mockDataX2 = [], mockDataY2 = [], mockDataX3 = [], mockDataY3 = [];
    mockDataX.forEach( e => {
      mockDataX2.push(e + 0.005 );
      mockDataX3.push( e - 0.005 );
    });
    mockDataY.forEach( e => {
      mockDataY2.push(e + 0.01 );
      mockDataY3.push( e - 0.01 );
    });

    this.chartData[0] = new MultiFrontier('frontier1', [],[]);
    this.chartData[1] = new MultiFrontier('frontier2', [],[]);
    this.chartData[2] = new MultiFrontier('frontier3', [],[]);
    mockDataX.forEach((e, i) => this.chartData[0].data.push(new MultiFrontierChartDatum( mockDataX[i], mockDataY[i], 'l'+i, 'frontier1')));
    mockDataX2.forEach((e, i) => this.chartData[1].data.push(new MultiFrontierChartDatum( mockDataX2[i], mockDataY2[i], 'l'+i, 'frontier2')));
    mockDataX3.forEach((e, i) => this.chartData[2].data.push(new MultiFrontierChartDatum( mockDataX3[i], mockDataY3[i], 'l'+i, 'frontier3')));

    this.chartDataIndividualPoints.push( new MultiFrontierChartIndividualDatum(0.03, 0.012, 'Current','',this.config.colorCurrent) );
    this.chartDataIndividualPoints.push( new MultiFrontierChartIndividualDatum(0.05, 0.02, 'User-defined','',this.config.colorUserDefined) );
  }

  private createChart() {

    if ( ! this.chartData.length )
      return;

    let config = this.config;
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - config.margin.left - config.margin.right;
    this.height = element.offsetHeight - config.margin.top - config.margin.bottom;

    this.dynamicStyles.loaderDisplay = "none";

    // remove all children elements, when calling createChart() once again
    d3.select(element).html('');

    // tooltip
    this.tooltip = d3.select(element).append("div")
      .attr("class", "chart-tooltip")
      .style("display", "none");

    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // define X & Y domains
    let xDomain = this.getXDomain();
    let yDomain = this.getYDomain();

    // create scales
    this.xScale = d3.scaleLinear().domain(xDomain).range([0, this.width]);
    this.yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0]);

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
      .text( this.axisXType.label );
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
      .text( this.axisYType.label );
    this.yAxis.append('path')
      .attr('class', 'axis-y-line')
      .attr('d', `M0,0V${this.height}`);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'plotArea')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);

    this.plotAreaDataPoints = this.chart.append('g')
      .attr('class', 'plotAreaDataPoints');

    // labels layer
    this.labels = svg.append("g")
      .attr("class", "label")
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);

    this.verticalSelector = this.chart.append('path')
      .attr('class','vertical-selector vertical-line');
    this.verticalSelectorCircles = this.chart.append('g')
      .classed('vertical-selector-circles', true);

    // invisible mouse enter capture placeholder
    this.mouseCapture = svg.append('rect')
      .classed('mouse-capture', true)
      .classed('cursor-none', false)
      .style('visibility', 'hidden')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`)
      // .on('mouseenter', this.onMouseEnter)
      .on('mouseleave', this.onMouseLeave)
      .on('mousedown', this.onMouseDown)
      .on('mouseup', this.onMouseUp);
      // .on('click', this.onClick);
  }

  private updateChart() {

    if ( ! this.chart )
      return;

    this.chartForceData = [];
    this.chartForceDataRepulsion = [];
    this.chartData.forEach( (frontier,index) => {

      let color:string = this.config.colors[ index ];
      this.drawFrontierCurve( frontier, color || this.config.colors[ 1 ] );

    });

    this.chartDataIndividualPoints.forEach( (point) => {

      this.appendIndividualPoint( point );

    });

    this.updateVerticalSelector();

    // chart labels
    if ( this.chartForceLabels ){
      this.chartForceLabels.remove();
    }
    this.chartForceLabels = new ChartForceLabels( this.chartForceData, this.chartForceDataRepulsion,
      this.labels, this.width, this.height, true, 0.5 );
    this.chartForceLabels.update();

  }

  private drawFrontierCurve(frontier: MultiFrontier, color: string) {

    // update scales & axis
    if (frontier.data.length) {
      this.xScale.domain(this.getXDomain());
      this.yScale.domain(this.getYDomain());
      this.xAxis.transition().call(this.getXAxis());
      this.yAxis.transition().call(this.getYAxis());

      // frontier.data.sort((a, b) => a.x( this.axisXType ) - b.x( this.axisXType ));
    }

    console.log("frontier curve:",frontier.data);

    const currentFrontier = frontier.name;

    this.plotAreaDataPoints.datum(frontier.data);

    // frontier curve
    this.plotAreaDataPoints.append("path")
      .attr("class", "line" )
      .attr("d", this.line)
      .style("stroke", color);
    // frontier curve points
    this.plotAreaDataPoints.append('g')
      .attr('class', currentFrontier)
      .selectAll(".dot")
      .data(frontier.data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => this.xScale(d.x( this.axisXType )))
      .attr("cy", d => this.yScale(d.y( this.axisYType )))
      .attr("r", this.config.dotRadius)
      .style("fill", color);

    // frontier curve labels
    if ( this.singleFrontier ) {
      this.prepareFrontierCurveLabels(frontier);
    }

    this.prepareFrontierCurveRepulsion(frontier);

    this.prepareFrontierLabels(frontier);

  }

  private prepareFrontierLabels(frontier: MultiFrontier) {
    const lastPoint = frontier.data[frontier.data.length - 1];
    const chartForceDatum = new ChartForceDatum();

    this.updateChartForceDatum(lastPoint, chartForceDatum, this.config.dotRadiusForLabelRepulsion);
    chartForceDatum.label = lastPoint.frontierName;

    this.pushChartForceDatum(chartForceDatum, this.chartForceData);
  }

  private prepareFrontierCurveRepulsion(frontier: MultiFrontier) {
    frontier.data.forEach((datum, index) => {

      if (index === frontier.data.length - 1) {
        return;
      }

      const xStart = datum.x(this.axisXType);
      const datumNext = frontier.data[index + 1];
      const xEnd = datumNext.x(this.axisXType);

      for (let x = xStart;
                x < xEnd;
                x += this.config.dotRadiusForLabelRepulsion / (this.getXDomain()[1] - this.getXDomain()[0])
                  * this.config.labelRepulsionDensity ) {

        const chartForceDatum = new ChartForceDatum();
        this.updateChartForceDatum(datum, chartForceDatum, this.config.dotRadiusForLabelRepulsion);

        const y = GeometryUtil.getIntersectionY(x,
          datum.x(this.axisXType), datum.y(this.axisYType), datumNext.x(this.axisXType), datumNext.y(this.axisYType));

        chartForceDatum.x = this.xScale(x);
        chartForceDatum.y = this.yScale(y);
        chartForceDatum.fx = this.xScale(datum.x(this.axisXType)) - this.config.labelOffset / 2;
        chartForceDatum.fy = this.yScale(datum.y(this.axisYType)) - this.config.labelOffset / 2;

        const chartForceDatumRepulsion = new ChartForceDatumRepulsion(chartForceDatum);
        this.pushChartForceDatum(chartForceDatumRepulsion, this.chartForceDataRepulsion);
      }
    });
  }

  private prepareFrontierCurveLabels(frontier: MultiFrontier) {
    frontier.data.forEach(datum => {

      const chartForceDatum = new ChartForceDatum();
      this.updateChartForceDatum(datum, chartForceDatum, this.config.dotRadiusForLabelRepulsion);

      chartForceDatum.fx = this.xScale(datum.x(this.axisXType)) - this.config.labelOffset / 2;
      chartForceDatum.fy = this.yScale(datum.y(this.axisYType)) - this.config.labelOffset / 2;

      this.pushChartForceDatum(chartForceDatum, this.chartForceData);
    });
  }

  private pushChartForceDatum(chartForceDatum: ChartForceDatum | ChartForceDatumRepulsion,
                              array: (ChartForceDatum | ChartForceDatumRepulsion)[] ) {
    const duplicate = array.findIndex( d =>
      d.x === chartForceDatum.x && d.y === chartForceDatum.y && d.label === chartForceDatum.label
    );
    if ( duplicate === undefined ){
      return;
    }
    array.push(chartForceDatum);
  }

  private updateChartForceDatum(from: MultiFrontierChartDatum, to: ChartForceDatum, radius: number) {
    to.id = this.chartForceData.length + 1;
    to.x = this.xScale(from.x(this.axisXType));
    to.y = this.yScale(from.y(this.axisYType));
    to.label = from.label;
    to.radius = radius;
  }

  private updateVerticalSelector() {
    const helperDatum = new MultiFrontierChartDatum(
      0,undefined,undefined,undefined
    );
    let positionX = this.xScale( helperDatum.x( this.axisXType ) );

    if ( positionX ) {
      this.calcVerticalSelector(positionX);
    }
  }

  private appendIndividualPoint( point: MultiFrontierChartIndividualDatum ) {
    if ( ! point ){
      return;
    }

    let currentPointX = this.xScale(point.x( this.axisXType ));
    let currentPointY = this.yScale(point.y( this.axisYType ));
    const size = this.config.individualPointRectSize;

    const x = currentPointX - size / 2;
    const y = currentPointY - size / 2;

    // draw also lines intersecting individual points
    if ( ! this.singleFrontier ){
      this.plotAreaDataPoints.append('path')
        .attr('class','vertical-line')
        .attr('stroke',point.color)
        .attr('d', `M${ currentPointX } 0 V${this.height}`);
    }

    this.plotAreaDataPoints.append('rect')
      .attr('class', 'individual-point ' + point.label.replace(',',''))
      .attr('x', x)
      .attr('y', y)
      .attr('width', size)
      .attr('height', size)
      .style('fill', point.color );

    // label
    const chartForceDatum = new ChartForceDatum();
    this.updateChartForceDatum(point, chartForceDatum, this.config.individualPointRectSize / 2 );
    this.pushChartForceDatum(chartForceDatum, this.chartForceData);

  }

  private mouseDown: boolean = false;

  public onMouseMove = () => {

    d3.event.stopPropagation();

    if (!this.mouseDown)
      return;

    let mousePositionX = d3.mouse(this.mouseCapture.node())[0];   // [x,y]

    this.calcVerticalSelector(mousePositionX, true);
  };

  private calcVerticalSelector(positionX: number, mouse:boolean = false): number {
    let positionXDomain = this.xScale.invert(positionX);
    let positionXDomainAdjusted = this.getPositionXDomainChartData( positionXDomain );
    let positionXAdjusted = this.xScale(positionXDomainAdjusted);

    this.isInterpolatedPoint = false;

    // calculated interpolated points on all frontiers
    const interpolatedPoints: InterpolatedPoint[] = [];
    this.chartData.forEach( frontier => {

      let interpolatedPoint = this.findInterpolatedPoint(positionXDomainAdjusted, frontier, mouse);
      interpolatedPoints.push( interpolatedPoint );

    });

    this.verticalSelectorCircles.selectAll('circle').remove();

    // TODO: no need to draw the vertical selector line multiple times
    let tooltipHtml = '';
    let tooltipAnchorX;
    let tooltipY;
    let interpolatedPortfoliosToEmit: InterpolatedPortfolio[] = [];
    interpolatedPoints.forEach( ipp => {

      // close to an existing point - locked movement
      if (ipp.anchorX && ipp.anchorY) {

        positionXDomainAdjusted = ipp.anchorX;
        positionXAdjusted = this.xScale(ipp.anchorX);

        this.drawInterpolatedCircle(this.xScale(ipp.anchorX),this.yScale(ipp.anchorY), true);
        this.drawVerticalSelector(this.xScale(ipp.anchorX));

        tooltipHtml = this.addToTooltipHtml(tooltipHtml, ipp.anchorY, ipp.frontierName );
        tooltipAnchorX = ipp.anchorX;
        tooltipY = ipp.anchorY;

        if ( this.emitOutside ) {
          if ( this.singleFrontier ) {
            PortfolioUtil.calculateOptimalPortfolio(this.calculationService.getCalculation(), ipp.lockedPortfolio);
          }
          interpolatedPortfoliosToEmit.push(ipp.lockedPortfolio); // fire event after calculation of new optimal portfolio
        }
      }
      // interpolated point between two points - free movement
      else if ( ipp.intersectionY ) {

        this.drawInterpolatedCircle(positionXAdjusted,this.yScale(ipp.intersectionY));
        this.drawVerticalSelector(positionXAdjusted);

        tooltipHtml = this.addToTooltipHtml(tooltipHtml, ipp.intersectionY, ipp.frontierName );
        tooltipY = ipp.intersectionY;

        if ( this.emitOutside ) {
          if ( this.singleFrontier ) {
            PortfolioUtil.calculateOptimalPortfolio(this.calculationService.getCalculation(), ipp.interpolatedPortfolio ? ipp.interpolatedPortfolio : null);
          }
          interpolatedPortfoliosToEmit.push( ipp.interpolatedPortfolio ? ipp.interpolatedPortfolio : null);
        }

      }
      // outside of x domain - free movement
      else {

        //this.drawOutsideOfDomain(positionXAdjusted);

        if ( this.emitOutside ) {
          if ( this.singleFrontier ) {
            PortfolioUtil.calculateOptimalPortfolio(this.calculationService.getCalculation(), null);
          }
          interpolatedPortfoliosToEmit.push( null );
        }
      }

    });

    // fire event after calculation of new optimal portfolio
    // emitting also null portfolios
    if ( interpolatedPortfoliosToEmit.length ) {
      this.onInterpolatedPortfolio.next( interpolatedPortfoliosToEmit );
    }

    // draw tooltip
    if ( tooltipHtml ) {
      tooltipHtml += this.axisXType.labelTooltip + ': ' + this.axisXType.tooltipFormat(positionXDomainAdjusted);

      ChartTooltip.showTooltip(this.tooltip, this.chartContainer.nativeElement, tooltipHtml,
        positionXAdjusted, !mouse && tooltipY ? this.yScale(tooltipY) + this.config.tooltipExtraOffset : null);

    }

    // in cases drawVerticalSelectorOutsideOfDomain is false, we have to notify SST ratio back to revert selected TE to TE from the frontier
    if ( this.singleFrontier ) {
      const optimalTrackingErrorNew = this.axisXType.variable( positionXDomainAdjusted );
      // let hasChanges = (ValueUtil.round(this.sstRatio.optimalTrackingError, 4) != ValueUtil.round(optimalTrackingErrorNew, 4));
      let hasChanges = true;
      // this.sstRatio.optimalTrackingError = optimalTrackingErrorNew;
      this.onOptimalTrackingErrorChange.next();
      if (hasChanges) {
        this.calculationService.calculationChangeHandler.next();
      }
    }

    return positionXDomainAdjusted;

  }

  private getPositionXDomainChartData(positionXDomain: number): number {
    const min = this.chartDataDomainX[0];
    const max = this.chartDataDomainX[1];

    if ( positionXDomain >= min && positionXDomain <= max ){
      return positionXDomain;
    }
    if ( positionXDomain < min ){
      return min;
    }
    if ( positionXDomain > max ){
      return max;
    }
    console.error( "getPositionXDomainChartData unknown positionXDomain '%f', min '%f', max '%f", positionXDomain, min, max );
  }


  private drawVerticalSelector(x:number) {
    this.verticalSelector
      .attr('d', `M${ x } 0 V${this.height}`);
  }

  private drawInterpolatedCircle(x:number,y:number,anchorCircle:boolean = false) {
    this.verticalSelectorCircles.append('circle')
      .attr('class', 'vertical-selector-circle')
      .attr('r', this.config.selectorCircleRadius)
      .attr('cx', x)
      .attr('cy', y)
      .classed('anchor-circle', anchorCircle)
      .style('visibility', 'visible');
  }

  private findInterpolatedPoint(positionXDomain: number, frontier: MultiFrontier, mouse: boolean): InterpolatedPoint {

    let interpolatedPoint = new InterpolatedPoint( frontier.name );
    const snapping = this.singleFrontier;

    for (let i = 0; i < frontier.data.length - 1; ++i) {
      let x1 = frontier.data[i].x( this.axisXType );
      let y1 = frontier.data[i].y( this.axisYType );
      let x2 = frontier.data[i + 1].x( this.axisXType );
      let y2 = frontier.data[i + 1].y( this.axisYType );

      // outside frontier left
      if ( snapping && ! this.config.drawVerticalSelectorOutsideOfDomain && i == 0 && positionXDomain < x1 ){
        interpolatedPoint.anchorX = x1;
        interpolatedPoint.anchorY = y1;
        interpolatedPoint.lockedPortfolio = this.getLockedPortfolio(i, frontier.efficientPortfolios);
        break;
      }
      // outside frontier right
      else if ( snapping && ! this.config.drawVerticalSelectorOutsideOfDomain && i == frontier.data.length - 2 && positionXDomain > x2 ){
        interpolatedPoint.anchorX = x2;
        interpolatedPoint.anchorY = y2;
        interpolatedPoint.lockedPortfolio = this.getLockedPortfolio(i, frontier.efficientPortfolios);
        break;
      }
      // inside frontier
      // TODO: two points are closer to each-other than snapTolerance
      else if (positionXDomain >= x1 && positionXDomain <= x2 ) {

        // snapping
        if (snapping && ( mouse && this.shouldSnapEagerly(positionXDomain, x1)
          || !mouse && this.shouldSnapLazily(positionXDomain, x1) )) {

          interpolatedPoint.anchorX = x1;
          interpolatedPoint.anchorY = y1;
          interpolatedPoint.lockedPortfolio = this.getLockedPortfolio(i, frontier.efficientPortfolios);
        }
        else if (snapping && ( mouse && this.shouldSnapEagerly(-positionXDomain, -x2)
          || !mouse && this.shouldSnapLazily(positionXDomain, x2) )) {

          interpolatedPoint.anchorX = x2;
          interpolatedPoint.anchorY = y2;
          interpolatedPoint.lockedPortfolio = this.getLockedPortfolio(i + 1, frontier.efficientPortfolios);
        }
        //interpolating
        else {
          interpolatedPoint.intersectionY = GeometryUtil.getIntersectionY(positionXDomain, x1, y1,
            x2, y2);

          interpolatedPoint.interpolatedPortfolio = new InterpolatedPortfolio();
          interpolatedPoint.interpolatedPortfolio.portfolioLeftIndex = i;
          interpolatedPoint.interpolatedPortfolio.portfolioRightIndex = i + 1;
          interpolatedPoint.interpolatedPortfolio.position = (positionXDomain - x1) / (x2 - x1);
          interpolatedPoint.interpolatedPortfolio.efficientPortfolioSet = frontier.efficientPortfolios;
          this.interpolatedPortfolio = interpolatedPoint.interpolatedPortfolio;
          this.isInterpolatedPoint = true;

        }
        break;
      }

    }

    return interpolatedPoint;
  }

  private shouldSnapLazily(positionXDomain: number, x: number) {
    return ValueUtil.round(positionXDomain, 4) == ValueUtil.round(x, 4);
  }

  private shouldSnapEagerly(positionXDomain: number, x: number) {
    return positionXDomain < (x + this.axisXType.snapTolerance);
  }

  private drawOutsideOfDomain(mousePositionX: number) {
    this.drawVerticalSelector(mousePositionX);
    ChartTooltip.hideTooltip(this.tooltip);
  }

  private getLockedPortfolio(index: number, efficientPortfolios: Portfolio[]): InterpolatedPortfolio {
    let lockedPoint = new InterpolatedPortfolio();
    lockedPoint.efficientPortfolioSet = efficientPortfolios;
    lockedPoint.portfolioLeftIndex = index;
    lockedPoint.portfolioRightIndex = index;
    return lockedPoint;
  }

  private addToTooltipHtml(html: string, y: number, label: string): string {

    html += this.axisYType.labelTooltip + ': ' + this.axisYType.tooltipFormat(y);
    html += this.singleFrontier ? '<br/>' : ' (' + label + ')<br/>';
    return html;
  }

  public onMouseLeave = () => {

    this.mouseDown = false;
    this.mouseCapture.on('mousemove', null);
  };

  public onMouseDown = () => {

    d3.event.stopPropagation();
    this.mouseDown = true;
    this.mouseCapture.on('mousemove', this.onMouseMove)
      // .on('mouseenter', this.onMouseEnter)
      .on('mouseleave', this.onMouseLeave)
      .classed('cursor-none', true);

    this.onMouseMove();
  };

  public onMouseUp = () => {

    d3.event.stopPropagation();
    this.mouseDown = false;
    this.mouseCapture
      .classed('cursor-none', false)
      .on('mousemove', null);
  };

  private getXAxis(){
    return d3.axisBottom(this.xScale).tickFormat(this.axisXType.axisFormat as any);
  }
  private getYAxis(){
    return d3.axisLeft(this.yScale).tickFormat(this.axisYType.axisFormat as any);
  }

  private getXDomain() {
    let domain = this.getDomain();
    let maxDomain = d3.max(domain, d => d.x( this.axisXType ) );
    let minDomain = d3.min(domain, d => d.x( this.axisXType ) );
    this.chartDataDomainX = [minDomain, maxDomain];
    let range = maxDomain - minDomain;
    return [ Number(minDomain) -  range*0.1, Number(maxDomain) +  range*0.1 ];
  }

  private getYDomain() {
    let domain = this.getDomain();
    let maxDomain = d3.max(domain, d => d.y( this.axisYType ) );
    let minDomain = d3.min(domain, d => d.y( this.axisYType ) );
    let range = maxDomain - minDomain;
    return [ Number(minDomain) -  range*0.3, Number(maxDomain) +  range*0.3 ];
  }

  private getDomain() {
    let domain = [];
    this.chartData.forEach( frontier => {
      frontier.data.forEach( datum => {
        domain.push( datum );
      });
    });
    this.chartDataIndividualPoints.forEach( datum => {
      domain.push( datum );
    });
    return domain;
  }

  copy() {
    const calculation = this.calculationService.getCalculation();
    let portfolios: Portfolio[] = [];
    if ( this.singleFrontier ){
      portfolios = portfolios.concat( calculation.currentPortfolio )
        .concat( calculation.userDefinedPortfolio )
        .concat( calculation.efficientPortfoliosUser );
    }
    else {
      portfolios = portfolios.concat( calculation.efficientPortfoliosUser )
          .concat( calculation.efficientPortfoliosMarket )
          .concat( calculation.efficientPortfoliosIs );
    }
    this.notificationService.openCopyDialog( PortfolioUtil.getPortfolioFrontierMultiSnapshot( portfolios,this.axisXType,this.axisYType ) );
  }

}
