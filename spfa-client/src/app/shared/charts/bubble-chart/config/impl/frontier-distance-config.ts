import {BubbleChartConfig} from "@app/shared/charts/bubble-chart/config/bubble-chart-config";
import {BubbleChartTypeEnum} from "@app/shared/charts/bubble-chart/config/bubble-chart-data-aggregation";
import {ValueUtil} from "@app/shared/value.util";

export class FrontierDistanceConfig implements BubbleChartConfig {
  readonly title = "Changes from the current portfolio";
  readonly type = BubbleChartTypeEnum.FrontierDistance;
  readonly axisXLabel = "Change in risk";
  readonly axisYLabel = "Change in return";
  readonly tooltipLabel = "NAV";
  readonly axisXFormat = d => d+"%";
  readonly axisYFormat = d => d+"%";
  readonly radiusPrimaryFormat = ValueUtil.formatBillion;
  readonly rounding = 2;
  readonly nothingToDisplayMessage = "The user-defined equals the current portfolio. No changes to display.";
}
