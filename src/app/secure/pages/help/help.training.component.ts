import {Component} from '@angular/core';
import {MatDialogRef, MatSnackBar} from "@angular/material";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ILoggedInUser} from "../../../core/models";
import {IProperty} from "../../../core/models/property";
import {AuthService, ContactService, PerformanceService, PropertyService} from "../../../core/services";
import {IBookTrainingContact} from "../../../core/models/contact";
import {ILegacyResponse} from "../../../core/models/common";

@Component({
  selector: 'help-training-component',
  templateUrl: 'help.training.component.html',
})
export class HelpTrainingComponent{
  sending: boolean = false;
  focusFirst: boolean = false;

  form = new FormGroup({
    first: new FormControl('', [
      Validators.required,
    ]),
    last: new FormControl('', [
      Validators.required,
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ]),
    date: new FormControl('', [
      Validators.required,
    ]),
    note: new FormControl('', [

    ]),
    someoneElse: new FormControl('', [

    ])
  });

  dateFilter = (d: Date): boolean => {
    const day = d.getDay();

    return (day === 2 || day === 4) && d.getTime() > (new Date()).getTime();
  };

  constructor(public dialogRef: MatDialogRef<HelpTrainingComponent>,
              private authService: AuthService,
              private propertyService: PropertyService,
              private snackBar: MatSnackBar,
              private contactService: ContactService,
              private performanceService: PerformanceService) {

  }


  async ngOnInit() {
    this.performanceService.start();

    setTimeout(() => {
      this.focusFirst = true;
    }, 500);
    this.performanceService.fireGoogleAnalytics('Book Training');
  }

  cancel(): void {
    this.dialogRef.close();
  }

  async send() {
    if (!this.form.valid) {
      return;
    }
    this.sending = true;

    const me: ILoggedInUser = this.authService.self.getValue();
    const properties: IProperty[] = await this.propertyService.search({
      limit: 20,
      permission: ["PropertyManage"],
      active: true,
      select: "name",
      skipAmenities: true
    });

    if (!properties) {
      return;
    }

    const contact: IBookTrainingContact = {
      name: `${me.first} ${me.last}`,
      email: me.email,
      requesterName: `${this.form.value.first} ${this.form.value.last}`,
      requesterEmail: this.form.value.email,
      someoneElse: this.form.value.someoneElse,
      date: (this.form.value.date as Date).toLocaleDateString(),
      subject: "Training Request",
      message: this.form.value.note,
      properties: properties.map((property: IProperty) => property.name).join(", "),
      role: me.roles[0],
      company: me.orgs[0].name,
    };

    const response: ILegacyResponse = await this.contactService.send(contact);

    if (!response) {
      return;
    }

    this.sending = false;

    if (response.success) {
      // Reset data
      this.form.reset();

      // Reset errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key).setErrors(null);
      });
      this.snackBar.open("Thank you for your submission. Someone will contact you shortly.", 'X', {panelClass: ["snack-bar-success"]});
      this.dialogRef.close();
    } else {
      this.snackBar.open(response.errors.map((x) => x.msg).join("\r\n"), 'X', {panelClass: ["snack-bar-error"]});
    }
  }
}
