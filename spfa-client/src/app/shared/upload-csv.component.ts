import {Component, OnInit, Input, Output, EventEmitter} from "@angular/core";
import {ControlValueAccessor, FormBuilder} from "@angular/forms";
import {Router} from "@angular/router";
import {Http, Headers} from "@angular/http";
import {environment} from "../../environments/environment";
import {FileUploader, FileUploaderOptions, FileItem, ParsedResponseHeaders} from 'ng2-file-upload';
import {MdDialog,MdSlideToggleModule} from "@angular/material";
import {NotificationService} from "./notification/notification.service";
import {ErrorUtil} from "@app/util/error.util";
import {UserService} from "@app/base/user/user.service";

@Component({

  selector: 'upload-csv',
  templateUrl: 'upload-csv.component.html',
  styleUrls: ['upload-csv.component.scss']
})
export class UploadCSVComponent implements OnInit{

  @Input()
  apiUrl: string;

  @Input()
  title: string;

  @Input()
  uploadHistory: boolean = true;

  @Input()
  supportsDefaultData: boolean = false;


  @Output()
  onStart: EventEmitter<any> = new EventEmitter();

  @Output()
  onSuccess: EventEmitter<any> = new EventEmitter();

  @Output()
  onFailure: EventEmitter<any> = new EventEmitter();

  @Output()
  onLastUpdateChange: EventEmitter<string[]> = new EventEmitter();

  error: string;

  uploader: FileUploader;
  hasBaseDropZoneOver: boolean = false;
  hasAnotherDropZoneOver: boolean = false;

  useDefaultData: boolean = true;
  lastUploaded: string;
  isAdmin: boolean;

  constructor(private router: Router,
              private fb: FormBuilder,
              private http: Http,
              private dialog: MdDialog,
              private notificationService: NotificationService,
              private userService:UserService) {
    this.isAdmin=userService.getUser().isAdmin;
  }

  fileOverBase(e:any):void {
    this.hasBaseDropZoneOver = e;
  }

  fileOverAnother(e:any):void {
    this.hasAnotherDropZoneOver = e;
  }

  ngOnInit(): void {
    let progress;
    this.uploader = new FileUploader({url:this.constructUrl(),autoUpload: true });

    this.uploader.onBeforeUploadItem = (item: FileItem) => {
      this.onStart.next();
      progress = this.notificationService.openProgress( 'Uploading CSV file ...' );
    };
    this.uploader.onSuccessItem = (item: FileItem, response: string, status: number, headers: ParsedResponseHeaders) => {

      progress.close();
      if(this.uploadHistory) {
        this.lastUploaded = new Date().toISOString();
      }
      this.onSuccess.next();
      this.onLastUpdateChange.next([this.useDefaultData.toString(), this.lastUploaded,'false']);
      this.notificationService.openInfo( {
        title: 'Upload of CSV file has been successful',
      } );
    };
    this.uploader.onErrorItem = (item: FileItem, response:string, status: number, headers: ParsedResponseHeaders) => {

      ErrorUtil.handleErrorString('Upload of CSV file has failed ', response, this.notificationService, progress);
    };

    this.fillLastUpdateStatus(true);
  }

  fillLastUpdateStatus(initUpdate=false): void {
    if (this.uploadHistory) {
      let lastUploadUrl: string = environment.url + this.apiUrl + '/last' + (this.useDefaultData ? "?default=true" : "");
      this.http.get(lastUploadUrl).map(response => response.json()).subscribe(result => {
        if (result.dateTime && result.dateTime.length != 0) {
          this.lastUploaded = new Date(result.dateTime).toISOString();
        }else{
          this.lastUploaded=null;
        }

        this.onLastUpdateChange.next([this.useDefaultData.toString(), this.lastUploaded,initUpdate.toString()]);
      });
    }
  }

  onChangeType(checked: boolean) {
    this.useDefaultData=!checked;
    this.uploader.setOptions({url:this.constructUrl(),autoUpload:true})
    this.fillLastUpdateStatus();


  }

  private constructUrl():string {
    return environment.url + this.apiUrl + (this.useDefaultData? "?default=true": "");
  }
}
