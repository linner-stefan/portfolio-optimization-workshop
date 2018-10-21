///<reference path="../../../node_modules/@angular/core/src/metadata/lifecycle_hooks.d.ts"/>
import {Directive, HostListener, ElementRef, Renderer, Input, OnInit} from "@angular/core";
import {CalculationService} from "@app/base/calculation/calculation.service";

@Directive({
  selector: "[readonly-dir]"
})
export class ReadoOnlyDirective implements OnInit
{

  constructor(private el: ElementRef, private renderer: Renderer, private calculationService: CalculationService) {
  }

  ngOnInit(): void {
    if (this.calculationService.getCalculation().readOnly) {
      this.renderer.setElementClass(this.el.nativeElement,"disabled",true);
      this.renderer.setElementClass(this.el.nativeElement,"forbidden",true);
    }
  }

}
