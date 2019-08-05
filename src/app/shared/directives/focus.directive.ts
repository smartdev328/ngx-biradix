import {Directive, Input, ElementRef, Inject, OnChanges} from '@angular/core';
@Directive({
  selector: '[focus]'
})
export class FocusDirective implements OnChanges{
  @Input() focus: boolean;
  constructor(@Inject(ElementRef) private element: ElementRef) {}
  public ngOnChanges() {
    if (this.focus) {
       this.element.nativeElement.focus();
    }
  }
}
