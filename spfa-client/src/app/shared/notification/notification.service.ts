import {Injectable} from "@angular/core";
import {MdDialog} from "@angular/material";
import {ProgressComponent} from "./progress.component";
import {DecissionComponent} from "./decission.component";
import {InfoComponent} from "./info.component";
import {CopyComponent} from "./copy.component";
import {ErrorComponent} from "@app/shared/notification/error.component";
import {Exception} from "@app/shared/exception.model";
import {isNullOrUndefined} from "util";
@Injectable()
export class NotificationService {

  constructor(private dialog: MdDialog) { }

  openProgress( title?: string, text?: string ) : any {

    let dialogRef = this.dialog.open( ProgressComponent, {

      disableClose: true
    });

    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.text = text;

    return {

      dialog: dialogRef,
      close: () => dialogRef.close(),
      setTitle: (title: string) => { dialogRef.componentInstance.title = title },
      setText: (text: string) => { dialogRef.componentInstance.text = text }
    }
  }

  openInfo( options: {

    title: string,
    text?: string

  } ) : any {

    let dialogRef = this.dialog.open( InfoComponent );

    dialogRef.componentInstance.title = options.title;
    dialogRef.componentInstance.text = options.text;

    return {

      dialog: dialogRef,
      close: () => dialogRef.close(),
      setTitle: (title: string) => { dialogRef.componentInstance.title = title },
      setText: (text: string) => { dialogRef.componentInstance.text = text }
    }
  }

  openInfoError( failMsg: string, error:Exception ) : any {

    let options = {
      title: 'We encountered an issue',
      text: failMsg + ' Please try again or contact the IT Application Owner to investigate the error.' + '<br><br><em>' + error.message + '</em>',
      stackTrace: '<u>Error stack trace</u> <br><pre>' +error.stackTrace +'</pre>',
      rootCause: error.rootCause ? '<u>Root cause</u> <br>' + error.rootCause : null
    };

    let dialogRef = this.dialog.open( ErrorComponent );

    dialogRef.componentInstance.title = options.title;
    dialogRef.componentInstance.text = options.text;
    dialogRef.componentInstance.stackTrace = options.stackTrace;
    dialogRef.componentInstance.rootCause = options.rootCause;

    return {

      dialog: dialogRef,
      close: () => dialogRef.close(),
      setTitle: (title: string) => { dialogRef.componentInstance.title = title },
      setText: (text: string) => { dialogRef.componentInstance.text = text }
    }

  }

  openInfoErrorMessage( failMsg: string, errorMessage:string, rootCause?:string, stackTrace?:string ) : any {

    let options = {
      title: 'We encountered an issue',
      text: failMsg + ' Please try again or contact the IT Application Owner to investigate the error.' + '<br><br><em>' + errorMessage + '</em>',
      stackTrace: stackTrace ? '<u>Error stack trace</u> <br><pre>' +stackTrace+ '</pre>' : null,
      rootCause: rootCause ? '<u>Root cause</u> <br>' + rootCause : null
    };


    let dialogRef = this.dialog.open( ErrorComponent );

    dialogRef.componentInstance.title = options.title;
    dialogRef.componentInstance.text = options.text;
    dialogRef.componentInstance.rootCause = options.rootCause;
    dialogRef.componentInstance.stackTrace = options.stackTrace;

    return {

      dialog: dialogRef,
      close: () => dialogRef.close(),
      setTitle: (title: string) => { dialogRef.componentInstance.title = title },
      setText: (text: string) => { dialogRef.componentInstance.text = text }
    }

  }

  openDecission( decissionOptions: {

    title: string,
    question: string;
    options: DecissionOption[];

  } ) : any {

    let dialogRef = this.dialog.open( DecissionComponent );
    dialogRef.componentInstance.title = decissionOptions.title;
    dialogRef.componentInstance.question = decissionOptions.question;
    dialogRef.componentInstance.options = decissionOptions.options;

    return {

      dialog: dialogRef,
      close: () => dialogRef.close(),
      setTitle: (title: string) => { dialogRef.componentInstance.title = title },
      setQuestion: (question: string) => { dialogRef.componentInstance.question = question },
      getOptions: () => { dialogRef.componentInstance.options }
    }
  }

  openCopyDialog( copyText: string, ) {

    let dialogRef = this.dialog.open( CopyComponent );
    dialogRef.componentInstance.copyText = copyText;

    return {

      dialog: dialogRef,
      close: () => dialogRef.close()
    }
  }
}

export interface DecissionOption {

  label: string,
  onClick?(): void
}
