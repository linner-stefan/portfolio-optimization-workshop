import {Injectable} from "@angular/core";
import {Http, Headers} from "@angular/http";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/observable/of';
import {environment} from "../../../environments/environment";
import {User} from "@app/base/user/user.model";
import {Calculation} from "@app/base/calculation/model/calculation.model";
@Injectable()
export class UserService {

  private noCacheHeaders: Headers;

  constructor(private http: Http) {
    this.noCacheHeaders = new Headers();
    this.noCacheHeaders.append('Cache-control', 'no-cache');
    this.noCacheHeaders.append('Cache-control', 'no-store');
    this.noCacheHeaders.append('Pragma', 'no-cache');
    this.noCacheHeaders.append('Expires', '0');
  }

  private user:User;

  getUser() : User {
    return this.user;
  }

  public fetchActiveUser() : Observable< User > {

    return this.http.get(environment.url + '/api/profile/user', { headers: this.noCacheHeaders } )
      .map( response => response.json())
      .map( (user: User) => {
        this.user = user;
        this.user.isAdmin = !!(user.roles && user.roles.find(role => role === "Admin"));
        return user;
      } );
  }

  public isActiveUserOwner(calculation:Calculation):boolean {
    if (!this.user) {
      return false;
    }
    return true;
    // return calculation.createdBy.toLowerCase()===this.user.id.toLowerCase();
  }

}
