import {
  Component,
  OnInit,
  ViewEncapsulation,
  ElementRef,
  ViewChild,
  Input,
  OnChanges,
  Output,
  EventEmitter
} from "@angular/core";
import * as d3 from "d3";
import {ValueUtil} from "@app/shared/value.util";
import {WaterfallChartDatum, WaterfallChartInput} from "@app/shared/charts/waterfall-chart/waterfall-chart.model";
import {RiskFactorGroup} from "@app/base/risk-factor/risk-factor.model";

@Component({
  selector: 'app-waterfall-chart',
  templateUrl: './waterfall-chart.component.html',
  styleUrls: ['../../../shared/chart-default.scss','waterfall-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WaterfallChartComponent implements OnInit, OnChanges {

  @ViewChild('chart') private chartContainer: ElementRef;

  @Input('data')
  private chartDataOriginal: WaterfallChartInput;
  private chartData: WaterfallChartDatum[];

  //noinspection JSMismatchedCollectionQueryUpdate
  @Input('riskFactorGroups')
  private riskFactorGroupsOriginal: RiskFactorGroup[];
  private riskFactorGroups: RiskFactorGroup[];            // displayed groups
  private riskFactorGroupsZoomedOut: RiskFactorGroup[];   // groups to be displayed after zoom out

  @Output('selectedGroup')
  private selectedGroupEmitter = new EventEmitter<string>();

  dynamicStyles = {
    loaderDisplay: "block",
  };

  public config = {

    margin: { top: 20, bottom: 20, left: 65, right: 20},  // also fox Axis ticks
    marginAxisLabel: { axisX: 35, axisY: -55},
    domainYPadding: 0.1,
    innerPadding: 0.3,
    outerPadding: 0.1,
    textShadowOffset: 1,    // px
    transitionDuration: 150,
    transitionDelay: 75,     // ms
  };

  private debugConfig = {
    debug: false,
  };

  private text = {
    axisY: 'P&L (USD m)',
  };

  private chart: any;
  private width: number;
  private height: number;
  private xAxis: any;
  private yAxis: any;
  private labels : any;
  private xScale: any;
  private yScale: any;
  private yScalePrevious: any;
  private tooltip: any;

  private axisYFormatter = n => {
    return n.toLocaleString();
  };
  private labelFormatter;
  private labelFormatterRounded = n => {
    return ValueUtil.round(n).toLocaleString();
  };
  private labelFormatterPrecise = n => {
    return ValueUtil.round(n,1).toLocaleString();
  };

  constructor() {
  }

  ngOnInit() {

    this.riskFactorGroups = this.riskFactorGroupsOriginal;

    if ( this.debugConfig.debug ) {
      this.generateRandomContinuous();
      this.updateChart();
    }

  }

  ngOnChanges(){
    if ( this.chartDataOriginal ){
      if ( ! this.chart ) {
        this.createChart();
      }
      this.updateChart();
    }

  }

  private generateRandomContinuous() {
    this.generateRandomData();

    setInterval(() => {
      this.generateRandomData();
      this.updateChart();
    }, 5000);
  }

  private cumulateChartData() {
    this.chartData = [];

    console.log("waterfall chart data original", this.chartDataOriginal);

    let cumulative = 0;
    const type = this.chartDataOriginal.type;
    this.riskFactorGroups.forEach( rfg => {

      const profitAndLoss = this.getProfitAndLoss(rfg);

      const datum = new WaterfallChartDatum( profitAndLoss.name, ValueUtil.getMillion( profitAndLoss[type] ),
        rfg );
      datum.start = cumulative;
      cumulative += datum.value;
      datum.end = cumulative;
      datum.type = ( datum.value >= 0 ) ? 'positive' : 'negative';

      this.chartData.push( datum );
    });

    const datum = new WaterfallChartDatum( 'Total', cumulative, undefined );
    datum.end = cumulative;
    datum.start = 0;
    datum.type = 'total';
    this.chartData.push( datum );

    if ( Math.abs( cumulative ) < 1 ) {
      this.labelFormatter = this.labelFormatterPrecise;
    }
    else {
      this.labelFormatter = this.labelFormatterRounded;
    }

    const displayedRiskFactor = this.riskFactorGroups[0];
    this.setRiskFactorGroupsZoomedOut( displayedRiskFactor );

    const hasParent = !! displayedRiskFactor.parent;
    this.chart.select('.background')
      .classed('zoom-out', hasParent );
    this.selectedGroupEmitter.next( hasParent ? displayedRiskFactor.parent.name : '' );

  }

  private getProfitAndLoss( rfg: RiskFactorGroup ){
    // if ( rfg.riskFactor ){
    //   return this.chartDataOriginal.riskFactorProfitAndLoss[rfg.name];
    // }
    // else {
    //   return this.chartDataOriginal.riskFactorGroupProfitAndLoss[rfg.name];
    // }
    return null;
  }

  generateRandomData(){
    /*
    let getRandom = () => Math.random() * 500 * ( Math.random() < 0.5 ? -1 : 1 );

   this.chartDataOriginal = [
      {name: "Govt & Govt Related", value: getRandom()},
      {name: "Credit Products", value: getRandom()},
      {name: "Equities & HF", value: getRandom()},
      {name: "Private Equity", value: getRandom()},
      {name: "Real Estate", value: getRandom()},
    ];*/

  }

  private createChart() {

    this.dynamicStyles.loaderDisplay = 'none';

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
    this.xScale = d3.scaleBand().rangeRound([0, this.width])
      .paddingInner(this.config.innerPadding)
      .paddingOuter(this.config.outerPadding);
    this.yScale = d3.scaleLinear().range([this.height, 0]);
    this.yScalePrevious = d3.scaleLinear().range([this.height, 0]);

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
      .style('alignment-baseline', 'hanging '); // hanging = top
      //.text( this.text.axisX );
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
      .style('text-anchor', 'middle')
      .text( this.text.axisY );
    this.yAxis.append('path')
      .attr('class', 'axis-y-line')
      .attr('d', `M0,0V${this.height}`);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'plotArea')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);

    // helper for background mouse clicks
    this.chart.append('rect')
      .attr('class','background')
      .attr('x', 0 )
      .attr('y', 0 )
      .attr('width', this.width )
      .attr('height', this.height )
      .on('click', this.zoomOut );

    // labels layer
    this.labels = svg.append("g")
      .attr("class", "label")
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);
  }

  updateChart(){

    if ( ! this.chartDataOriginal ){
      return;
    }

    this.cumulateChartData();
    console.log("waterfall chart data", this.chartData);

    if (this.chartData.length) {
      this.xScale.domain(this.getXDomain());
      this.yScale.domain(this.getYDomain());
      this.xAxis.transition().call(this.getXAxis());
      this.yAxis.transition().call(this.getYAxis());
    }

    //this.clearChart();

    // preserve old data
    this.chart.selectAll(".bar")
      .select('rect')
      .property('__oldData__', d => d);
    // update data
    const update = this.chart.selectAll(".bar")
      .data(this.chartData);
    console.log('waterfall chart update:',update);

    // EXIT

    update.exit()
      .remove();

    // ENTER

    if ( this.chart.select('.zero-line').empty() ){
      this.chart
        .append("g")
          .attr("class", "zero-line" )
        .append("line")
          .attr("x2", this.width)
          .attr("x1", 0)
          .attr("y1", this.yScale(0))
          .attr("y2", this.yScale(0));
    }
    const barEnter = update.enter()
      .append("g")
        .attr("class", d => "bar " + d.type )
        .attr("transform", d => "translate(" + this.xScale(d.name) + ",0)" )
        .classed('zoom-in', d => this.isZoomable( d ) )
        .on("click", this.zoomIn );

    barEnter.append("rect")
        .attr("y", d => this.yScale(d.start) )
        .attr("height", d => 0 )
        .attr("width", this.xScale.bandwidth())
      .transition()
      .duration(this.config.transitionDuration)
      .delay( (d,i) => this.config.transitionDelay * i)
        .attr("y", d => this.yScale( Math.max(d.start, d.end) ) )
        .attr("height", d => Math.abs( this.yScale(d.start) - this.yScale(d.end) ));

    this.appendText( barEnter.append("text").classed('outline', true), this.config.textShadowOffset );
    this.appendText( barEnter.append("text").classed('value', true) );

    barEnter.append("line")
        .attr("class", d => "connector " + d.type)
        .attr("x1", this.xScale.bandwidth() + 5 )
        .attr("x2", this.xScale.bandwidth() / ( 1 - this.config.innerPadding) - 5 )
        .attr("y1", d => this.yScale(d.start) )
        .attr("y2", d => this.yScale(d.start) )
        .style('visibility','hidden')
      .transition()
      .duration(this.config.transitionDuration)
      .delay( (d,i) => this.config.transitionDelay * i)
        .style('visibility','visible')
        .attr("y1", d => this.yScale(d.end) )
        .attr("y2", d => this.yScale(d.end) );

    // UPDATE

    this.chart.select(".zero-line line" )
      .transition()
        .attr("y1", this.yScale(0))
        .attr("y2", this.yScale(0));

    update
        .attr("class", d => "bar " + d.type )
        .classed('zoom-in', d => this.isZoomable( d ) )
      .transition()
        .attr("transform", d => "translate(" + this.xScale(d.name) + ",0)" );
    update.select('rect')
      .transition()
      .duration(this.config.transitionDuration)
      .delay( (d,i) => this.config.transitionDelay*i)
        .attr("width", this.xScale.bandwidth())
        .attr("y", d => this.yScale( Math.max(d.start, d.end) ) )
        .attr("height", d => Math.abs( this.yScale(d.start) - this.yScale(d.end) ));

    this.updateText( update.select('text.outline'), this.config.textShadowOffset );
    this.updateText( update.select('text.value') );

    update.select('.connector')
        .attr("class", d => "connector " + d.type)
      .transition()
      .duration(this.config.transitionDuration)
      .delay( (d,i) => i * this.config.transitionDelay)
        .attr("x1", this.xScale.bandwidth() + 5 )
        .attr("x2", this.xScale.bandwidth() / ( 1 - this.config.innerPadding) - 5 )
        .attr("y1", d => this.yScale(d.end) )
        .attr("y2", d => this.yScale(d.end) );

    this.yScalePrevious.domain(this.getYDomain());

  }

  private appendText( element: any, textShadowOffset?: number ){
    element
        .text(d => this.labelFormatter(d.end - d.start))
        .attr("y", d => this.yScale(d.start) )
        .attr("x", this.xScale.bandwidth() / 2 + (textShadowOffset ? textShadowOffset : 0))
        .attr("dy", d => ((d.value < 0) ? '-' : '') + ".75em" )
        .style('visibility','hidden')
        .style('text-anchor', 'middle')
      .transition()
      .duration(this.config.transitionDuration)
      .delay( (d,i) => this.config.transitionDelay * i)
        .style('visibility','visible')
        .attr("y", d => this.yScale(d.end) + 5 + (textShadowOffset ? textShadowOffset : 0));
  }

  private updateText( element: any, textShadowOffset?: number ){
    element
      .transition()
      .duration(this.config.transitionDuration)  // setting back to default
      .delay( (d,i) => i * this.config.transitionDelay)
        .text(d => this.labelFormatter(d.end - d.start))
        .attr("x", this.xScale.bandwidth() / 2 + (textShadowOffset ? textShadowOffset : 0))
        .attr("y", d => this.yScale(d.end) + 5 + (textShadowOffset ? textShadowOffset : 0))
        .attr("dy", d => ((d.value < 0) ? '-' : '') + ".75em" );
  }

  private zoomIn = (datum: WaterfallChartDatum) => {
    d3.event.stopPropagation();

    if ( ! this.isZoomable( datum ) ){
      return;
    }

    this.riskFactorGroups = datum.riskFactorGroup.subGroups;
    this.updateChart();


  };

  private zoomOut = () => {
    d3.event.stopPropagation();

    if ( this.riskFactorGroupsZoomedOut == this.riskFactorGroups ){
      return;
    }

    this.riskFactorGroups = this.riskFactorGroupsZoomedOut;

    this.updateChart();
  };

  private isZoomable( datum: WaterfallChartDatum ){
    if ( datum.type === 'total' ){
      return false;
    }

    const subGroups = datum.riskFactorGroup.subGroups;
    if ( ! subGroups || ( subGroups && subGroups.length <= 1 ) ){
      return false;
    }

    return true;
  }

  private setRiskFactorGroupsZoomedOut(rfg: RiskFactorGroup) {
    const parent = rfg.parent;

    if (parent) {
      const grandparent = parent.parent;
      if ( grandparent ) {
        this.riskFactorGroupsZoomedOut = grandparent.subGroups;
        return;
      }
    }

    this.riskFactorGroupsZoomedOut = this.riskFactorGroupsOriginal;

  }

  private getXAxis(){
    return d3.axisBottom(this.xScale);
  }
  private getYAxis(){
    return d3.axisLeft(this.yScale).tickFormat(this.axisYFormatter as any);
  }

  private getXDomain() {
    return this.chartData.map( d => d.name );
  }

  private getYDomain() {
    let domain = this.chartData;
    let maxDomain = d3.max(domain, d => Math.max(d.start,d.end) );
    let minDomain = d3.min(domain, d => Math.min(d.start,d.end) );
    const range = Math.abs(maxDomain - minDomain);
    maxDomain = maxDomain + range * this.config.domainYPadding;
    minDomain = minDomain - range * this.config.domainYPadding;

    return [ Number(minDomain), Number(maxDomain) ];
  }

}
