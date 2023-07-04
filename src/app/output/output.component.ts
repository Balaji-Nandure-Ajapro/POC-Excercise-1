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
  compLimit: any;
  globalComposition: any;

  selectedConfiguration: any = 'Config_0';
  allConfigurations: any = [];
  selectedConfigurationData: any = [];
  selectedGlobalCompData: any = [];

  constructor(private service: BackendDataService) {}

  ngOnInit() {
    this.fetchModelDate();
  }

  sortConfigurationData(arr: any) {
    arr.sort(
      (a: any, b: any) =>
        a.Configuration.split('_')[1] - b.Configuration.split('_')[1]
    );
  }

  async fetchModelDate() {
    await this.service.getModelData().subscribe((data: any) => {
      this.globalCapacity = data.global_cap;
      this.compLimit = data.comp_limit;
      this.globalComposition = data.global_comp;

      this.sortConfigurationData(this.globalCapacity);
      this.sortConfigurationData(this.compLimit);
      this.sortConfigurationData(this.globalComposition);

      this.allConfigurations = Object.values(this.globalCapacity).map(
        (item: any) => item.Configuration
      );

      this.filterSelectedConfigurationData();
      this.prepareChart();
    });
  }

  filterSelectedConfigurationData() {
    this.selectedConfigurationData = this.compLimit.filter((obj: any) => {
      return obj.Configuration == this.selectedConfiguration;
    });

    this.selectedGlobalCompData = this.globalComposition.filter((obj: any) => {
      return obj.Configuration == this.selectedConfiguration;
    });

    this.combineCompAndLimitData();
  }

  combineCompAndLimitData() {
    for (let i = 0; i < this.selectedConfigurationData.length; i++) {
      const feed = this.selectedConfigurationData[i].Feed;
      const config = this.selectedConfigurationData[i].Configuration;
      const match = this.selectedGlobalCompData.find((obj: any) => {
        return obj.Configuration === config && obj.Feed === feed;
      });

      if (match) {
        this.selectedConfigurationData[i].Composition = match.Composition;
      }
    }
  }

  selectCongingChangeHandler(e: any) {
    this.selectedConfiguration = e.target.value;
    this.filterSelectedConfigurationData();
  }

  prepareChart() {
    let root = am5.Root.new('chartdivOP');

    root.setThemes([am5themes_Animated.new(root)]);

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

    let cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}));
    cursor.lineY.set('visible', false);

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

    series.appear(1000);
    chart.appear(1000, 100);
  }
}
