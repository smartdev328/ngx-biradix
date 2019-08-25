import {Component, Inject, OnInit} from '@angular/core';
import {MAT_SNACK_BAR_DATA, MatSnackBarRef} from "@angular/material";

@Component({
  selector: 'app-html-snackbar',
  templateUrl: './html-snackbar.component.html',
  styleUrls: ['./html-snackbar.component.scss']
})
export class HtmlSnackbarComponent implements OnInit {

  constructor(
    public snackBarRef: MatSnackBarRef<HtmlSnackbarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any
  ) { }

  ngOnInit() {
  }

}
