import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { UsersService } from '../../services/users.service';
import { GlobalService } from '../../services/global.service';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AppConstants } from '../../app.config';
import { environment } from '../../../environments/environment';
import { Message } from 'primeng/primeng';
import * as async from 'async';
import { TranslateService } from "@ngx-translate/core";
import { ShareDataService } from '../../services/share-data.service';
declare var $;


@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {
  profileData: object;
  data: object;
  editProfileForm: FormGroup;
  isSubmited: boolean = false;
  isCompSubmited: boolean = false;
  returnData: any;
  loading: boolean = false;
  errmsg: any;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  profileUrl: string;
  defaultLang: any = "English";
  editFlag: boolean = true;
  dialCode: string;
  countryCode: string;
  countryCodeCompany: string;
  changePwdForm: FormGroup;
  isPasswordSubmited: boolean = false;
  isPasswordMatched: boolean = false;
  editcompanyForm: FormGroup;
  countries: any;
  laguageList: any = [];
  job_title: string;
  industry: string;
  company_info: string;
  profileImage: String;
  msgs: Message[] = [];
  passNotEmpty: boolean = false;
  confirmpassNotEmpty: boolean = false;
  passnotmatched: boolean = false;
  passcheck: boolean = false;
  userData: any;
  categoryAttr: Array<Object> = [];
  openTab: Boolean = false;
  redirect_uri: String = '';

  constructor(private translate: TranslateService, private route: ActivatedRoute, private fb: FormBuilder, private router: Router, private localStorage: LocalStorageService, public userService: UsersService, public globalService: GlobalService, public shareDataService: ShareDataService) {
    this.userData = this.userService.readSession();

    this.editProfileForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)]],
      fname: ['', [Validators.required, Validators.min(2), Validators.max(30)]],
      lname: ['', [Validators.required, Validators.min(2), Validators.max(30)]],
      phone: ['', [Validators.required]],
      language: ['', [Validators.required]],
      title: ['Mr', [Validators.required]],


    });

    this.editcompanyForm = this.fb.group({
      company_name: ['', [Validators.required]],
      vat_number: ['', [Validators.required]],
      street: ['', [Validators.required]],
      postal_code: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: ['', [Validators.required]],
      job_title: ['', [Validators.required]],
      industry: ['', [Validators.required]],
      company_phone: ['', [Validators.required]],
      company_type: ['', [Validators.required]]
    });

    this.changePwdForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]],
      new_password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]],
      confirm_password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]],
    });
  }

  ngOnInit() {
    //set default country number and country code on load
    this.getCountries();
    this.getProfileInfo();
    this.getAttributes();
    this.route.queryParams
      .subscribe(params => {
        if (params.openTab) {
          this.openTab = true;
        }
        if (params.redirect_uri) {
          this.redirect_uri = params.redirect_uri
        }
      });
  }

  changePassword(chngpass, password) {
    if (!password) {
      this.passNotEmpty = true;
      return;
    }
    if (!chngpass) {
      this.confirmpassNotEmpty = true;
      return;
    }
    if (password != chngpass) {
      this.passnotmatched = true;
      return;
    } else {
      this.passnotmatched = false;
      return;
    }
  }

  getAttributes() {
    this.globalService.getAttributes()
      .subscribe(res => {
        if (res.status == 200) {
          this.categoryAttr = res.data;
        }
      })
  }

  /**
  * validating form on loading page
  */

  updatePassword() {
    if (this.changePwdForm.invalid) {
      this.isPasswordSubmited = true;
      return;
    }

    if ((this.changePwdForm.value.confirm_password) != (this.changePwdForm.value.new_password)) {
      this.isPasswordMatched = true;

    } else {
      this.loading = true;
      this.userService.updatePassword(this.changePwdForm.value)

        .subscribe(res => {
          this.loading = false;
          if (res.status == 200) {
            this.changePwdForm.reset();
            this.isPasswordSubmited = false;
            this.msgs = [];
            this.msgs.push({ severity: 'success', summary: 'Success', detail: res.msg });
          }
          else {
            this.msgs = [];
            this.msgs.push({ severity: 'error', summary: 'Error', detail: res.msg });
          }
        });

    }


  }

  /**
 * on init get country list
 */
  getCountries() {
    this.loading = true;
    this.globalService.getCountries()
      .subscribe(res => {
        this.loading = false;
        this.countries = [];
        if (res.status == 200) {
          this.countries = res.data;
        }
      });
  }


  /**
   * on init get profile info
   */
  getProfileInfo() {
    this.laguageList = AppConstants.Languages;
    this.loading = true;
    this.userService.getProfileInfo()
      .subscribe(res => {
        this.loading = false;
        if (res.status == 200) {
          this.editProfileForm.patchValue(res.data);
          res.data.country = res.data.country ? res.data.country._id : null;
          this.editcompanyForm.patchValue(res.data);
          this.setProfileImage(res.data.image);

          if (res.data.phone && res.data.phone.number) {
            this.editProfileForm.controls['phone'].setValue(res.data.phone.number);
          }
          else {
            this.editProfileForm.controls['phone'].setValue('')
          }

          if (res.data.phone && res.data.phone.countryCode != '' && res.data.phone.countryCode != undefined) {
            this.countryCode = res.data.phone.countryCode;
          }
          else {
            this.countryCode = 'es'
          }

          if (res.data.company_phone && res.data.company_phone.number) {
            this.editcompanyForm.controls['company_phone'].setValue(res.data.company_phone.number);
          }
          else {
            this.editcompanyForm.controls['company_phone'].setValue('')
          }

          if (res.data.company_phone && res.data.company_phone.countryCode != '' && res.data.company_phone.countryCode != undefined) {
            this.countryCodeCompany = res.data.company_phone.countryCode;
          }
          else {
            this.countryCodeCompany = 'es'
          }

          console.log("countryCode", this.countryCode);
        }
        else {
          this.msgs = [];
          this.msgs.push({ severity: 'error', summary: 'Error', detail: res.msg });
        }

      });

  }

  setProfileImage(image) {
    if (image) {
      if (image.startsWith('http')) {
        this.profileImage = image;
      }
      else {
        this.profileImage = `${environment.API_ENDPOINT}${image}`;
      }
    }
    else {
      this.profileImage = null;
    }

  }

  setLangForUser(lang) {
    if (lang != '-select-') {
      this.defaultLang = lang;
      this.showdefaultLang(lang);
    }
  }

  showdefaultLang(lang) {
    if (lang == 'English') {
      lang = 'en';
    }
    else if (lang == 'Spanish') {
      lang = 'es';
    }
    else if (lang == 'French') {
      lang = 'fr';
    }
    else if (lang == 'Portuguese') {
      lang = 'pt';
    }

    this.translate.use(lang);
    localStorage.currentLang = lang;
    this.shareDataService.setLang(lang);

  }

  /**
    * update user porifle with new data
    */
  updateProfile(e) {
    e.preventDefault();
    if (this.editProfileForm.invalid) {
      this.isSubmited = true;
      return;
    }
    let newProfileObj = { number: '', dialCode: '', countryCode: '' }
    newProfileObj.number = this.editProfileForm.value.phone;
    newProfileObj.dialCode = this.dialCode;
    newProfileObj.countryCode = this.countryCode;
    delete this.editcompanyForm.value.phone;
    this.editProfileForm.value['phone'] = newProfileObj;
    this.loading = true;
    this.userService.saveProfileInfo(this.editProfileForm.value)
      .subscribe(res => {
        this.loading = false;
        console.log("response status", res);
        if (res.status == 200) {
          this.userService.setSession(res.data);
          this.editProfileForm.value['phone'] = '';
          this.msgs = [];
          this.msgs.push({ severity: 'success', summary: 'Success', detail: res.msg });
        }
        else {
          this.msgs = [];
          this.msgs.push({ severity: 'error', summary: 'Error', detail: res.msg });
        }
      });
  }


  /**
   * update user porifle with new data
   */
  updateCompanyInfo() {
    if (this.editcompanyForm.invalid) {
      this.isCompSubmited = true;
      return;
    }
    let newProfileObj = { number: '', countryCode: '' }
    newProfileObj.number = this.editcompanyForm.value.company_phone;
    newProfileObj.countryCode = this.countryCodeCompany;
    delete this.editcompanyForm.value.phone;
    this.editcompanyForm.value['company_phone'] = newProfileObj;
    var postData = this.editcompanyForm.value;
    this.loading = true;
    this.userService.updateCompanyInfo(postData).subscribe(res => {
      this.loading = false;
      if (res.status == 200) {
        this.msgs = [];
        this.msgs.push({ severity: 'success', summary: 'Success', detail: res.msg });
        setTimeout(() => {
          if (this.openTab && this.redirect_uri) {
            this.router.navigate([`${this.redirect_uri}`]);
          }
        }, 1000);
      }
      else {
        this.msgs = [];
        this.msgs.push({ severity: 'error', summary: 'Error', detail: res.msg });
      }
    });
  }

  validateNum(event: any) {
    const pattern = /[0-9\+\-\ ]/;

    let inputChar = String.fromCharCode(event.charCode);
    if (event.keyCode != 8 && !pattern.test(inputChar)) {
      event.preventDefault();
    }
    if (this.editProfileForm.controls.phone.value.length > 9) {
      event.preventDefault();
    }

  }

  validateCompanyNo(event) {
    const pattern = /[0-9\+\-\ ]/;

    let inputChar = String.fromCharCode(event.charCode);
    if (event.keyCode != 8 && !pattern.test(inputChar)) {
      event.preventDefault();
    }
    if (this.editcompanyForm.controls.company_phone.value.length > 9) {
      event.preventDefault();
    }
  }

  onCountryChange(event) {
    console.log(event);
    this.dialCode = event.dialCode;
    this.countryCode = event.iso2;
  }

  onCompCountryChange(event) {
    this.countryCodeCompany = event.iso2;
  }

  onImageChange(event) {
    let reader = new FileReader();

    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);

      reader.onload = () => {
        var formData = new FormData();
        formData.append('image', event.target.files[0]);
        formData.append('_id', this.userData._id);
        this.loading = true;
        this.userService.uploadImage(formData).subscribe(res => {
          this.loading = false;
          if (res.status == 200) {
            this.profileImage = `${environment.API_ENDPOINT}${res.data.image}`;
            this.shareDataService.setProfileImage(res.data.imageThumbnail)
            this.msgs = [];
            this.msgs.push({ severity: 'success', summary: 'Success', detail: res.msg });
          }
          else {
            this.msgs = [];
            this.msgs.push({ severity: 'success', summary: 'Success', detail: res.msg });
          }
        })
      };
    }
  }
}
