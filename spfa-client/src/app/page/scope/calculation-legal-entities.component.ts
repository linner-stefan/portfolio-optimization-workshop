import {Component, Inject, ViewEncapsulation} from "@angular/core";
import {Calculation} from "../../base/calculation/model/calculation.model";
import {MD_DIALOG_DATA} from "@angular/material";
@Component({

  templateUrl: 'calculation-legal-entities.component.html',
  styleUrls: ['calculation-legal-entities.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CalculationLegalEntitiesComponent {

  constructor(@Inject(MD_DIALOG_DATA) public calculation: Calculation) { }
}
