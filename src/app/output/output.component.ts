import { Component } from '@angular/core';
import { BackendDataService } from 'src/app/backend-data.service';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

@Component({
  selector: 'app-output',
  templateUrl: './output.component.html',
  styleUrls: ['./output.component.css'],
})
export class OutputComponent {
  globalCapacity: any;

  constructor(private service: BackendDataService) {}

  ngOnInit() {
    this.fetchModelDate();
  }

  async fetchModelDate() {
    await this.service.getModelData().subscribe((data: any) => {
      this.globalCapacity = data.global_cap;

      this.globalCapacity.sort(
        (a: any, b: any) =>
          a.Configuration.split('_')[1] - b.Configuration.split('_')[1]
      );

      // this.changeFinalDataFormat(this.globalCapacity)
      console.log('Global Capacity Sorted: ', this.globalCapacity);

      this.prepareChart();
    });
  }

  // changeFinalDataFormat(fd: any) {
  //   return Object.entries(fd).map(([year, value]) => ({
  //     year,
  //     value,
  //   }));
  // }

  prepareChart() {
    /* Chart code */
    // Create root element
    // https://www.amcharts.com/docs/v5/getting-started/#Root_element
    let root = am5.Root.new('chartdivOP');

    // Set themes
    // https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart
    // https://www.amcharts.com/docs/v5/charts/xy-chart/
    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: 'panX',
        wheelY: 'zoomX',
        scrollbarX: am5.Scrollbar.new(root, { orientation: 'horizontal' }),
        scrollbarY: am5.Scrollbar.new(root, { orientation: 'vertical' }),
        pinchZoomX: true,
      })
    );

    // Add cursor
    // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
    let cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}));
    cursor.lineY.set('visible', false);

    // Create axes
    // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
    let xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 15,
    });

    xRenderer.labels.template.setAll({
      rotation: -90,
      centerY: am5.p50,
      centerX: 0,
    });

    xRenderer.grid.template.setAll({
      visible: false,
    });

    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0.3,
        categoryField: 'Configuration',
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0.3,
        renderer: am5xy.AxisRendererY.new(root, {}),
      })
    );

    // Create series
    // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'CAP',
        categoryXField: 'Configuration',
        adjustBulletPosition: false,
        tooltip: am5.Tooltip.new(root, {
          labelText: '{valueY}',
        }),
      })
    );
    series.columns.template.setAll({
      width: 0.5,
    });

    series.bullets.push(function () {
      return am5.Bullet.new(root, {
        locationY: 1,
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: series.get('fill'),
        }),
      });
    });

    let data = this.globalCapacity;

    xAxis.data.setAll(data);
    series.data.setAll(data);

    // Make stuff animate on load
    // https://www.amcharts.com/docs/v5/concepts/animations/
    series.appear(1000);
    chart.appear(1000, 100);
  }
}
