import {Component, ViewEncapsulation} from "@angular/core";
import {CalculationService} from "../../base/calculation/calculation.service";
import {CanDeactivateCalculation} from "./calculation.guard";
import {Calculation} from "../../base/calculation/model/calculation.model";
import {MdDialog, DialogRole} from "@angular/material";
import {NotificationService} from "../../shared/notification/notification.service";
import {Response, Http} from "@angular/http";
import {FileUtil} from "@app/util/file.util";
import {environment} from "../../../environments/environment";
import {ErrorUtil} from "@app/util/error.util";
import {UserService} from "@app/base/user/user.service";
import {Router} from "@angular/router";

@Component({
  selector: 'calculation',
  templateUrl: './calculation.component.html',
  styleUrls: ['./calculation.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CalculationComponent implements CanDeactivateCalculation {

  calculation: Calculation;
  isOwner:boolean;
  isAdmin:boolean;
  businessUnitGroupNames : string;


  constructor(private dialog: MdDialog, private calculationService: CalculationService, private notificationService: NotificationService, private http: Http, private userService:UserService, private router: Router) {
    this.init();
  }

  private init() {
    this.calculation = this.calculationService.getCalculation();
    this.isOwner = this.userService.isActiveUserOwner(this.calculation);
    this.isAdmin = this.userService.getUser().isAdmin;

    // this.businessUnitGroupNames = this.calculation.businessUnitGroups.map(bug => bug.name).join(",");
  }

  get cobDate() : string {

    return (<Date>this.calculation.cob).toDateString();
  }

  get changes() {

    return this.calculationService.hasChanges();
  }

  undo() {

    if (this.calculationService.hasChanges())
      this.calculationService.undoChanges();
  }

  reset() {

    this.calculationService.resetChanges();
  }

  apply() {

    this.calculationService.applyChanges();
  }

  canNotDeactivate() {

    this.notificationService.openInfo( {

      title: 'Cannot leave calculation',
      text: 'There are unsaved changes in the calculation. Apply the calculation or Undo changes before leaving'

    } );
  }

  unlockCalculation() {

    if (!this.calculation.readOnly) {
      return;
    }
    this.notificationService.openDecission( {

      title: 'Unlock calculation?',
      question: 'This will make the calculation read write and any user will be able to change it !',
      options: [

        {
          label: 'Unlock calculation',
          onClick: () => {

            let progress = this.notificationService.openProgress( 'Unlocking calculation.' );

            this.http.get(environment.url + '/api/calculation/' + this.calculation.id + '/unlock' )
              .map(response => response.json())
              .subscribe((c: Calculation) => {
                this.calculation.readOnly=false;
                progress.close();

              }, ( error ) => {
                ErrorUtil.handleErrorResponse('The calculation could not be unlocked', error, this.notificationService, progress);
              });
          }
        },
        {
          label: 'Cancel'
        }
      ]

    } );
  }
}
