import {Component, OnInit, ViewEncapsulation, ElementRef, ViewChild, Input, OnChanges} from "@angular/core";
import * as d3 from "d3";
import {ValueUtil} from "@app/shared/value.util";
import {DistributionChartInput} from "@app/shared/charts/distribution-chart/distribution-chart.model";

/**
 * Distribution chart operates with the specific distribution - Student's t5.
 */
@Component({
  selector: 'app-distribution-chart',
  templateUrl: './distribution-chart.component.html',
  styleUrls: ['../../../shared/chart-default.scss','distribution-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DistributionChartComponent implements OnInit, OnChanges {

  @ViewChild('chartRef') private chartContainer: ElementRef;

  @Input('input')
  private input: DistributionChartInput;
  private chartData: any[];     // distribution curve
  private expectedShortfall: number;
  private stressScenarioLoss: number;
  private stressScenarioLossUnit: number;
  private stressScenarioLossCdf: number;  // Cumulative Distribution Function value

  public config = {

    studentsDegreeOfFreedom: 5,
    xDomainStepSize: 0.1,

    margin: { top: 20, bottom: 55, left: 65, right: 20},  // also fox Axis ticks
    marginAxisLabel: { axisX: 35, axisY: -55},
    domainYPadding: 0.1,
    textShadowOffset: 1,    // px
    lineLabelOffsetX: 5,     // px
    textAnchorEndThreshold: 100,  //px

  };

  private debugConfig = {
    debug: false,
  };

  private text = {
    axisX: 'P&L (USD m)',
  };

  chart: any;
  private width: number;
  private height: number;
  private xAxis: any;
  private yAxis: any;
  private labels : any;
  private xScale: any;
  private yScale: any;
  private tooltip: any;
  private line = d3.line()
    .x( (d:any) => this.xScale(d.x) )
    .y( (d:any) => this.yScale(d.y) );

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(){
    if ( this.input ){
      if ( ! this.chart ) {
        this.createChart();
      }
      this.updateChart();
    }

  }

  private createChart() {

    let config = this.config;
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - config.margin.left - config.margin.right;
    this.height = element.offsetHeight - config.margin.top - config.margin.bottom;

    // tooltip
    this.tooltip = d3.select(element).append("div")
      .attr("class", "chart-tooltip")
      .style("display", "none");

    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // create scales
    this.xScale = d3.scaleLinear().range([0, this.width]);
    this.yScale = d3.scaleLinear().range([this.height, 0]);

    // x & y axis
    this.xAxis = svg.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top + this.height})`)
      .call(this.getXAxis());
    this.xAxis.append('text')
      .attr('class', 'axis-label')
      .attr('x', '50%')
      .attr('y', config.marginAxisLabel.axisX )
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
      .attr('y', config.marginAxisLabel.axisY)
      .attr("transform", `rotate(-90 )`)
      .style('text-anchor', 'middle');
      //.text( this.text.axisY );
    this.yAxis.append('path')
      .attr('class', 'axis-y-line')
      .attr('d', `M0,0V${this.height}`);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'plotArea')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);

    // labels layer
    this.labels = svg.append("g")
      .attr("class", "label")
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);
  }

  updateChart(){

    if ( ! this.input ){
      return;
    }

    this.calculateChartData();

    console.log("distribution chart data", this.chartData);

    if (this.chartData.length) {
      this.xScale.domain(this.getXDomain());
      this.yScale.domain(this.getYDomain());
      this.xAxis.transition().call(this.getXAxis());
      this.yAxis.transition().call(this.getYAxis());
    }

    this.updateCdfArea();

    this.updateDistributionCurve();

    this.updateIndividualLines();

  }

  private updateIndividualLines() {
    this.updateIndividualLine(this.expectedShortfall, 'expected-shortfall');
    this.updateIndividualLine(this.stressScenarioLoss, 'stress-scenario-pl');
    let textEs = this.labels.select('text.expected-shortfall');
    let textLoss = this.labels.select('text.stress-scenario-loss');
    let textLossValue = this.labels.select('text.stress-scenario-loss-value');
    if (this.labels.select('text').empty()) {
      textEs = this.labels.append('text')
        .attr('class', 'expected-shortfall')
        .attr('y', 30)
        .text('Expected Shortfall (99%)');
      textLoss = this.labels.append('text')
        .attr('class', 'stress-scenario-loss')
        .attr('y', 50)
        .text('Stress Scenario P&L');
      textLossValue = this.labels.append('text')
        .attr('class', 'stress-scenario-loss-value')
        .attr('y', 65);
    }

    let textAnchorDirection = 1;
    textEs.attr('text-anchor','start');
    if ( this.xScale(this.expectedShortfall) > this.width - this.config.textAnchorEndThreshold ){
      textEs.attr('text-anchor','end');
      textAnchorDirection = -1;
    }
    textEs.transition().attr('x', this.xScale(this.expectedShortfall) + this.config.lineLabelOffsetX * textAnchorDirection);

    textAnchorDirection = 1;
    const currentX = this.xScale(this.stressScenarioLoss);
    textLoss.attr('text-anchor','start');
    textLossValue.attr('text-anchor','start');
    if ( this.xScale(this.stressScenarioLoss) > this.width - this.config.textAnchorEndThreshold ){
      textLoss.attr('text-anchor','end');
      textLossValue.attr('text-anchor','end');
      textAnchorDirection = -1;
    }
    textLoss.transition().attr('x', currentX + this.config.lineLabelOffsetX * textAnchorDirection);
    textLossValue.transition().attr('x', currentX + this.config.lineLabelOffsetX * textAnchorDirection)
      .text('CDF: ' + ValueUtil.formatPercentRounded(this.stressScenarioLossCdf, 2));

  }

  private updateDistributionCurve() {
    this.chart.select('path.line').remove();
    let path = this.chart.select('path.line');
    if (path.empty()) {
      path = this.chart.append("path").attr("class", "line")
    }
    path.datum(this.chartData).attr("d", this.line);
  }

  private updateCdfArea() {
    let cdfArea = this.chart.select('path.area');
    if (cdfArea.empty()) {
      cdfArea = this.chart.append("path")
        .datum(this.chartData)
        .attr("class", "area")
        .attr("d", this.line);
      cdfArea.attr("d", cdfArea.attr("d") + 'V' + this.height + 'Z');
    }
    else {
      cdfArea.datum(this.chartData).attr("d", this.line);
    }


    let rectHelper = this.chart.select('rect.animation-helper');
    if (rectHelper.empty()) {
      rectHelper = this.chart.append('rect')
        .attr('class', 'animation-helper')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', this.width)
        .attr('height', this.height);
    }

    const currentX = this.xScale(this.stressScenarioLoss);
    rectHelper
      .transition()
      .attr('x', currentX);
    return currentX;
  }

  private updateIndividualLine( xDomain: number, className: string ) {
    let vLine = this.chart.select('.'+className);
    if (vLine.empty()) {
      vLine = this.chart.append('path')
        .attr('class', 'vertical-line ' + className);
    }
    vLine.transition()
      .attr('d', `M${ this.xScale(xDomain) } 0 V${this.height}`);


  }

  private calculateChartData() {
    const shape = Math.sqrt(3 / 5) * this.input.trackingError * this.input.nav;     // this formula is specific to the t5 distribution
    const location = this.input.excessReturn * this.input.nav;

    this.expectedShortfall = this.input.expectedShortfallConstant * shape + location;
    this.stressScenarioLoss = this.input.stressScenarioLoss;

    this.stressScenarioLossUnit = (this.input.stressScenarioLoss - location) / shape;
    this.stressScenarioLossCdf = jStat.studentt.cdf( this.stressScenarioLossUnit, this.config.studentsDegreeOfFreedom );

    this.chartData = d3.range(
      this.input.distributionDomain[0],
      this.input.distributionDomain[1] + this.config.xDomainStepSize,
      this.config.xDomainStepSize
    ).map(d => ({
      x: d * shape + location,
      y: jStat.studentt.pdf(d, this.config.studentsDegreeOfFreedom)
    }));

  }

  private getXAxis(){
    return d3.axisBottom(this.xScale);
  }
  private getYAxis(){
    return d3.axisLeft(this.yScale);
  }

  private getXDomain() {
    const min = Math.min(
      d3.min( this.chartData, d => d.x ),
      this.stressScenarioLoss,
      this.expectedShortfall
    );
    const max = Math.max(
      d3.max( this.chartData, d => d.x ),
      this.stressScenarioLoss,
      this.expectedShortfall
    );
    return [ min, max ];
  }

  private getYDomain() {
    return [ d3.min( this.chartData, d => d.y ), d3.max( this.chartData, d => d.y ) ];
  }

}
