import {Component, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatSort} from '@angular/material';
import {MatTableDataSource} from '@angular/material/table';
import {ApprovedListsService, PerformanceService, SiteService} from "../../../core/services";
import {APPROVED_LIST_TYPE, APPROVED_LIST_LABELS, IApprovedListItemRead} from "../../../core/models/approvedLists";

@Component({
  selector: 'app-approved-lists',
  templateUrl: './approved-lists.component.html',
  styleUrls: ['./approved-lists.component.scss']
})

export class ApprovedListsComponent implements OnInit {

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  typeFilter: APPROVED_LIST_TYPE = APPROVED_LIST_TYPE.OWNER;
  valueFilter: string;
  fields: any;
  isIEorEdge: boolean = this.siteService.isIEorEdge();
  numberOfResults: number = -1;
  loading: boolean = true;

  displayedColumns: string[] = ['value', 'type', 'searchable', 'delete'];

  dataSource: MatTableDataSource<IApprovedListItemRead>;

  constructor(private approvedListsService: ApprovedListsService,
              private performanceService: PerformanceService,
              private siteService: SiteService) {
  }

  filterBySearch() {
    this.dataSource.filter = (this.valueFilter || "").trim().toLowerCase();
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
    this.dataSource.connect().subscribe(d => {
      this.numberOfResults = d.length;
    });

    await this.run();

    this.performanceService.fireGoogleAnalytics('Approved Lists');
  }

  async run() {
    this.loading = true;
    const approvedLists: IApprovedListItemRead[] = await this.approvedListsService.searchApproved({
      limit: 10000,
      type: this.typeFilter,
      searchableOnly: false
    });

    this.dataSource.data = approvedLists;
    this.filterBySearch();
    this.loading = false;
  }

}
