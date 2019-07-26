import {Component, Inject} from '@angular/core';
import {MatDialogRef} from "@angular/material";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'help-training-component',
  templateUrl: 'help.training.component.html',
})
export class HelpTrainingComponent {

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
      Validators.required,
    ])
  });

  constructor(public dialogRef: MatDialogRef<HelpTrainingComponent>) {}

  cancel(): void {
    this.dialogRef.close();
  }

}
