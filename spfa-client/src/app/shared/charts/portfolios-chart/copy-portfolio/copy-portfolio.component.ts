import {Component, OnInit, EventEmitter} from '@angular/core';
import {Portfolio} from "@app/base/asset-class/asset-class.model";
import {MdDialogRef} from "@angular/material";

@Component({
  selector: 'app-copy-portfolio',
  templateUrl: './copy-portfolio.component.html',
  styleUrls: ['copy-portfolio.component.scss']
})
export class CopyPortfolioComponent implements OnInit {

  portfolios: Portfolio[] = [];
  selectedPortfolio: Portfolio;
  emitter: EventEmitter<Portfolio>;

  constructor(public dialogRef: MdDialogRef<CopyPortfolioComponent>) { }

  ngOnInit() {
  }

  selectPortfolio(){
    this.emitter.next( this.selectedPortfolio );
    this.dialogRef.close( this.selectedPortfolio );
  }

}
