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

  constructor(private service: BackendDataService) {}

  ngOnInit(): void {
    this.fetchFeedsData();
    this.getValuesForRYCFromApi('ANZ', 'Altona', 2005);
    this.preparechart();
  }

  ngAfterViewInit() {}

  // fetch data
  async fetchFeedsData() {
    await this.service.getfetchData().subscribe((data: any) => {
      this.data = data.data;
      this.extractAllRegions();
      this.updateAvailableData();
      this.preparechart();
    });
  }

  extractAllRegions() {
    this.allRegions = this.data.map((obj: any) => {
      return obj.region;
    });
    console.log('allRegions', this.allRegions);
  }

  updateAvailableData() {
    this.selectedObject = this.data.filter(
      (i: any) => i.region == this.selectedRegion
    );

    this.availableCitiesForSelectedRegion = this.selectedObject[0].cities.map(
      (obj: any) => {
        return obj.city;
      }
    );

    this.updateAvailableYears();
  }

  updateAvailableYears() {
    this.availableYears = this.selectedObject[0].cities.filter((obj: any) => {
      return obj.city == this.selectedCity;
    })[0].years;
    this.selectedYear = this.availableYears[0];
  }

  onRegionChangeHandler(e: any) {
    this.selectedRegion = e.target.value;
    this.updateAvailableData();
    this.preparechart();
  }

  onCityChangeHandler(e: any) {
    this.selectedCity = e.target.value;
    this.updateAvailableData();
    this.preparechart();
  }

  onYearChangeHandler(e: any) {
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

        Object.keys(this.finalValues).forEach((key: any) => {
          this.finalValues2.push({
            country: key,
            value: this.finalValues[key],
          });
        });
      });
  }

  preparechart() {
    let divId = 'chartdiv';
    am5.array.each(am5.registry.rootElements, function (root) {
      if (root.dom.id == divId) {
        root.dispose();
      }
    });
    var root = am5.Root.new('chartdiv');

    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        pinchZoomX: true,
      })
    );

    var cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}));
    cursor.lineY.set('visible', true);

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

    let data = this.finalValues2;

    xAxis.data.setAll(data);
    series.data.setAll(data);

    series.appear(1000);
    chart.appear(1000, 100);
  }
}
