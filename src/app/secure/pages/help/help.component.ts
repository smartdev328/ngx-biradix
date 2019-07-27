import { Component} from '@angular/core';
import {IContact, ILoggedInContact} from "../../../core/models/contact";
import {AuthService, ContactService, PerformanceService, PropertyService} from "../../../core/services";
import {ILoggedInUser} from "../../../core/models";
import {IProperty} from "../../../core/models/property";
import {FormControl, FormGroup, FormGroupDirective, Validators} from "@angular/forms";
import {MatDialog, MatSnackBar} from "@angular/material";
import {ILegacyResponse} from "../../../core/models/common";
import {HelpTrainingComponent} from "./help.training.component";

@Component({
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent  {
  sending: boolean = false;
  form = new FormGroup({
    subject: new FormControl('', [
      Validators.required,
    ]),
    message: new FormControl('', [
      Validators.required,
    ])
  });

  constructor(private authService: AuthService,
              private propertyService: PropertyService,
              private contactService: ContactService,
              private snackBar: MatSnackBar,
              public dialog: MatDialog,
              private performanceService: PerformanceService) {

  }

  async ngOnInit() {
    this.performanceService.start();

    // async services would go here so we can time them

    this.performanceService.fireGoogleAnalytics('Help');
  }

  bookTraining() {
    const dialogRef = this.dialog.open(HelpTrainingComponent, {

    });

    dialogRef.afterClosed().subscribe(result => {

    });
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

    const contact: ILoggedInContact = {
      name: `${me.first} ${me.last}`,
      email: me.email,
      subject: this.form.value.subject,
      message: this.form.value.message,
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
    } else {
      this.snackBar.open(response.errors.map((x) => x.msg).join("\r\n"), 'X', {panelClass: ["snack-bar-error"]});
    }
  }
}
