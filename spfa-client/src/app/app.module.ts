import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {AppComponent} from "./app.component";
import {ScopeModule} from "./page/scope/scope.module";
import {CalculationModule} from "./page/calculation/calculation.module";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {AppRoutingModule} from "@app/app.routing.module";

@NgModule({
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    ScopeModule,
    CalculationModule,
    AppRoutingModule
  ],
  declarations: [
    AppComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
