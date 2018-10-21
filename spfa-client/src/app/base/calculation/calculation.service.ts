import {EventEmitter, Injectable} from "@angular/core";
import {Observable} from "rxjs";
import "rxjs/add/operator/map";
import {Calculation, CalculationApply, CalculationUpdate} from "./model/calculation.model";
import {Headers, Http} from "@angular/http";
import {environment} from "../../../environments/environment";
import {CalculationUtil} from "./calculation.util";
import {RiskFactor} from "../risk-factor/risk-factor.model";
import {AllocationConstraint, AssetClassGroup, DualConstraint} from "../asset-class/asset-class.model";
import {NotificationService} from "@app/shared/notification/notification.service";
import {ErrorUtil} from "@app/util/error.util";
import {JavaCalculationsService} from "@app/base/calculation/java-calculations.service";
import {AssetClassUtil} from "@app/base/asset-class/asset-class.util";

@Injectable()
export class CalculationService {

  private calculation: Calculation;
  private noCacheHeaders: Headers;

  /**
   * call this when any data was changed on FE
   * this unblocks undo and save button
   * @type {EventEmitter<any>}
   */
  private onChange = new EventEmitter<any>();

  /**
   * notify components to refresh their charts
   * calls when reset or undo was triggered
   *
   * emitted value can contain the operation name
   * @type {EventEmitter<any>}
   */
  private onRefresh = new EventEmitter<any>();

  /**
   * notify components to refresh their structures (new or changed models available)
   * when model have been updated and metadata or charts need's to refresh completely
   * @type {EventEmitter<any>}
   */
  private onReimport = new EventEmitter<any>();

  /**
   * state of undo button and save button
   * @type {boolean}
   */
  private changes = false;

  hasChanges() {

    return this.changes;
  }

  readOnly() {
    return this.calculation.readOnly;
  }

  get calculationChangeHandler() {

    return this.onChange;
  }

  get calculationRefreshHandler() {

    return this.onRefresh;
  }

  get calculationReimportHandler() {

    return this.onReimport;
  }

  constructor(private http: Http,
              private notificationService: NotificationService,
              private javaCalculationsService: JavaCalculationsService) {

    this.onChange.subscribe(() => {

      this.changes = true
    });

    this.noCacheHeaders = new Headers();
    this.noCacheHeaders.append('Cache-control', 'no-cache');
    this.noCacheHeaders.append('Cache-control', 'no-store');
    this.noCacheHeaders.append('Pragma', 'no-cache');
    this.noCacheHeaders.append('Expires', '0');
  }

  fetchCalculation(calculationId: number): Observable<Calculation> | Calculation {

    if (this.calculation && this.calculation.id == calculationId)
      return this.calculation;

    return this.http.get(environment.url + '/api/calculation/' + calculationId, { headers: this.noCacheHeaders } )
      .map(response => response.json())
      .map(calculation => {

        this.changes = false;
        this.calculation = calculation;
        this.calculation.id = calculation;

        // workshop temp
        calculation.efficientPortfoliosUser = [];
        this.calculation.efficientPortfoliosUser = calculation.efficientPortfoliosUser;
        this.calculation.efficientPortfoliosMarket = calculation.efficientPortfoliosUser;
        this.calculation.efficientPortfoliosIs = calculation.efficientPortfoliosUser;
        this.calculation.currentPortfolio = calculation.efficientPortfoliosUser[0];
        this.calculation.userDefinedPortfolio = calculation.efficientPortfoliosUser[0];

        CalculationUtil.parseData(calculation);

        // extract asset classes & rf & allocations
        CalculationUtil.initStructures(calculation);

        // init & insert metadata to groups
        CalculationUtil.setCalculationMetadata(calculation);

        // set associations and references between objects
        CalculationUtil.setAssociations(calculation);

        // get sum of allocations etc.
        // CalculationUtil.collectData( calculation );

        // set user default values for every model
        CalculationUtil.setUserDefaults(calculation);

        // get optimal interpolated portfolio
        // CalculationUtil.calculateOptimalPortfolio( calculation );

        CalculationUtil.setSavedValues(calculation);

        // save last saved/applied values, needed when we recalculate something on the fly, without Applying calculation
        // CalculationUtil.setPortfolioAppliedValues(calculation);

        // update calculation metadata
        // CalculationUtil.updateCalculationMetadata( calculation );

        return calculation;
      });
  }

  getCalculation(): Calculation {

    return this.calculation;
  }

  applyChanges() {

    if (this.readOnly() || !this.hasChanges())
      return;

    let progress = this.notificationService.openProgress( 'Applying and saving changes.' );

    this.http.post(environment.url + '/api/calculation/' + 1 + '/apply', CalculationUtil.getAdjustedData( this.calculation ))
      .map(response => response.json())
      .subscribe((c: CalculationApply) => {

        /* insert new portfolios and set new associations */
        this.calculation.efficientPortfoliosUser = c.efficientPortfoliosUser;
        this.calculation.efficientPortfoliosMarket = c.efficientPortfoliosUser;
        this.calculation.efficientPortfoliosIs = c.efficientPortfoliosUser;
        this.calculation.currentPortfolio = c.efficientPortfoliosUser[0];
        this.calculation.userDefinedPortfolio = c.efficientPortfoliosUser[0];

        CalculationUtil.setAllPortfolioAllocationAssociations(this.calculation);

        /* copy user defined values to adjusted values for every model */
        // CalculationUtil.setUserAdjustments( this.calculation );

        CalculationUtil.setSavedValues( this.calculation );

        /* update asset class returns after save */
        // CalculationUtil.applyUpdatedAssetClasses( this.calculation, c.assetClasses, c.assetClassGroups );

        CalculationUtil.setPortfolioAppliedValues(this.calculation);

        /* get optimal portfolio from new user adjustments (e.g optimal tracking error ) */
        CalculationUtil.calculateOptimalPortfolio( this.calculation );

        this.changes = false;
        this.onRefresh.next('apply');

        progress.close();

      }, ( error ) => {
        ErrorUtil.handleErrorResponse('The analysis could not applied and saved.', error, this.notificationService, progress);
      });
  }

  undoChanges() {

    if (!this.changes)
      return;

    let progress = this.notificationService.openProgress( 'Reverting changes' );

    this.javaCalculationsService.updateBubbleChart(this.calculation).subscribe( () => {

      /* set user adjusted values to last saved values for every model */
      CalculationUtil.setUserDefaults(this.calculation);
      CalculationUtil.resetAppliedValues(this.calculation);
      CalculationUtil.resetSavedValues( this.calculation );

      /* get optimal portfolio from new user adjustments (e.g optimal tracking error ) */
      CalculationUtil.calculateOptimalPortfolio( this.calculation );

      // update calculation metadata
      CalculationUtil.updateCalculationMetadata( this.calculation );

      progress.close();

      this.changes = false;
      this.onRefresh.next();


    }, error => {
      ErrorUtil.handleErrorResponse('The changes could not be undone.', error, this.notificationService, progress);
    });

  }

  resetChanges() {
    if (this.readOnly()) {
      return;
    }
    this.notificationService.openDecission( {

      title: 'Reset changes?',
      question: 'This will restore the calculation to market data and remove any views or previous changes',
      options: [

        {
          label: 'Reset changes',
          onClick: () => {

            let progress = this.notificationService.openProgress( 'Reseting to market.' );

            this.http.get(environment.url + '/api/calculation/' + this.calculation.id + '/reset', { headers: this.noCacheHeaders } )
              .map(response => response.json())
              .subscribe((c: CalculationUpdate) => {

                /* set user adjustments to market data for every model */
                CalculationUtil.setUserDefaults( this.calculation, true, c );
                CalculationUtil.resetSavedValues( this.calculation, c );

                /* update asset class returns after save */
                CalculationUtil.applyUpdatedAssetClasses( this.calculation, c.assetClasses, c.assetClassGroups );

                /* get optimal portfolio from new user adjustments (e.g optimal tracking error ) */
                CalculationUtil.calculateOptimalPortfolio( this.calculation );

                // update calculation metadata
                CalculationUtil.updateCalculationMetadata( this.calculation );

                this.changes = true;
                this.onRefresh.next();

                progress.close();

              }, ( error ) => {
                ErrorUtil.handleErrorResponse('The analysis could not be saved.', error, this.notificationService, progress);
              });
          }
        },
        {
          label: 'Cancel'
        }
      ]

    } );
  }

  /**
   * reimport new IS views for current calculation
   */
  reloadRiskFactorWithISViews() : Observable< RiskFactor[] > {

    return this.http.get(environment.url + '/api/calculation/' + this.calculation.id + '/risk-factors', { headers: this.noCacheHeaders } )
      .map( response => response.json())
      .map( (riskFactors: RiskFactor[]) => {

        CalculationUtil.reimportISViews(this.calculation, riskFactors);
        return riskFactors;
      } );
  }

  /**
   * reimport allocation constraints for current calculation
   */
  reimportAllocationConstraints() {

    this.http.get(environment.url + '/api/calculation/' + this.calculation.id + '/constraints', { headers: this.noCacheHeaders })
      .map(response => response.json())
      .subscribe((allocationConstraint: AllocationConstraint[]) => {

        CalculationUtil.reimportAllocationConstraints(this.calculation, allocationConstraint);
        this.onReimport.next();
        this.onRefresh.next();
      });
  }

  reimportAssetClassesAllocationAndConstraints() {

    this.http.get(environment.url + '/api/calculation/' + this.calculation.id + '/asset-classes', { headers: this.noCacheHeaders })
      .map(response => response.json())
      .subscribe((assetClassGroups: AssetClassGroup[]) => {

        CalculationUtil.reimportUserDefinedAllocationAndConstraintsAndLiabilities(this.calculation, assetClassGroups);
        AssetClassUtil.updateLiabilitiesAndMetadata( this.calculation.assetClassGroups );
        this.onReimport.next();
        this.onRefresh.next();
      });
  }

  reimportDualConstraints() {

    this.http.get(environment.url + '/api/calculation/' + this.calculation.id + '/dual-constraints', { headers: this.noCacheHeaders })
      .map(response => response.json())
      .subscribe((dualConstraints: DualConstraint[]) => {

        CalculationUtil.reimportDualConstraints(this.calculation, dualConstraints);
        this.onReimport.next();
        this.onRefresh.next();
      });
  }

  recalculateDurationConstraints() {

    return this.http.post(environment.url + '/api/calculation/' + this.calculation.id + '/duration-constraint', CalculationUtil.getAssetClassAllocations( this.calculation ) )
      .map( response => response.json() )
      .map( durationConstraints => {

        CalculationUtil.updateUserDefinedAndOptimalDurationConstraints( this.calculation, durationConstraints );
      } );
  }

  private updateCalculationModel(calculation:Calculation) {
    this.changes = false;
    this.calculation = calculation;

    CalculationUtil.parseData(calculation);

    // extract asset classes & rf & allocations
    CalculationUtil.initStructures(calculation);

    // init & insert metadata to groups
    CalculationUtil.setCalculationMetadata(calculation);

    // set associations and references between objects
    CalculationUtil.setAssociations(calculation);

    // get sum of allocations etc.
    CalculationUtil.collectData( calculation );

    // set user default values for every model
    CalculationUtil.setUserDefaults(calculation);

    // get optimal interpolated portfolio
    CalculationUtil.calculateOptimalPortfolio( calculation );

    CalculationUtil.setSavedValues(calculation);

    // save last saved/applied values, needed when we recalculate something on the fly, without Applying calculation
    CalculationUtil.setPortfolioAppliedValues(calculation);

    // update calculation metadata
    CalculationUtil.updateCalculationMetadata( calculation );
  }

}
