import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  ViewChild,
  ViewEncapsulation, AfterViewInit
} from "@angular/core";
import * as d3 from "d3";
import {RiskFactor } from "@app/base/risk-factor/risk-factor.model";
import {CalculationService} from "@app/base/calculation/calculation.service";
import {MatlabCalculationsService} from "@app/base/calculation/matlab-calculations.service";
import {MahalanobisEllipse} from "@app/base/calculation/model/mahalanobis-ellipse.model";
import {MahalanobisChartData, MahalanobisIsChartDatum, Point2D} from "./mahalanobis-chart-data";
import * as math from "mathjs";

@Component({
  selector: 'mahalanobis-chart',
  templateUrl: './mahalanobis-chart.component.html',
  styleUrls: ['../../../../shared/chart-default.scss','./mahalanobis-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MahalanobisChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chart') private chartContainer: ElementRef;

  @Input()
  private calculationId: number;
  @Input()
  public onSelectMahalanobisAxisX: EventEmitter<RiskFactor>;
  private onSelectMahalanobisAxisXHandle: any;
  private riskFactorX: RiskFactor;
  @Input()
  public onSelectMahalanobisAxisY: EventEmitter<RiskFactor>;
  private onSelectMahalanobisAxisYHandle: any;
  private riskFactorY: RiskFactor;
  @Input()
  public onSpreadLevelChartChange: EventEmitter<any>;
  private onSpreadLevelChartChangeHandler: any;
  private onCalculationRefreshHandler: any;

  private chartData: MahalanobisChartData;
  private pendingMatlabCalculations: number = 0;

  dynamicStyles = {
    loaderDisplay: "block",
    loaderMatlabDisplay: "none"
  };

  private config = {
    margin: { top: 20, bottom: 55, left: 65, right: 20},
    rectSize: 10,
    rhombusSize: 10,
    circleRadius: 5,
    rhombusSkew: 10,   // degrees
    opacityLabelText: 0.6,
    labelOffsetEq: [-10,-10],
    labelOffsetUd: [11,11],
    labelOffsetIs: [9,-9],
  };

  private chart: any;
  private width: number;
  private height: number;

  private xAxis: any;
  private yAxis: any;
  private xAxisGrid : any;
  private yAxisGrid : any;
  private formatPercent = d => d+"%";
  //private formatBp = d => d*100+"bps";
  private formatBp = d => (math.round(d*100,0) as number).toFixed(0);

  private xScale: any;
  private yScale: any;
  private radiusXScale: any;
  private radiusYScale: any;
  private labels: any;

  constructor(private calculationService: CalculationService, private matlabService: MatlabCalculationsService) {

    this.calculationId = calculationService.getCalculation().id;
  }

  ngAfterViewInit(): void {

    this.onSelectMahalanobisAxisXHandle = this.onSelectMahalanobisAxisX.subscribe( riskFactor => {
      this.riskFactorX = riskFactor;

      console.log("riskFactorX:",riskFactor);

      this.onSelectAxis();
    } );
    this.onSelectMahalanobisAxisYHandle = this.onSelectMahalanobisAxisY.subscribe( riskFactor => {
      this.riskFactorY = riskFactor;

      console.log("riskFactorY:",riskFactor);

      this.onSelectAxis();
    } );
    this.onSpreadLevelChartChangeHandler = this.onSpreadLevelChartChange.subscribe( changeType => {
      // TODO: check if it's for the selected risk factor either here or directly in the spread level chart

      console.log("riskFactorX:",this.riskFactorX);
      console.log("riskFactorY:",this.riskFactorY);

      this.onSpreadLevelChart(changeType);
    });
    this.onCalculationRefreshHandler = this.calculationService.calculationRefreshHandler.subscribe( () => {

      console.log("riskFactorX:",this.riskFactorX);
      console.log("riskFactorY:",this.riskFactorY);

      this.onSpreadLevelChart( undefined );
    })

  }

  ngOnDestroy(): void {
    this.onSelectMahalanobisAxisXHandle.unsubscribe();
    this.onSelectMahalanobisAxisYHandle.unsubscribe();
    this.onSpreadLevelChartChangeHandler.unsubscribe();
    this.onCalculationRefreshHandler.unsubscribe();
  }

  private createChart() {

    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.config.margin.left - this.config.margin.right;
    this.height = element.offsetHeight - this.config.margin.top - this.config.margin.bottom;

    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // define X & Y domains
    let xDomain = this.getXDomain();
    let yDomain = this.getYDomain();
    let radiusXDomain = [ 0, xDomain[1]-xDomain[0] ];
    let radiusYDomain = [ 0, yDomain[1]-yDomain[0] ];

    // create scales
    this.xScale = d3.scaleLinear().domain(xDomain).range([0, this.width]);
    this.yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0]);
    this.radiusXScale = d3.scaleLinear().domain(radiusXDomain).range([0,this.width]);  // we can't have inverted values for radius
    this.radiusYScale = d3.scaleLinear().domain(radiusYDomain).range([0,this.height]);  // we can't have inverted values for radius

    // x & y axis
    this.xAxis = svg.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(${this.config.margin.left}, ${this.config.margin.top + this.height})`)
      .call(this.getXAxis());
    this.xAxis.append('text') // text is inserted in the update phase
      .attr('class', 'axis-label')
      .attr('x', '50%')
      .attr('y', 35 )
      .style('text-anchor', 'middle')
      .style('alignment-baseline', 'hanging '); // hanging = top
    this.xAxisGrid = svg.append('g')
      .attr('class', 'axis-grid')
      .attr('transform', `translate(${this.config.margin.left}, ${this.config.margin.top + this.height})`)
      .call(this.getXAxisGrid());
    this.xAxis.append('path')
      .attr('class', 'axis-x-line')
      .attr('d', `M0,0H${this.width}`);
    this.yAxis = svg.append('g')
      .attr('class', 'axis axis-y')
      .attr('transform', `translate(${this.config.margin.left}, ${this.config.margin.top})`)
      .call(this.getYAxis());
    this.yAxis.append('text') // text is inserted in the update phase
      .attr('class', 'axis-label')
      .attr('x', - this.height / 2)
      .attr('y', -50)
      .attr("transform", `rotate(-90 )`)
      .style('text-anchor', 'middle');
    this.yAxisGrid = svg.append('g')
      .attr('class', 'axis-grid')
      .attr('transform', `translate(${this.config.margin.left}, ${this.config.margin.top})`)
      .call(this.getYAxisGrid());
    this.yAxis.append('path')
      .attr('class', 'axis-y-line')
      .attr('d', `M0,0V${this.height}`);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'plotArea')
      .attr('transform', `translate(${this.config.margin.left}, ${this.config.margin.top})`);

    // we have to separate different data points due to d3 data binding style
    this.chart.append('g')
      .attr('class','is');
    this.chart.append('g')
      .attr('class','equilibrium');
    this.chart.append('g')
      .attr('class','investment-strategy');

    // labels layer
    this.labels = svg.append("g")
      .attr("class", "label")
      .attr('transform', `translate(${this.config.margin.left}, ${this.config.margin.top})`);
    this.labels.append('g')
      .attr('class','investment-strategy');
    this.labels.append('g')
      .attr('class','equilibrium');
    this.labels.append('g')
      .attr('class','user-defined');

  }

  private updateChart() {

    console.log('Mahalanobis chart data:',this.chartData);

    // update scales & axis
    let xDomain = this.getXDomain();
    let yDomain = this.getYDomain();
    this.xScale.domain(xDomain);
    this.yScale.domain(yDomain);
    let radiusXDomain = [ 0, xDomain[1]-xDomain[0] ];
    let radiusYDomain = [ 0, yDomain[1]-yDomain[0] ];
    this.radiusXScale.domain(radiusXDomain);
    this.radiusYScale.domain(radiusYDomain);
    this.xAxis.transition().call(this.getXAxis());
    this.xAxis.select('.axis-label').text( this.riskFactorX.unit == 'BP' ? this.riskFactorX.name + " [bps]" : this.riskFactorX.name );
    this.xAxisGrid.transition().call(this.getXAxisGrid());
    this.yAxis.transition().call(this.getYAxis());
    this.yAxis.select('.axis-label').text( this.riskFactorY.unit == 'BP' ? this.riskFactorY.name + " [bps]" : this.riskFactorY.name );
    this.yAxisGrid.transition().call(this.getYAxisGrid());

    // mahalanobis ellipse
    let ellipse = d3.line()
      .x( d => this.xScale(d[0]) )
      .y( d => this.yScale(d[1]) )
      .curve(d3.curveMonotoneX);
    let update = this.chart.selectAll("path").data(this.chartData.ellipse);
    update.enter().append("path")
      .attr("d", ellipse);

    update
      .transition()
      .attr("d", ellipse);

    // IS rect
    if ( this.chartData.investmentStrategy.length ) {
      update = this.chart.select(".investment-strategy").selectAll("rect").data(this.chartData.investmentStrategy);
      update.enter().append("rect")
        .attr("x", d => this.xScale(d.point.x))
        .attr("y", d => this.yScale(d.point.y))
        .attr("width", this.config.rectSize)
        .attr("height", this.config.rectSize)
        .attr("transform", `translate( -${ this.config.rectSize / 2 }, -${ this.config.rectSize / 2 } )`);
      update
        .transition()
        .attr("x", d => this.xScale(d.point.x))
        .attr("y", d => this.yScale(d.point.y))
        .attr("width", this.config.rectSize)
        .attr("height", this.config.rectSize)
        .attr("transform", `translate( -${ this.config.rectSize / 2 }, -${ this.config.rectSize / 2 } )`);
      update.exit().remove();
      update = this.labels.select(".investment-strategy").selectAll("text").data(this.chartData.investmentStrategy);
      update.enter().append("text")
        .text(d => "IS "+ d.title)
        .attr("text-anchor", "middle")
        .style("opacity", this.config.opacityLabelText)
        .attr("x", d => this.xScale(d.point.x) + this.config.labelOffsetIs[0])
        .attr("y", d => this.yScale(d.point.y) + this.config.labelOffsetIs[1]);
      update
        .text(d => "IS "+ d.title)
        .transition()
        .attr("x", d => this.xScale(d.point.x) + this.config.labelOffsetIs[0])
        .attr("y", d => this.yScale(d.point.y) + this.config.labelOffsetIs[1]);
      update.exit().remove();
    }
    else {
      this.chart.select(".investment-strategy").selectAll('rect').remove();
      this.labels.select(".investment-strategy").selectAll("text").remove();
    }

    // User-defined circle
    if ( this.chartData.userDefined[0].x && this.chartData.userDefined[0].y ) {
      update = this.chart.selectAll("circle").data(this.chartData.userDefined);
      update.enter().append("circle")
        .attr("cx", d => this.xScale(d.x))
        .attr("cy", d => this.yScale(d.y))
        .attr("r", this.config.circleRadius);
      update
        .transition()
        .attr("cx", d => this.xScale(d.x))
        .attr("cy", d => this.yScale(d.y))
        .attr("r", this.config.circleRadius);
      update = this.labels.select(".user-defined").selectAll("text").data(this.chartData.userDefined);
      update.enter().append("text")
        .text("User-defined")
        .attr("text-anchor", "middle")
        .style("opacity", this.config.opacityLabelText)
        .attr("x", d => this.xScale(d.x) + this.config.labelOffsetUd[0])
        .attr("y", d => this.yScale(d.y) + this.config.labelOffsetUd[1]);
      update
        .transition()
        .attr("x", d => this.xScale(d.x) + this.config.labelOffsetUd[0])
        .attr("y", d => this.yScale(d.y) + this.config.labelOffsetUd[1]);
    }
    else {
      this.chart.selectAll("circle").remove();
      this.labels.select(".user-defined").selectAll("text").remove();
    }

    // equilibrium - fake rhombus
    update = this.chart.select(".equilibrium").selectAll("rect").data(this.chartData.equilibrium);
    update.enter().append("rect")
      .attr("class", "equilibrium")
      .attr("width", this.config.rhombusSize)
      .attr("height", this.config.rhombusSize)
      .attr("transform", d => `
        translate(${this.xScale(d.x)},${ this.yScale(d.y) - (Math.sqrt(2) * this.config.rhombusSize / 2) }),
        rotate(45)
        `);
    update
      .transition()
      .attr("width", this.config.rhombusSize)
      .attr("height", this.config.rhombusSize)
      .attr("transform", d => `
        translate(${this.xScale(d.x)},${ this.yScale(d.y) - (Math.sqrt(2) * this.config.rhombusSize / 2) }),
        rotate(45)
        `);
    update = this.labels.select(".equilibrium").selectAll("text").data(this.chartData.equilibrium);
    update.enter().append("text")
      .text("Starting Position")
      .attr("text-anchor", "middle")
      .style("opacity", this.config.opacityLabelText)
      .attr("x", d => this.xScale(d.x) + this.config.labelOffsetEq[0] )
      .attr("y", d => this.yScale(d.y) + this.config.labelOffsetEq[1] );
    update
      .transition()
      .attr("x", d => this.xScale(d.x) + this.config.labelOffsetEq[0] )
      .attr("y", d => this.yScale(d.y) + this.config.labelOffsetEq[1] );

  }

  onSpreadLevelChart( changeType:string ){
    let riskFactorX = this.riskFactorX;
    let riskFactorY = this.riskFactorY;

    if ( riskFactorX && riskFactorY && this.chartData ){

      if ( changeType == 'userAdjustedLevel'){
        this.setUserDefined(this.chartData);
      }
      else if ( changeType == 'userAdjustedMarketData'){
        this.setUserAdjustedMarketData();
      }
      else {
        this.setUserDefined(this.chartData);
        this.setUserAdjustedMarketData();
      }

      this.updateChart();
    }
  }

  private setUserAdjustedMarketData() {
    let riskFactorX = this.riskFactorX;
    let riskFactorY = this.riskFactorY;

    let newStartingPosition = new Point2D(
      riskFactorX.userAdjustedMarketData ? riskFactorX.userAdjustedMarketData : riskFactorX.marketData,
      riskFactorY.userAdjustedMarketData ? riskFactorY.userAdjustedMarketData : riskFactorY.marketData
    );
    this.shiftEllipse(this.chartData.ellipse[0], this.chartData.equilibrium[0], newStartingPosition);
    this.setEquilibrium(this.chartData);
  }

  onSelectAxis(){
    if ( this.riskFactorX && this.riskFactorY ){

      this.dynamicStyles.loaderDisplay = "none";
      this.dynamicStyles.loaderMatlabDisplay = "block";

      ++this.pendingMatlabCalculations;

      this.matlabService.mahalanobisEllipse(this.calculationId, this.riskFactorX.name, this.riskFactorY.name )
        .subscribe(mahalanobisEllipse => {

          console.log(`Mahalanobis ellipse:`,mahalanobisEllipse);

          --this.pendingMatlabCalculations;

          this.onMatlabResponse( mahalanobisEllipse );

        }, error => {
          console.error('Mahalanobis ellipse error:',error);

          --this.pendingMatlabCalculations;

          this.onMatlabResponse( null );
        }
      );
    }
  }

  onMatlabResponse( mahalanobisEllipse: MahalanobisEllipse){

    // TODO: what if we don't receive response to currently selected axes on spread level chart? (first request returns as second)

    if ( ! this.pendingMatlabCalculations ) {
      this.dynamicStyles.loaderMatlabDisplay = "none";
    }

    let data = new MahalanobisChartData();

    this.setPoints(data);
    this.setMahalanobisEllipse(mahalanobisEllipse, data);

    this.chartData = data;

    if ( ! this.chart ){
      this.createChart();
    }

    this.updateChart();

  }

  private setPoints(data: MahalanobisChartData) {
    this.setEquilibrium(data);
    this.setUserDefined(data);
    this.setInvestmentStrategy(data);
  }

  private setEquilibrium(data: MahalanobisChartData) {
    let riskFactorX = this.riskFactorX;
    data.equilibrium[0].x = riskFactorX.userAdjustedMarketData ? riskFactorX.userAdjustedMarketData : riskFactorX.marketData;
    let riskFactorY = this.riskFactorY;
    data.equilibrium[0].y = riskFactorY.userAdjustedMarketData ? riskFactorY.userAdjustedMarketData : riskFactorY.marketData;
  }

  private setUserDefined(data: MahalanobisChartData) {
    data.userDefined[0].x = this.riskFactorX.userAdjustedLevel;
    data.userDefined[0].y = this.riskFactorY.userAdjustedLevel;
  }

  private setMahalanobisEllipse(mahalanobisEllipse: MahalanobisEllipse, data: MahalanobisChartData) {
    if (mahalanobisEllipse) {

      // convert to absolute percentage
      mahalanobisEllipse.mahalanobisEllipseMean[0] *= 100;
      mahalanobisEllipse.mahalanobisEllipseMean[1] *= 100;
      mahalanobisEllipse.mahalanobisEllipse.forEach(point => {
        point[0] *= 100;
        point[1] *= 100;
      });

      let ellipseMean: Point2D = new Point2D(
        mahalanobisEllipse.mahalanobisEllipseMean[0],
        mahalanobisEllipse.mahalanobisEllipseMean[1]
      );

      // shift ellipse to the market data equilibrium
      this.shiftEllipse( mahalanobisEllipse.mahalanobisEllipse, ellipseMean, data.equilibrium[0] );

      data.ellipse[0] = mahalanobisEllipse.mahalanobisEllipse;
    }
    else {
      data.ellipse[0] = [];
    }
  }

  private shiftEllipse(ellipse: number[][], oldCenter: Point2D, newCenter: Point2D){
    let shiftX = newCenter.x - oldCenter.x;
    let shiftY = newCenter.y - oldCenter.y;
    ellipse.forEach(point => {
      point[0] += shiftX;
      point[1] += shiftY;
    });
  }

  private setInvestmentStrategy(data: MahalanobisChartData) {

    let years: Set<string> = new Set<string>();
    if ( this.riskFactorX.agregatedInvestmentViews ) {
      this.riskFactorX.agregatedInvestmentViews.forEach(rf =>
        rf.yearLabel.split(',').forEach( token => years.add(token))
      );
    }
    if (this.riskFactorY.agregatedInvestmentViews ) {
      this.riskFactorY.agregatedInvestmentViews.forEach(rf =>
        rf.yearLabel.split(',').forEach( token => years.add(token))
      );
    }

    years.forEach(year => {

      let x = this.getInvestmentViewValue(year, this.riskFactorX);
      let y = this.getInvestmentViewValue(year, this.riskFactorY);

      let equalPoint = this.findEqualPoint(x, y, data.investmentStrategy);

      // same IS points will be merged into one
      if (equalPoint != null) {
        equalPoint.title += "," + year;
      }
      else {
        let datum = new MahalanobisIsChartDatum();
        let point = new Point2D(x,y);

        datum.point = point;
        datum.title = year;

        data.investmentStrategy.push(datum);
      }

    });
  }

  private findEqualPoint(x:number,y:number,investmentStrategy:MahalanobisIsChartDatum[]) : MahalanobisIsChartDatum {
    if ( !x || !y )
      return;

    let equalPoint:MahalanobisIsChartDatum = null;
    investmentStrategy.forEach( datum => {
      if ( datum.point.x == x && datum.point.y == y ){
        equalPoint = datum;
      }
    } );
    return equalPoint;
  }

  private getInvestmentViewValue(year:string, riskFactor:RiskFactor):number {
    let value: number;

    let isView = riskFactor.agregatedInvestmentViews ? riskFactor.agregatedInvestmentViews.find(e =>
        !!e.yearLabel.split(',').find(token => token == year)
      ) : undefined;
    if (isView == undefined) {
      value = riskFactor.marketData;
    }
    else {
      value = isView.agregatedValue;
    }
    // return riskFactor.unit == 'BP' ? value * 0.01 : value;
    return value;
  }

  private getXAxis(  ){
    let format:any = this.riskFactorX.unit == 'BP' ? this.formatBp : this.formatPercent;
    return d3.axisBottom(this.xScale).tickFormat( format );
  }
  private getYAxis(){
    let format:any = this.riskFactorY.unit == 'BP' ? this.formatBp : this.formatPercent;
    return d3.axisLeft(this.yScale).tickFormat( format );
  }
  private getXAxisGrid(){
    return d3.axisBottom(this.xScale)
      .tickSize(-this.height)
      .tickFormat( d => "" );
  }
  private getYAxisGrid(){
    return d3.axisLeft(this.yScale)
      .tickSize(-this.width)
      .tickFormat( d => "" );
  }

  private getXDomain() {
    let maxValues = [
      d3.max( this.chartData.ellipse[0], ellipse => ellipse[0]),
      d3.max( this.chartData.investmentStrategy, e => e.point.x ),
      this.chartData.equilibrium[0].x,
      this.chartData.userDefined[0].x
    ];
    this.chartData.investmentStrategy.forEach( e => maxValues.push( e.point.x ) );
    maxValues = maxValues.filter( e => typeof e == 'number');
    let maxDomain = d3.max( maxValues );

    let minValues = [
      d3.min( this.chartData.ellipse[0], ellipse => ellipse[0]),
      d3.min( this.chartData.investmentStrategy, e => e.point.x ),
      this.chartData.equilibrium[0].x,
      this.chartData.userDefined[0].x,
    ];
    minValues = minValues.filter( e => typeof e == 'number');
    let minDomain = d3.min(minValues);

    let range = maxDomain - minDomain;
    return [ Number(minDomain) -  range*0.1, Number(maxDomain) +  range*0.1 ];
  }

  private getYDomain() {
    let maxValues = [
      d3.max( this.chartData.ellipse[0], ellipse => ellipse[1]),
      d3.max( this.chartData.investmentStrategy, e => e.point.y ),
        this.chartData.equilibrium[0].y,
        this.chartData.userDefined[0].y
    ];
    maxValues = maxValues.filter( e => typeof e == 'number');
    let maxDomain = d3.max( maxValues );

    let minValues = [
      d3.min( this.chartData.ellipse[0], ellipse => ellipse[1]),
      d3.min( this.chartData.investmentStrategy, e => e.point.y ),
      this.chartData.equilibrium[0].y,
      this.chartData.userDefined[0].y
    ];
    minValues = minValues.filter( e => typeof e == 'number');
    let minDomain = d3.min(minValues);

    let range = maxDomain - minDomain;
    return [ Number(minDomain) -  range*0.1, Number(maxDomain) +  range*0.1 ];
  }

}
