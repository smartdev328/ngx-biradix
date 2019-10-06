import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog, MatPaginator, MatSnackBar, MatSort} from '@angular/material';
import {MatTableDataSource} from '@angular/material/table';
import {ApprovedListsService, PerformanceService, SiteService} from "../../../core/services";
import {ConfirmComponent} from "../../../shared/components";
import {UnapprovedListsEditComponent} from "./unapproved-lists.edit.component";
import {
  APPROVED_LIST_LABELS,
  APPROVED_LIST_TYPE, IApprovedListItemRead, IUnapprovedListFrequenciesWithProperties,
  IUnapprovedListFrequency,
  IUnapprovedListProperty
} from "../../../core/models/approvedLists";
import {HtmlSnackbarComponent} from "../../../shared/components/html-snackbar/html-snackbar.component";
import { environment } from '../../../../environments/environment';

export interface IUnapprovedListViewModelRow extends IUnapprovedListFrequency {
  isOpen: boolean;
  isLoading: boolean;
  selectedProperties: IUnapprovedListProperty[];
  potentialMatches: string[];
}

@Component({
  selector: 'app-unapproved-lists',
  templateUrl: './unapproved-lists.component.html',
  styleUrls: ['./unapproved-lists.component.scss']
})

export class UnapprovedListsComponent implements OnInit {

  @ViewChild(MatPaginator, {static: true}) unapprovedListPaginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  public baseUrl = environment.baseUrl;
  typeFilter: APPROVED_LIST_TYPE = APPROVED_LIST_TYPE.OWNER;
  valueFilter: string;
  fields: any;
  isIEorEdge: boolean = this.siteService.isIEorEdge();
  numberOfResults: number = -1;
  loading: boolean = true;
  viewModel: IUnapprovedListViewModelRow[];
  unapprovedListWithProperties: IUnapprovedListFrequenciesWithProperties;
  displayedColumns: string[] = ['value', 'type', 'count', 'actions'];
  approvedItems: IApprovedListItemRead[] = [];

  dataSource: MatTableDataSource<IUnapprovedListFrequency>;

  constructor(private approvedListsService: ApprovedListsService,
              private performanceService: PerformanceService,
              private siteService: SiteService,
              private snackBar: MatSnackBar,
              public dialog: MatDialog,
              private route: ActivatedRoute,
              private router: Router) {
  }

  filterBySearch() {
    this.dataSource.filter = (this.valueFilter || "").trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async toggleRow(row: IUnapprovedListViewModelRow) {
    row.isOpen = !row.isOpen;

    if (row.isOpen) {
      row.isLoading = true;

      // DO this only the first time, get all items
      if (!this.approvedItems.length) {
        this.approvedItems = await this.approvedListsService.searchApproved({
          limit: 10000,
          type: this.typeFilter,
          searchableOnly: false
        });
      }

      row.potentialMatches = this.getPotentialMatches(row.value);

      row.isLoading = false;
    }
  }

  async ngOnInit() {
    this.performanceService.start();

    if (this.route.snapshot.queryParamMap.get("type")) {
      this.typeFilter = this.route.snapshot.queryParamMap.get("type") as APPROVED_LIST_TYPE;
    }
    this.route.queryParamMap.subscribe(queryParams => {
      if (queryParams.get("type")) {
        if (this.typeFilter !== queryParams.get("type") as APPROVED_LIST_TYPE) {
          this.typeFilter = queryParams.get("type") as APPROVED_LIST_TYPE;
          this.run();
        }
      }
    });

    this.fields = APPROVED_LIST_LABELS;
    this.dataSource = new MatTableDataSource();
    this.dataSource.paginator = this.unapprovedListPaginator;
    this.dataSource.sort = this.sort;
    this.dataSource.connect().subscribe(d => {
      this.numberOfResults = d.length;
    });
    this.dataSource.sortingDataAccessor = (data, sortHeaderId) => {
      if (typeof data[sortHeaderId] === "string") {
        return data[sortHeaderId].toLocaleLowerCase();
      }
      else {
        return data[sortHeaderId]
      }
    };


    await this.run();

    this.performanceService.fireGoogleAnalytics('Unapproved Lists');
  }

  async run() {
    this.loading = true;
    this.approvedItems = [];
    this.unapprovedListWithProperties = await this.approvedListsService.getUnapprovedFrequencyWithProperties(this.typeFilter);
    this.viewModel = this.unapprovedListWithProperties.frequencies.map((row: IUnapprovedListFrequency) => {
      return {
        ...row,
        isOpen: false,
        isLoading: false,
        potentialMatches: [],
        selectedProperties: this.unapprovedListWithProperties.properties.filter(property => property.value === row.value)
      }
    })
    this.dataSource.data = this.viewModel;
    this.filterBySearch();
    this.loading = false;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams:
        {
          type: this.typeFilter
        },
      replaceUrl: true,
    });

  }

  async approve(item: IUnapprovedListFrequency, isAutocomplete: boolean) {
    let confirmExtension : string;
    if(isAutocomplete) {
      confirmExtension = "and add it to the list of autocomplete suggestions";
    } else {
      confirmExtension = "without adding it to the list of autocomplete suggestions";
    }

    const dialogRef = this.dialog.open(ConfirmComponent, {
      width: '400px',
      data: {htmlConfirm: `Are you sure you want to approve <b>"${item.value}"</b> as a valid <b>"${this.fields[this.typeFilter]}"</b> value <i><u>"${confirmExtension}"</u><i>?<Br>`}
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        await this.approvedListsService.createApproved({
          value: item.value,
          type: this.typeFilter,
          searchable: isAutocomplete
        });
        this.snackBar.openFromComponent(HtmlSnackbarComponent, {
          panelClass: ["snack-bar-success"],
          data: `<b>${this.fields[this.typeFilter]} - ${item.value}</b> approved successfully.`,
        });
        const index: number = this.viewModel.findIndex(d => d === item);
        this.viewModel.splice(index, 1);
        this.dataSource.data = this.viewModel;

        // Reset approved items in case we added an approved one.
        this.approvedItems = [];
      }
    });
  }

  edit(row: IUnapprovedListViewModelRow, newValue: string) {
    row.selectedProperties = this.unapprovedListWithProperties.properties.filter(property => property.value === row.value);
    const dialogRef = this.dialog.open(UnapprovedListsEditComponent, {
      data: {
        value: row.value,
        type: this.typeFilter,
        count: row.count,
        selectedProperties: row.selectedProperties,
        newValue,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index: number = this.viewModel.findIndex(d => d === row);
        this.viewModel.splice(index, 1);
        this.dataSource.data = this.viewModel;
      }
    });
  }

  getPotentialMatches(value: string) {
    const matches: string[] = [];

    let lettersMatches: number;
    let bestMatch: number = 0;
    let bestMatchIndex: number = -1;
    this.approvedItems.forEach((item: IApprovedListItemRead, i: number) => {
      lettersMatches = this.lettersMatch(item.value, value);

      if (lettersMatches > bestMatch) {
        bestMatch = lettersMatches;
        bestMatchIndex = i;
      }
    });

    if (bestMatchIndex >= 0) {
      matches.push(this.approvedItems[bestMatchIndex].value);
      for (let i = 1; i <= 5; i++) {
        if (bestMatchIndex + i < this.approvedItems.length && this.lettersMatch(this.approvedItems[bestMatchIndex + i].value, value) && matches.length < 5) {
          matches.push(this.approvedItems[bestMatchIndex + i].value);
        }
        if (bestMatchIndex - i > 0 && this.lettersMatch(this.approvedItems[bestMatchIndex - i].value, value) && matches.length < 5) {
          matches.push(this.approvedItems[bestMatchIndex - i].value);
        }
      }
    }

    matches.sort((a, b) => -b.toLowerCase().localeCompare(a.toLowerCase()))
    return matches;
  }

  lettersMatch(value1: string, value2: string): number {
    let matches: number;

    for (matches = 0; matches < value2.length; matches++) {
      if (value1.length <= matches || value1[matches].toLowerCase() !== value2[matches].toLowerCase()) {
        break;
      }
    }

    return matches;
  }
}
