import { Component } from '@angular/core';
import { NgControl } from '@angular/forms';
import { BackendDataService } from 'src/app/backend-data.service';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css'],
})
export class InputComponent {
  data: any = [];
  allRegions: string[] = [];
  availableCitiesForSelectedRegion: string[] = [];
  availableYears: any = [];

  selectedRegion: string = 'ANZ';
  selectedCity: string = 'Altona';
  selectedYear: number = 2005;

  selectedObject: any;

  finalValues: any;
  finalValues2: any = [];
  graphValues: any;

  constructor(private service: BackendDataService) {}

  ngOnInit(): void {
    this.fetchFeedsData();
    this.getValuesForRYCFromApi('ANZ', 'Altona', 2005);
  }

  ngAfterViewInit() {
    this.preparechart();
  }

  // fetch data
  async fetchFeedsData() {
    await this.service.getfetchData().subscribe((data: any) => {
      this.data = data.data;
      // console.log("data", this.data);
      this.extractAllRegions();
      this.updateAvailableData();
    });
  }

  extractAllRegions() {
    // extractiong all regions
    console.log('Inside extract data');
    console.log('Data', this.data);
    this.allRegions = this.data.map((obj: any) => {
      return obj.region;
    });
    console.log('allRegions', this.allRegions);
  }

  // call only this function on any changes in filtered data
  updateAvailableData() {
    // extractiong the object whose region is selected
    this.selectedObject = this.data.filter(
      (i: any) => i.region == this.selectedRegion
    );
    console.log('selectedObject :', this.selectedObject);

    //update available cities
    this.availableCitiesForSelectedRegion = this.selectedObject[0].cities.map(
      (obj: any) => {
        return obj.city;
      }
    );
    console.log(
      'availableCitiesForSelectedRegion: ',
      this.availableCitiesForSelectedRegion
    );

    this.updateAvailableYears();
  }

  updateAvailableYears() {
    // update available years
    this.availableYears = this.selectedObject[0].cities.filter((obj: any) => {
      return obj.city == this.selectedCity;
    })[0].years;
    // this.availableYears = this.availableYears[0];
    console.log('availableYears: ', this.availableYears);
  }

  onRegionChangeHandler(e: any) {
    this.selectedRegion = e.target.value;
    console.log('selectedRegion:', this.selectedRegion);
    this.updateAvailableData();
    this.preparechart();
  }

  onCityChangeHandler(e: any) {
    // console.log(e.target);
    this.selectedCity = e.target.value;
    console.log('selectedCity: ', this.selectedCity);
    this.updateAvailableData();
    this.preparechart();
  }

  onYearChangeHandler(e: any) {
    console.log('Year:', e.target.value);
    this.selectedYear = e.target.value;
    this.preparechart();
  }

  async getValuesForRYCFromApi(region: any, city: any, year: any) {
    await this.service
      .getValuesForRCY(region, city, year)
      .subscribe((values: any) => {
        console.log('values', values);
        this.finalValues = values.data[0];

        delete this.finalValues.Year;
        delete this.finalValues.City;
        delete this.finalValues.Region;

        console.log('finalValues 1: ', this.finalValues);
        Object.keys(this.finalValues).forEach((key: any) => {
          this.finalValues2.push({
            country: key,
            value: this.finalValues[key],
          });
        });
        console.log('finalValues 2: ', this.finalValues2);
      });
  }

  changeFinalDataFormat(fd: any) {
    return Object.entries(fd).map(([country, value]) => ({
      country,
      value,
    }));
  }

  preparechart() {
    let divId = 'chartdiv';
    am5.array.each(am5.registry.rootElements, function (root) {
      if (root.dom.id == divId) {
        root.dispose();
      }
    });
    var root = am5.Root.new('chartdiv');

    // Set themes
    // https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart
    // https://www.amcharts.com/docs/v5/charts/xy-chart/
    var chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true,
      })
    );

    // Add cursor
    // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
    var cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}));
    cursor.lineY.set('visible', true);

    // Create axes
    // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
    var xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 30 });
    xRenderer.labels.template.setAll({
      rotation: -90,
      centerY: am5.p50,
      centerX: am5.p100,
      paddingRight: 15,
    });

    xRenderer.grid.template.setAll({
      location: 1,
    });

    var xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0.3,
        categoryField: 'country',
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    var yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0.3,
        renderer: am5xy.AxisRendererY.new(root, {
          strokeOpacity: 0.1,
        }),
      })
    );

    // Create series
    // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
    var series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Series 1',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'value',
        sequencedInterpolation: true,
        categoryXField: 'country',
        tooltip: am5.Tooltip.new(root, {
          labelText: '{valueY}',
        }),
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 5,
      cornerRadiusTR: 5,
      strokeOpacity: 0,
    });

    // Set data
    // var data = [
    //   {
    //     country: 'Cap',
    //     value: 2025,
    //   },
    //   {
    //     country: 'China',
    //     value: 1882,
    //   },
    //   {
    //     country: 'Japan',
    //     value: 1809,
    //   },
    //   {
    //     country: 'Germany',
    //     value: 1322,
    //   },
    //   {
    //     country: 'UK',
    //     value: 1122,
    //   },
    //   {
    //     country: 'France',
    //     value: 1114,
    //   },
    //   {
    //     country: 'India',
    //     value: 984,
    //   },
    //   {
    //     country: 'Spain',
    //     value: 711,
    //   },
    //   {
    //     country: 'Netherlands',
    //     value: 665,
    //   },
    //   {
    //     country: 'South Korea',
    //     value: 443,
    //   },
    //   {
    //     country: 'Canada',
    //     value: 441,
    //   },
    // ];

    let data = this.finalValues2;

    // let data = this.finalValues;

    xAxis.data.setAll(data);
    series.data.setAll(data);

    // Make stuff animate on load
    // https://www.amcharts.com/docs/v5/concepts/animations/
    series.appear(1000);
    chart.appear(1000, 100);
  }
}
