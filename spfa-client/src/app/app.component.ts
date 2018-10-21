import {Component, ViewEncapsulation, OnInit} from '@angular/core';
import {Http, Headers} from "@angular/http";
import {environment} from "../environments/environment";
import {Observable} from "rxjs";
import {User} from "./base/user/user.model";
import {UserService} from "@app/base/user/user.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit{

  private noCacheHeaders: Headers;
  user:User;

  ngOnInit(): void {
    this.userService.fetchActiveUser().subscribe( user => {
      this.user = user;
    });
  }

  constructor(private http: Http, private userService: UserService) {
    this.noCacheHeaders = new Headers();
    this.noCacheHeaders.append('Cache-control', 'no-cache');
    this.noCacheHeaders.append('Cache-control', 'no-store');
    this.noCacheHeaders.append('Pragma', 'no-cache');
    this.noCacheHeaders.append('Expires', '0');
  }


  get fullName() {
    return this.user.firstName + ' ' + this.user.lastName;
  }

  get avatarUrl() {
    return this.user.avatarUrl ? this.user.avatarUrl : "assets/icons/default_avatar.jpg";
  }

}
