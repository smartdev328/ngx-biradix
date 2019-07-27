import { Injectable } from '@angular/core';

@Injectable()
export class PerformanceService {
  private timeStart: number = window.performance.now();
  private pageViewType = 'InitialPageView';

  public start() {
    // Do not restart time for initial page view
    if (this.pageViewType === 'InitialPageView') {
      return;
    }

    if (window.performance && window.performance.now) {
      this.timeStart = window.performance.now();
    }
  }

  public fireGoogleAnalytics(pageName: string) {
    if (window['ga'] && this.timeStart && window.performance && window.performance.now) {
      const pageTime = performance.now() - this.timeStart;

      const metrics = this.pageViewType === 'InitialPageView' && {
        'metric1': 1,
        'metric2': pageTime,
      } || {
        'metric3': 1,
        'metric4': pageTime,
      }

      window['ga']('send', 'event', this.pageViewType, 'Amenities', metrics);

      this.pageViewType = 'PageView';
    }
  }
}
