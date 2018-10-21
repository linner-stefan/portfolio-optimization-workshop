import * as math from "mathjs";
import { saveAs } from 'file-saver/FileSaver';
import {NotificationService} from "@app/shared/notification/notification.service";
import {HttpResponse} from "@angular/common/http";
import {Response} from "@angular/http";
import {Exception} from "@app/shared/exception.model";

export class ErrorUtil {

  static handleErrorResponse(msg, error:Response, notificationService: NotificationService, progress?):void {
    let exception: Exception;
    try {
      exception = error.json();
    } catch (e) {
      exception = new Exception();
      exception.message = "Error while parsing Response object";
      console.error(error);
    }

    this.handleException(msg, exception, notificationService, progress);
  }

  static handleErrorString(msg, response:string, notificationService: NotificationService, progress?):void {
    let exception: Exception;
    try {
      exception = JSON.parse(response);
    } catch (e) {
      exception = new Exception();
      exception.message = "Error while parsing Response string";
      console.error(response);
    }
    this.handleException(msg, exception, notificationService, progress);
  }

  static handleException(msg, exception:Exception, notificationService: NotificationService, progress?):void {
    if (progress) {
      progress.close();
    }
    if (!msg) {
      msg = 'Operation failed'
    }
    notificationService.openInfoErrorMessage( msg, exception.message, exception.rootCause, exception.stackTrace );
    console.error( exception );
  }
}
