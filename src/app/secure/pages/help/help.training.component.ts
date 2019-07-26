import {Component, Inject} from '@angular/core';
import {MatDialogRef} from "@angular/material";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'help-training-component',
  templateUrl: 'help.training.component.html',
})
export class HelpTrainingComponent {
  sending: boolean = false;

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
    date: new FormControl({value: '', disabled: true}, [
      Validators.required,
    ]),
    note: new FormControl('', [
      Validators.required,
    ]),
    someoneElse: new FormControl('', [

    ])
  });

  dateFilter = (d: Date): boolean => {
    const day = d.getDay();

    return (day === 2 || day === 4) && d.getTime() > (new Date()).getTime();
  };

  constructor(public dialogRef: MatDialogRef<HelpTrainingComponent>) {}


  cancel(): void {
    this.dialogRef.close();
  }

  send() {
    if (!this.form.valid) {
      return;
    }
    this.sending = true;
  }
}
