import {Component, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatSort} from '@angular/material';
import { FormControl } from '@angular/forms';
import {MatTableDataSource} from '@angular/material/table';
import {ApprovedListsService, PerformanceService} from "../../../core/services";
import {APPROVED_LIST_TYPE, APPROVED_LIST_LABELS, IApprovedListItemRead} from "../../../core/models/approvedLists";

export interface IApprovedListItemReadExample {
  value: string;
  type: APPROVED_LIST_TYPE;
  searchable: number;
  symbol: string;
}

const ELEMENT_DATA: IApprovedListItemReadExample[] = [
  { type: APPROVED_LIST_TYPE.OWNER, value: 'Hydrogen', searchable: 1.0079, symbol: 'H' },
  { type: APPROVED_LIST_TYPE.OWNER, value: 'Helium', searchable: 4.0026, symbol: 'He' },
  { type: APPROVED_LIST_TYPE.MANAGER, value: 'Lithium', searchable: 6.941, symbol: 'Li' },
  { type: APPROVED_LIST_TYPE.OWNER, value: 'Beryllium', searchable: 9.0122, symbol: 'Be' },
  { type: APPROVED_LIST_TYPE.FEES, value: 'Boron', searchable: 10.811, symbol: 'B' },
  { type: APPROVED_LIST_TYPE.MANAGER, value: 'Carbon', searchable: 12.0107, symbol: 'C' },
  { type: APPROVED_LIST_TYPE.FEES, value: 'Nitrogen', searchable: 14.0067, symbol: 'N' },
  { type: APPROVED_LIST_TYPE.OWNER, value: 'Oxygen', searchable: 15.9994, symbol: 'O' },
  { type: APPROVED_LIST_TYPE.MANAGER, value: 'Fluorine', searchable: 18.9984, symbol: 'F' },
  { type: APPROVED_LIST_TYPE.FEES, value: 'Neon', searchable: 20.1797, symbol: 'Ne' },
  { type: APPROVED_LIST_TYPE.OWNER, value: 'Helium', searchable: 4.0026, symbol: 'He' },
  { type: APPROVED_LIST_TYPE.MANAGER, value: 'Lithium', searchable: 6.941, symbol: 'Li' },
  { type: APPROVED_LIST_TYPE.OWNER, value: 'Beryllium', searchable: 9.0122, symbol: 'Be' },
  { type: APPROVED_LIST_TYPE.FEES, value: 'Boron', searchable: 10.811, symbol: 'B' },
  { type: APPROVED_LIST_TYPE.MANAGER, value: 'Carbon', searchable: 12.0107, symbol: 'C' },
  { type: APPROVED_LIST_TYPE.FEES, value: 'Nitrogen', searchable: 14.0067, symbol: 'N' },
  { type: APPROVED_LIST_TYPE.OWNER, value: 'Oxygen', searchable: 15.9994, symbol: 'O' },
  { type: APPROVED_LIST_TYPE.MANAGER, value: 'Fluorine', searchable: 18.9984, symbol: 'F' },
  { type: APPROVED_LIST_TYPE.FEES, value: 'Neon', searchable: 20.1797, symbol: 'Ne' },
];

@Component({
  selector: 'app-approved-lists',
  templateUrl: './approved-lists.component.html',
  styleUrls: ['./approved-lists.component.scss']
})

export class ApprovedListsComponent implements OnInit {

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  typeFilter = new FormControl();
  valueFilter = new FormControl();
  fields: any;

  filteredValues = {
    type: '',
    value: ''
  };

  displayedColumns: string[] = ['value', 'type', 'searchable', 'delete'];

  dataSource: MatTableDataSource<IApprovedListItemRead>;

  constructor(private approvedListsService: ApprovedListsService,
              private performanceService: PerformanceService) {
  }

  customFilterPredicate() {
    const myFilterPredicate = (data: IApprovedListItemRead, filter: string): boolean => {
      let searchString = JSON.parse(filter);
      return data.type.toString().trim().indexOf(searchString.type) !== -1 &&
        data.value.toString().trim().toLowerCase().indexOf(searchString.value.toLowerCase()) !== -1;
    }

    return myFilterPredicate;
  }

  takeToFirstPage() {
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async ngOnInit() {
    this.performanceService.start();
    this.fields = APPROVED_LIST_LABELS;

    this.dataSource = new MatTableDataSource();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.typeFilter.valueChanges.subscribe((typeFilterValue) => {
      this.filteredValues['type'] = typeFilterValue;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.valueFilter.valueChanges.subscribe((valueFilterValue) => {
      this.filteredValues['value'] = valueFilterValue;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.dataSource.filterPredicate = this.customFilterPredicate();

    const approvedLists: IApprovedListItemRead[] = await this.approvedListsService.searchApproved({
      limit: 10000,
      type: APPROVED_LIST_TYPE.OWNER,
      searchableOnly: false
    });

    this.dataSource.data = approvedLists;

    this.performanceService.fireGoogleAnalytics('Approved Lists');
  }

}
