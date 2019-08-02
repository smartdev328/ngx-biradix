import { Component, OnInit, ViewChild } from '@angular/core';
import {MatPaginator, MatSort} from '@angular/material';
import {MatTableDataSource} from '@angular/material/table';

export interface UserData {
  id: number;
  value: string;
  field: string;
  autocomplete: boolean;
}

export interface Field {
  value: string;
}

const ELEMENT_DATA: UserData[] = [
  {id: 1,value: '1st Lake Properties', field: 'Property:Owner', autocomplete: true},
  {id: 2,value: '29th Street Capital', field: 'Property:Owner', autocomplete: true},
  {id: 3,value: '360 Residential', field: 'Property:Management', autocomplete: true},
  {id: 4,value: '4G Ventures', field: 'Property:Management', autocomplete: false},
  {id: 5,value: 'A&E Real Estate Holdings', field: 'Property:Owner', autocomplete: false},
  {id: 6,value: 'A.R. Building', field: 'Property:Owner', autocomplete: true},
  {id: 7,value: 'AAA Management', field: 'Property:Owner', autocomplete: true},
  {id: 8,value: 'AEW Capital Management', field: 'Property:Management', autocomplete: true},
  {id: 9,value: 'AHC', field: 'Property:Owner', autocomplete: true},
  {id: 10,value: 'AIG Global Real Estate', field: 'Property:Owner', autocomplete: true},
  {id: 11,value: 'AION Partners', field: 'Property:Owner', autocomplete: true},
  {id: 12,value: 'AMCAL Multi-Housing', field: 'Property:Owner', autocomplete: true},
  {id: 13,value: 'APM Management', field: 'Property:Management', autocomplete: true}
];

@Component({
  selector: 'app-approved-lists',
  templateUrl: './approved-lists.component.html',
  styleUrls: ['./approved-lists.component.scss']
})

export class ApprovedListsComponent implements OnInit {

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  fields: Field[] = [
    {value: 'Property:Owner'},
    {value: 'Property:Management'},
    {value: 'Custom Fees & Deposits'}
  ];

  displayedColumns: string[] = ['value', 'field', 'autocomplete', 'delete'];

  dataSource: MatTableDataSource<UserData>;

  constructor() {
    this.dataSource = new MatTableDataSource(ELEMENT_DATA);
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyField(fieldValue: string) {
    this.dataSource.filter = fieldValue;
  }

}