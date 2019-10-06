import {Component, Inject} from '@angular/core';
import {ApprovedListsService, PropertyService} from "../../../core/services";
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from "@angular/material";
import {APPROVED_LIST_LABELS,APPROVED_LIST_TYPE, IApprovedListItemRead, IUnapprovedListProperty} from "../../../core/models/approvedLists";
import {FormControl} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {debounceTime, startWith, switchMap} from "rxjs/operators";
import {ConfirmComponent} from "../../../shared/components";
import {HtmlSnackbarComponent} from "../../../shared/components/html-snackbar/html-snackbar.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ILegacyResponse, ILegacyResponseSingleError} from "../../../core/models/common";

export interface DialogData {
  value: string;
  type: APPROVED_LIST_TYPE;
  selectedProperties: IUnapprovedListProperty[];
  newValue: string;
}

@Component({
  selector: 'unapproved-lists-edit-component',
  templateUrl: 'unapproved-lists.edit.component.html',
})

export class UnapprovedListsEditComponent{
  updating: boolean = false;
  public propertyAutoComplete$: Observable<IApprovedListItemRead[]> = null;
  public autoCompleteControl = new FormControl();
  typeLabel: string = "";

  constructor(
    private approvedListsService: ApprovedListsService,
    private snackBar: MatSnackBar,
    private propertyService: PropertyService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<UnapprovedListsEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  async ngOnInit() {
    this.typeLabel = APPROVED_LIST_LABELS[this.data.type];
    this.autoCompleteControl.setValue({value: this.data.newValue});
    this.autoCompleteLogic();
  }

  autoCompleteLogic() {
    this.propertyAutoComplete$ = this.autoCompleteControl.valueChanges.pipe(
      startWith(''),
      // delay emits
      debounceTime(300),
      // use switch map so as to cancel previous subscribed events, before creating new once
      switchMap(value => {
        if (!value && typeof this.autoCompleteControl.value === "object") {
          value = this.autoCompleteControl.value.value;
        }
        if (value !== '') {
          // lookup from github
          return this.approvedListsService.searchApproved({ search: value, limit: 10, type: this.data.type, searchableOnly: false });
        } else {
          // if no value is present, return null
          return of(null);
        }
      })
    );
  }

  autoCompleteDisplay(property?: IApprovedListItemRead): string | undefined {
    return property ? property.value : undefined;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  update() {
    let valueToUse: string;

    // If it came from auto complete it will be an object, if someone types it in it will be a string;
    if (typeof this.autoCompleteControl.value === "object") {
      valueToUse = this.autoCompleteControl.value.value;
    } else {
      valueToUse = this.autoCompleteControl.value;
    }

    let error: string = "";

    if (this.data.value === valueToUse) {
      error = "Please provide a different value when editing an unapproved item.";
    } else if (!valueToUse) {
      error = "Please type in a new value to use";
    }
    if (error) {
      this.snackBar.openFromComponent(HtmlSnackbarComponent, {
        panelClass: ["snack-bar-error"],
        data: error,
      });
      return;
    }

    const propertyIds: string[] = this.data.selectedProperties.map(property => property.id);
    const dialogRef = this.dialog.open(ConfirmComponent, {
      width: '400px',
      data: {htmlConfirm: `Are you sure you want to update the <b>${this.typeLabel}</b> of properties currently using the value <b>"${this.data.value}"</b> to <b>${valueToUse}</b>? <Br><br>Properties affected: ${propertyIds.length}`}
    });

    this.updating = true;

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {

        const response: ILegacyResponseSingleError = await this.propertyService.massUpdate({propertyIds, type: this.data.type, oldValue: this.data.value, newValue: valueToUse});

        if (!response) {
          return;
        }

        if (response.success) {
          this.snackBar.openFromComponent(HtmlSnackbarComponent, {
            panelClass: ["snack-bar-success"],
            data: `<b>${this.typeLabel}</b>: <b>"${this.data.value}"</b> successfully updated to <b>${valueToUse}</b> for <b>${propertyIds.length}</b> properties.`,
          });

          this.dialogRef.close(true);
        } else {
          this.snackBar.openFromComponent(HtmlSnackbarComponent, {
            panelClass: ["snack-bar-error"],
            data: response.errors,
          });
        }
      }

      this.updating = false;
    });
  }

}
