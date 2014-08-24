'use strict';

/**
 * @ngdoc directive
 * @description
 * # groupedBarChart
 * tipHeight - offset from top for chart, to show tooltip inside chart area
 * tipClass - css class of tooltip box
 * titleTipClass - css class of tooltip text
 * barColors - array of colors for bars (will be iterated)
 * splitPairs - if we should split pairs of bars (by space) when each point have more than 2 values (true by default)
 * trendLines - if we should draw trend lines (for paired values, all second values will be concatenated by trend line), false by default
 * trPointRadius - trend line point radius
 * tpClass - trend line point css class
 * tlClass - trend line css class
 * axisOffsetX, Y - offsets for X and Y axis
 * labelFormatter - function will be called on tooltip rendering (on mouseover) and should return text (html) for label.
 *  otherwise, label will be compiled from fields 'label' and 'value' (if field 'label' is defined)
 *  as 'label: value', or just from given value, if 'label' is not declared.
 * ngModel - data for chart. Should be in format:
 *  {
 *    values:[
 *        points: [
 *            labels: [
 *                'Locke',
 *                'Reyes',
 *                'Ford',
 *                'Jarrah',
 *                'Shephard',
 *                'Kwon'
 *              ]
 *            values: [
 *                4,
 *                8,
 *                15,
 *                16,
 *                23,
 *                42
 *              ]
 *          ]
 *        title: 'Title of each point, will be on x axis'
 *      ]
 *    yAxisTitle: 'y axis'
 *  }
 */
angular.module('oz.groupedBarChart', [])
  .directive('ozGroupedBarChart', function (D3ChartSizer, ColorIterator) {
    var sizer = new D3ChartSizer();

    function draw(svg, data, width, height, tipHeight, tipClass, tipTitleClass, colorGenerator, labelFormatter, splitPairs, trendLines, trendPointRadius, tlClass, tpClass, xAxisOffset, yAxisOffset) {
      svg.selectAll('g').remove();
      var margin = {top: parseInt(tipHeight), right: 1, bottom: 0, left: 0, yAxisOffset: 0, yAxisWidth: 0, xAxisOffset: 0};
      if (data.yAxisTitle) {
        margin.yAxisOffset = parseInt(yAxisOffset) || 20;
        margin.yAxisWidth = 10;
      }
      var xAxisTitles = _.pluck(data.values, 'title');
      if (xAxisTitles) {
        margin.xAxisOffset = parseInt(xAxisOffset) || 20;
      }
      var chart = svg
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + parseInt(margin.left + margin.yAxisOffset + margin.yAxisWidth) + ',' + parseInt(margin.top) + ')');
      width = parseInt(width) - margin.left - margin.right - margin.yAxisOffset - margin.yAxisWidth;
      height = height - margin.top - margin.bottom - margin.xAxisOffset;

      var points = _.pluck(data.values, 'points');
      var values = _.flatten(_.flatten(points), 'values');
      var y = d3.scale.linear().range([height, 0]).domain([0, d3.max(values)]);

      var betweenPeriodsWidth = (width/data.values.length)*0.1;
      var betweenPointsWidth = (width/points.length)*0.05;
      if (!splitPairs) {
        betweenPointsWidth = 0;
      }
      var barWidth = (width - betweenPeriodsWidth*data.values.length - betweenPointsWidth*points.length)/values.length;
      var nextPointOffset = betweenPeriodsWidth/2;

      var tip = d3.tip()
        .attr('class', tipClass)
        .offset([-10, 0])
        .html(function (d) {
          var label;
          if (angular.isFunction(labelFormatter)) {
            label = labelFormatter(d);
          }
          if (label === undefined) {
            if (d.label) {
              label = d.label + ': ' + d.value;
            }
            else {
              label = d.value;
            }
          }
          if (label === undefined) {
            label = d;
          }
          return '<span class="' + tipTitleClass + '">' + label + '</span>';
        });
      svg.call(tip);

      var x0 = d3.scale.ordinal().rangeRoundBands([0, width], 0.1);
      var x1 = d3.scale.ordinal();
      x0.domain(_.map(data.values, function (d) {return d.title; }));
      x1.domain(points).rangeRoundBands([0, x0.rangeBand()]);

      if (xAxisTitles) {
        var xAxis = d3.svg.axis()
          .scale(x0)
          .orient("bottom");
        svg.append("g")
          .attr("class", "x axis")
          .attr('transform', 'translate(' + parseInt(margin.yAxisOffset + margin.yAxisWidth) + ',' + parseInt(height + margin.top + 2) + ')')
          .call(xAxis);
      }
      if (data.yAxisTitle) {
        var yAxis = d3.svg.axis()
          .scale(y)
          .orient('left')
          .ticks(5, '');

        svg.append('g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + parseInt(margin.yAxisOffset) + ',' + margin.top + ')')
          .call(yAxis)
          .append('text')
          .attr('transform', 'rotate(-90)')
          .attr('y', 5)
          .attr('dy', '.71em')
          .style('text-anchor', 'end')
          .text(data.yAxisTitle);
      }

      var bar = chart.selectAll('g')
        .data(data.values)
        .enter().append('g')
        .attr('transform', function (d, i) {
          var l = d.points.length;
          if (l < 1) {
            l = 1;
          }
          var offset = i*betweenPeriodsWidth/2 + (i/l)*betweenPointsWidth/(l*2);
          if (i === 0) {
            offset = betweenPeriodsWidth/2;
          }
          return 'translate(' + offset + ',0)';
        });

      var pointsArea = bar.selectAll('g')
        .data(function (d) {
          return d.points;
        })
        .enter()
        .append('g')
        .attr('transform', function (d, i) {
          var offset = nextPointOffset;
          if (i === 0) {
            offset += betweenPointsWidth/2;
          }
          nextPointOffset = offset + d.values.length*barWidth + (betweenPointsWidth/d.values.length);
          return 'translate(' + offset + ',0)';
        });
      var rectangles = pointsArea.selectAll('g')
        .data(function (d) {
          var linkedValues = [];
          angular.forEach(d.values, function (v, i) {
            var item = {value: v, parent: d};
            if (angular.isArray(d.labels)) {
              item.label = d.labels[i];
            }
            linkedValues.push(item);
          });
          return linkedValues;
        })
        .enter()
        .append('rect')
        .attr('y', function (d) {
          if (d.value === undefined) {
            d.value = 0;
          }
          return y(d.value);
        })
        .attr('height', function (d) { return height - y(d.value); })
        .attr('x', function (d, i) {
          return i*(barWidth);
        })
        .attr('width', barWidth - 1)
        .style('fill', function () {
          return colorGenerator.getColor();
        });

      if (trendLines) {
        var linePoints = [];
        _.forEach(data.values, function (period) {
          var i = linePoints.length;
          if (period.points[0].values[1] === undefined) {
            period.points[0].values[1] = 0;
          }
          linePoints.push({
            x: (i*2)*barWidth + barWidth/2 + barWidth/4 + barWidth + (i*betweenPeriodsWidth) + (i - 1)*betweenPointsWidth/2,
            y: period.points[0].values[1],
            c: period.title
          });
        });

        var line = d3.svg.line()
          .interpolate('cardinal')
          .x(function (d) { return d.x; })
          .y(function (d) { return y(d.y); });

        chart.append("path")
          .datum(linePoints)
          .attr('class', tlClass)
          .attr('d', line);

        if (trendPointRadius) {
          chart.selectAll('.' + tpClass)
            .data(linePoints)
            .enter()
            .append('circle')
            .attr('transform', function (d, i) {
              return 'translate(' + linePoints[i].x + ',' + y(linePoints[i].y) + ')';
            })
            .attr('r', trendPointRadius)
            .attr('class', tpClass);
        }
      }
      rectangles
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
      return true;
    }

    function setDefaults(attrs) {
      attrs.width = attrs.width || '100%';
      attrs.trPointRadius = attrs.trPointRadius || '3';
      attrs.tlClass = attrs.tlClass || 'trend-line';
      attrs.tpClass = attrs.tpClass || 'trend-point';
      attrs.splitPairs = attrs.splitPairs || 'true';
      if (attrs.splitPairs === 'false') {
        attrs.splitPairs = null;
      }
      attrs.tipHeight = attrs.tipHeight || '10';
    }

    return {
      restrict: 'E',
      scope:    {
        ngModel:        '=',
        tipHeight:      '@',
        tipClass:       '@',
        titleTipClass:  '@',
        barColors:      '=',
        splitPairs:     '@',
        trendLines:     '@',
        trPointRadius:  '@',
        tpClass:        '@',
        tlClass:        '@',
        labelFormatter: '&',
        axisOffsetX:    '@',
        axisOffsetY:    '@'
      },
      compile:  function (el, attrs) {
        if (attrs.tipClass) {
          $('.' + attrs.tipClass).remove();
        }
        setDefaults(attrs);
        return {
          post: function (scope, element) {
            var cGen = new ColorIterator();
            if (scope.barColors) {
              cGen.setColors(scope.barColors);
            }
            var svg = d3.select(angular.element(element)[0]).append('svg');

            function redraw() {
              scope.height = false;
              scope.width = false;
              sizer.setSizes(scope, element.parent());
              draw(svg, scope.ngModel, scope.width, scope.height, scope.tipHeight, scope.tipClass, scope.titleTipClass, cGen, scope.labelFormatter, scope.splitPairs, scope.trendLines, scope.trPointRadius, scope.tlClass, scope.tpClass, scope.axisOffsetX, scope.axisOffsetY);
            }

            scope.$watch('ngModel', function () {
              if (scope.ngModel !== undefined) {
                redraw();
              }
            }, true);

            if (!scope.resizeWatching) {
              scope.resizeWatching = true;
              $(window).resize(function () {
                redraw();
              });
            }
          }
        };
      }
    };
  });
