import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RoundPipe} from "./round.pipe";
import {UploadCSVComponent} from "./upload-csv.component";
import {FileUploadModule} from "ng2-file-upload";
import {
  MdCardModule,
  MdButtonModule,
  MdDialogModule,
  MdProgressSpinnerModule,
  MdSlideToggleModule
} from "@angular/material";
import {BillionPipe} from "./billion.pipe";
import {NotificationService} from "./notification/notification.service";
import {ProgressComponent} from "./notification/progress.component";
import {InfoComponent} from "./notification/info.component";
import {DecissionComponent} from "./notification/decission.component";
import {PercentPipe} from "./percent.pipe";
import {CopyComponent} from "./notification/copy.component";
import {ReadoOnlyDirective} from "@app/shared/readonly-directive";
import {ReadMoreComponent} from "@app/shared/readmore";
import {ErrorComponent} from "@app/shared/notification/error.component";

@NgModule({

  imports: [

    CommonModule,
    MdCardModule,
    MdButtonModule,
    MdDialogModule,
    MdProgressSpinnerModule,
    MdSlideToggleModule,
    FileUploadModule
  ],
  declarations: [

    BillionPipe,
    PercentPipe,
    RoundPipe,
    UploadCSVComponent,
    ProgressComponent,
    InfoComponent,
    ErrorComponent,
    DecissionComponent,
    CopyComponent,
    ReadoOnlyDirective,
    ReadMoreComponent
  ],
  entryComponents: [

    UploadCSVComponent,
    ProgressComponent,
    InfoComponent,
    ErrorComponent,
    DecissionComponent,
    CopyComponent
  ],
  exports: [

    BillionPipe,
    PercentPipe,
    RoundPipe,
    UploadCSVComponent,
    ReadoOnlyDirective,
    ReadMoreComponent
  ],
  providers: [

    NotificationService
  ]
})
export class SharedModule { }
