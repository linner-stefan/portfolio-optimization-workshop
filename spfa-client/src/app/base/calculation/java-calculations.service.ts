/**
 * Rest calls / calculations which are not updating Calculation entity on the BE.
 *
 * Created by Stefan Linner on 09/10/2017.
 */
import {Observable} from "rxjs";
import 'rxjs/add/operator/map';
import {Http, Response} from "@angular/http";
import {environment} from "../../../environments/environment";
import {Injectable, EventEmitter} from "@angular/core";
import {AssetClass, Portfolio, PortfolioAllocation, PortfolioAllocationDto} from "@app/base/asset-class/asset-class.model";
import {CalculationUtil} from "@app/base/calculation/calculation.util";
import {Calculation} from "@app/base/calculation/model/calculation.model";
import {ErrorUtil} from "@app/util/error.util";
import {NotificationService} from "@app/shared/notification/notification.service";
import {
  PortfolioAttributesUpdateOutDto,
  PortfolioAttributesUpdateInDto, PortfolioAttributesUpdate, PortfolioCtrUpdateInDto, PortfolioCtrUpdate,
  PortfolioCtrUpdateOutDto, RiskFactorChangeOutDto
} from "@app/base/calculation/model/java-calculations.model";
import {PortfolioUtil} from "@app/base/calculation/portfolio.util";

@Injectable()
export class JavaCalculationsService {

  private updatePortfolioAttributesEmitter = new EventEmitter<PortfolioAttributesUpdate>();

  readonly onPortfolioCtrRefresh = new EventEmitter<PortfolioCtrUpdateOutDto>();

  constructor(private http: Http,
              private notificationService: NotificationService) {

    this.updatePortfolioAttributesEmitter
      .debounceTime(500)
      .subscribe( (update: PortfolioAttributesUpdate) => {

        this.http.post(environment.url + '/api/java-calculations/' + update.calculation.id + '/update-portfolio-attributes', update.data )
          .map(response => response.json())
          .subscribe(
            (updateDto: PortfolioAttributesUpdateOutDto) => {

              console.log("updatePortfolioAttributes response:",updateDto);

              CalculationUtil.updatePortfolioAttributes( update.calculation, updateDto);
              // TODO: maybe overkill using calculationRefreshHandler
              update.refreshHandler.next();

            }, (error: Response) => {
              ErrorUtil.handleErrorResponse('Portfolio attributes update failed.', error, this.notificationService );
            });

    });

  }

  updateBubbleChart(calculation: Calculation) : Observable<any> {

    let riskFactorsData = CalculationUtil.getAdjustedRiskFactorsData(calculation);

    return this.http.post(environment.url + '/api/java-calculations/' + calculation.id + '/risk-factor-change', riskFactorsData)
      .map(response => response.json())
      .map((outDto: RiskFactorChangeOutDto) => {

        CalculationUtil.applyUpdatedAssetClasses( calculation, outDto.assetClasses, outDto.assetClassGroups );
        return Observable.of(1);
      });
  }

  /**
   * Update tracking error and return for Current and User-defined portfolio. Request is debounced.
   *
   * @param calculation
   * @param calculationRefreshHandler
   */
  updatePortfolioAttributes(calculation: Calculation, calculationRefreshHandler: EventEmitter<any>): void {

    const assetClassData: PortfolioAttributesUpdateInDto = new PortfolioAttributesUpdateInDto();
    assetClassData.assetClasses = CalculationUtil.getAdjustedAssetClassData( calculation );

    const update: PortfolioAttributesUpdate = new PortfolioAttributesUpdate();
    update.data = assetClassData;
    update.refreshHandler = calculationRefreshHandler;
    update.calculation = calculation;

    this.updatePortfolioAttributesEmitter.next(update);
  }

  /**
   * Update portfolio contribution to risk. Request is not debounced.
   *
   * @param update
   */
  updatePortfolioCtr( update: PortfolioCtrUpdate ): void {

    update.refreshHandler = this.onPortfolioCtrRefresh;

    this.http.post(environment.url + '/api/java-calculations/' + update.calculation.id + '/update-portfolio-ctr', update.data )
      .map(response => response.json())
      .subscribe(
        (updateOutDto: PortfolioCtrUpdateOutDto) => {

          console.log("updatePortfolioCtr response:",updateOutDto);

          PortfolioUtil.updatePortfolioCtr( update.portfolio, updateOutDto);
          update.refreshHandler.next();

        }, (error: Response) => {
          ErrorUtil.handleErrorResponse('Portfolio CtR update failed.', error, this.notificationService );
        });
  }

}
