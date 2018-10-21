import {Component, ViewEncapsulation, Input, OnInit, OnChanges, OnDestroy} from "@angular/core";
import {ACConstraintChartData} from "../ac-constraint-chart.model";
import {DualConstraint, AssetClassGroup} from "../../../../../base/asset-class/asset-class.model";
import {AssetClassUtil} from "../../../../../base/asset-class/asset-class.util";
import {ValueUtil} from "../../../../../shared/value.util";
import {AllocationConstraintUtil} from "@app/base/asset-class/allocation-constraint.util";
@Component({

  selector: 'ac-constraint-warning-notifications',
  templateUrl: './ac-constraint-warning-notifications.component.html',
  encapsulation: ViewEncapsulation.None
})
export class ACConstraintWarningNotificationsComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  chartData: ACConstraintChartData;

  @Input()
  dualConstraints: DualConstraint[];

  @Input()
  private assetClassGroups: AssetClassGroup[];
  private flattenAssetClassGroups: AssetClassGroup[];

  messages: Array<ACConstraintMessage>;
  numAdditionalNotifications = 0;
  additionalNotifications: boolean = false;

  private onAdjustSubscription;
  private onRefreshSubscription;

  ngOnInit() {

    this.flattenAssetClassGroups = AssetClassUtil.flattenAssetClassGroups(this.assetClassGroups);
    this.parseConstraints();

    this.onAdjustSubscription = this.chartData.onAdjust.subscribe( () => {

      this.parseConstraints();

    } );

    this.onRefreshSubscription = this.chartData.onRefresh.subscribe( () => {

      this.parseConstraints();

    } );
  }

  ngOnChanges() {

    this.flattenAssetClassGroups = AssetClassUtil.flattenAssetClassGroups(this.assetClassGroups);
    this.parseConstraints();
  }

  ngOnDestroy() {

    this.onAdjustSubscription.unsubscribe();
    this.onRefreshSubscription.unsubscribe();
  }

  parseConstraints() {

    this.messages = [];
    this.dualConstraints.forEach( dc => {

      let allocation = dc.assetClassGroup1.metadata.allocationSum + dc.assetClassGroup2.metadata.allocationSum;

      if ( AllocationConstraintUtil.isBreachingLower( allocation, dc.lowerBound, true ) ) {
        let messageVerbose = `${dc.assetClassGroup1.name} & ${dc.assetClassGroup2.name} = ${ValueUtil.formatPercent(allocation)} - Breaching Lower Bound of ${ ValueUtil.formatPercent(dc.lowerBound) }`;
        let message = `${dc.assetClassGroup1.name} & ${dc.assetClassGroup2.name} - Breaching Lower Bound of ${ ValueUtil.formatPercentRounded(dc.lowerBound) }`;
        this.messages.push( new ACConstraintMessage(message, messageVerbose) );
      }
      else if (AllocationConstraintUtil.isBindingLower(allocation, dc.lowerBound, true)) {
        let messageVerbose = `${dc.assetClassGroup1.name} & ${dc.assetClassGroup2.name} - Binding Lower Bound of ${ ValueUtil.formatPercentRounded(dc.lowerBound) }`;
        let message = `${dc.assetClassGroup1.name} & ${dc.assetClassGroup2.name} - Binding Lower Bound of ${ ValueUtil.formatPercentRounded(dc.lowerBound) }`;
        this.messages.push( new ACConstraintMessage(message, messageVerbose) );
      }

      if ( AllocationConstraintUtil.isBreachingUpper(allocation, dc.upperBound, true) ) {
        let messageVerbose = `${dc.assetClassGroup1.name} & ${dc.assetClassGroup2.name} = ${ValueUtil.formatPercent(allocation)} - Breaching Upper Bound of ${ ValueUtil.formatPercentRounded(dc.upperBound) }`;
        let message = `${dc.assetClassGroup1.name} & ${dc.assetClassGroup2.name} - Breaching Upper Bound of ${ ValueUtil.formatPercentRounded(dc.upperBound) }`;
        this.messages.push( new ACConstraintMessage(message, messageVerbose) );
      }
      else if (AllocationConstraintUtil.isBindingUpper(allocation, dc.upperBound, true)) {
        let messageVerbose = `${dc.assetClassGroup1.name} & ${dc.assetClassGroup2.name} - Binding Upper Bound of ${ ValueUtil.formatPercentRounded(dc.upperBound) }`;
        let message = `${dc.assetClassGroup1.name} & ${dc.assetClassGroup2.name} - Binding Upper Bound of ${ ValueUtil.formatPercentRounded(dc.upperBound) }`;
        this.messages.push( new ACConstraintMessage(message, messageVerbose) );
      }

    });

    this.flattenAssetClassGroups.forEach( acg => {

      let ac = acg.allocationConstraint;

      if ( AllocationConstraintUtil.isBreachingLower(acg.metadata.allocationSum, ac.userAdjustedLowerBound, ! acg.assetClass) ) {
        let messageVerbose = `${acg.name} = ${ValueUtil.formatPercent(acg.metadata.allocationSum)} - Breaching Lower Bound of ${ ValueUtil.formatPercent(ac.userAdjustedLowerBound) }`;
        let message = `${acg.name} - Breaching Lower Bound of ${ ValueUtil.formatPercentRounded(ac.userAdjustedLowerBound) }`;
        this.messages.push( new ACConstraintMessage(message, messageVerbose) );
        console.log(messageVerbose);
      }
      else if (AllocationConstraintUtil.isBindingLower(acg.metadata.allocationSum, ac.userAdjustedLowerBound, ! acg.assetClass )) {
        let messageVerbose = `${acg.name} - Binding Lower Bound of ${ ValueUtil.formatPercent(ac.userAdjustedLowerBound)}`;
        let message = `${acg.name} - Binding Lower Bound of ${ ValueUtil.formatPercentRounded(ac.userAdjustedLowerBound)}`;
        this.messages.push( new ACConstraintMessage(message, messageVerbose) );
        console.log(messageVerbose);
      }

      if ( AllocationConstraintUtil.isBreachingUpper(acg.metadata.allocationSum, ac.userAdjustedUpperBound, ! acg.assetClass) ) {
        let messageVerbose = `${acg.name} = ${ValueUtil.formatPercent(acg.metadata.allocationSum)} - Breaching Upper Bound of ${ ValueUtil.formatPercent(ac.userAdjustedUpperBound)}`;
        let message = `${acg.name} - Breaching Upper Bound of ${ ValueUtil.formatPercentRounded(ac.userAdjustedUpperBound)}`;
        this.messages.push( new ACConstraintMessage(message, messageVerbose) );
        console.log(messageVerbose);
      }
      else if (AllocationConstraintUtil.isBindingUpper(acg.metadata.allocationSum, ac.userAdjustedUpperBound, ! acg.assetClass )) {
        let messageVerbose = `${acg.name} - Binding Upper Bound of ${ ValueUtil.formatPercent(ac.userAdjustedUpperBound)}`;
        let message = `${acg.name} - Binding Upper Bound of ${ ValueUtil.formatPercentRounded(ac.userAdjustedUpperBound)}`;
        this.messages.push( new ACConstraintMessage(message, messageVerbose) );
        console.log(messageVerbose);
      }

    });

    this.numAdditionalNotifications = this.messages.length == 0 ? 0 : this.messages.length -1;
  }

  toggleAdditionoalNotifications() {

    this.additionalNotifications = !this.additionalNotifications;
  }
}

class ACConstraintMessage {
  constructor(
    public user: string,
    public verbose: string
  ){

  }
}
