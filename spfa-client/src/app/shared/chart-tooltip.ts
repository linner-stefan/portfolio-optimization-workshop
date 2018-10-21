/**
  * Created by Stefan Linner on 18. 7. 2017.
  */

import * as d3 from "d3";

export class ChartTooltip{

  static TOP_OFFSET = 28;

  public static showTooltip = (tooltip:any,container:any,html:string,
                               x:number = null, y:number = null
  ) => {

    if (d3.event)
      d3.event.stopPropagation();

    if ( !x ){
      x = d3.mouse(container)[0];
    }
    if ( !y ){
      y = d3.mouse(container)[1];
    }

    tooltip
      .style("display", "block")
      .html( html )
      .style("left", x + "px")
      .style("top", y - ChartTooltip.TOP_OFFSET + "px");
  };

  public static hideTooltip = (tooltip:any) => {
    if ( ! tooltip ) return;
    if ( d3.event ) {
      d3.event.stopPropagation();
    }

    tooltip
     .style("display", "none");
  };

}
