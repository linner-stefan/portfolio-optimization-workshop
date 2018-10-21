///<reference path="../../../node_modules/@angular/core/src/metadata/lifecycle_hooks.d.ts"/>
import {Directive, HostListener, ElementRef, Renderer, Input, OnInit, Component} from "@angular/core";
import {CalculationService} from "@app/base/calculation/calculation.service";

@Component({
  selector: 'read-more',
  template: `
        <button md-button class="pointer" (click)="isCollapsed =! isCollapsed">{{isCollapsed ? 'Show more' : 'Show less'}}</button>
        <div style="max-height: 400px; overflow-y: auto">
          <ng-content *ngIf="!isCollapsed"></ng-content>
        </div>
    `
})

export class ReadMoreComponent {

  isCollapsed: boolean = true;

}
