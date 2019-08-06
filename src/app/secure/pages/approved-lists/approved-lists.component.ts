import {Component, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatSort} from '@angular/material';
import {MatTableDataSource} from '@angular/material/table';
import {ApprovedListsService, PerformanceService} from "../../../core/services";
import {APPROVED_LIST_LABELS, IApprovedListItemRead} from "../../../core/models/approvedLists";

@Component({
  selector: 'app-approved-lists',
  templateUrl: './approved-lists.component.html',
  styleUrls: ['./approved-lists.component.scss']
})

export class ApprovedListsComponent implements OnInit {

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  filtered = {
    dropdown: 'OWNER',
    search: ''
  }
  
  fields: any;
  displayedColumns: string[] = ['value', 'type', 'searchable', 'delete'];

  dataSource: MatTableDataSource<IApprovedListItemRead>;

  constructor(private approvedListsService: ApprovedListsService,
              private performanceService: PerformanceService) {
  }

  async ngOnInit() {
    this.performanceService.start();

    this.dataSource = new MatTableDataSource();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.fields = APPROVED_LIST_LABELS;

    const approvedLists: IApprovedListItemRead[] = await this.approvedListsService.searchApproved({
      limit: 10000,
      type: this.filtered.dropdown,
      searchableOnly: false
    });

    this.dataSource.data = approvedLists;

    this.performanceService.fireGoogleAnalytics('Approved Lists');

  }

  filterApprovedSearch() {
    this.dataSource.filter = this.filtered.search.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filterApprovedDropdown() {
    this.dataSource.filter = this.filtered.dropdown;
    console.log(this.filtered.dropdown);
  }

}
