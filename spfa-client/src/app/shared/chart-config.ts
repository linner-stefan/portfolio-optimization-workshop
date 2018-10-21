/**
  * Created by Stefan Linner on 22. 7. 2017.
  */
export class ChartConfig {

  static acColors: Map<number,string> = new Map();

  static initialize(){
    ChartConfig.acColors.set(1,"#17773F");   // Cash
    ChartConfig.acColors.set(10,"#3363B7");  // Govt. & Govt. Related
    ChartConfig.acColors.set(43,"#CDDB30");  // Credit products
    ChartConfig.acColors.set(69,"#2CB4DD");  // Equities & HF
    ChartConfig.acColors.set(78,"#7B2D91");  // Private Equity
    ChartConfig.acColors.set(81,"#DD3EA8");  // Real Estate
  }
}
ChartConfig.initialize();
