// Copyright (C) 2014  Etienne Ramstein

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>

var scatterplot = {

    //chart objects
    xAxis:null, xaLineQ:null, xaLineMed:null, xaLineMin:null, xaTextQ1:null, xaTextQ3:null, xaTextMed:null, xaTextMin:null, xaTextMax:null,
    yAxis:null, yaLineQ:null, yaLineMed:null, yaLineMin:null, yaTextQ1:null, yaTextQ3:null, yaTextMed:null, yaTextMin:null, yaTextMax:null,
    xAxisLabel:null, yAxisLabel:null, xaGlobalMax: null, yaGlobalMax: null, sGlobalMax: null, sGlobalMax: null,
    grayRectXQ:null, grayRectXM:null, grayRectYQ:null, grayRectYM:null,
    vertices:null, paths:null, clips:null,
    x:null, y:null,

    build: function() {
        this.x = d3.scale.linear()
            .range([0, width]);

        this.y = d3.scale.linear()
            .range([height, 0]);

        // draw axis
        this.xAxis = svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")");
        this.xAxisLabel = this.xAxis.append("text")
          .attr("class", "dimensionLabel")
          .attr("x", width)
          .attr("y", -6)
          .style("text-anchor", "end");
        this.xaLineMin = this.xAxis.append("line")
          .attr("y1", 0)
          .attr("y2", 0);
        this.xaTextMin = this.xAxis.append("text")
          .attr("class", "axisValue")
          .attr("y", 17)
          .style("text-anchor", "middle");
        this.xaTextMax = this.xAxis.append("text")
          .attr("class", "axisValue")
          .attr("y", 17)
          .style("text-anchor", "middle");
        this.xaLineQ = this.xAxis.append("line")
          .attr("y1", 0.5)
          .attr("y2", 0.5)
          .style("stroke-width", 3);
        this.xaTextQ1 = this.xAxis.append("text")
          .attr("class", "axisValue")
          .attr("y", 17)
          .style("text-anchor", "middle");
        this.xaTextQ3 = this.xAxis.append("text")
          .attr("class", "axisValue")
          .attr("y", 17)
          .style("text-anchor", "middle");
        this.xaLineMed = this.xAxis.append("line")
          .attr("y1", 0.5)
          .attr("y2", 0.5)
          .style("stroke", "#fff")
          .style("stroke-width", 3);
        this.xaTextMed = this.xAxis.append("text")
          .attr("class", "axisValue")
          .attr("y", 17)
          .style("text-anchor", "middle");

        this.yAxis = svg.append("g")
            .attr("class", "y axis");
        this.yAxisLabel = this.yAxis.append("text")
          .attr("class", "dimensionLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 16)
          .style("text-anchor", "end");
        this.yaLineMin = this.yAxis.append("line")
          .attr("x1", 0)
          .attr("x2", 0);
        this.yaTextMin = this.yAxis.append("text")
          .attr("class", "axisValue")
          .attr("x", -6)
          .style("text-anchor", "end");
        this.yaTextMax = this.yAxis.append("text")
          .attr("class", "axisValue")
          .attr("x", -6)
          .style("text-anchor", "end");
        this.yaLineQ = this.yAxis.append("line")
          .attr("x1", 0.5)
          .attr("x2", 0.5)
          .style("stroke-width", 3);
        this.yaTextQ1 = this.yAxis.append("text")
          .attr("class", "axisValue")
          .attr("x", -6)
          .style("text-anchor", "end");
        this.yaTextQ3 = this.yAxis.append("text")
          .attr("class", "axisValue")
          .attr("x", -6)
          .style("text-anchor", "end");
        this.yaLineMed = this.yAxis.append("line")
          .attr("x1", 0.5)
          .attr("x2", 0.5)
          .style("stroke", "#fff")
          .style("stroke-width", 3);
        this.yaTextMed = this.yAxis.append("text")
          .attr("class", "axisValue")
          .attr("x", -6)
          .style("text-anchor", "end");

        // gray zones
        this.grayRectXQ = svg.append("rect")
          .attr("y", -1)
          .attr("height", height)
          .style("fill", "#e1e1e1")
          .style("fill-opacity", 0.3);
        this.grayRectXM = svg.append("rect")
          .attr("y", -1)
          .attr("height", height)
          .style("fill", "#e1e1e1")
          .style("fill-opacity", 0.3);
        this.grayRectYQ = svg.append("rect")
          .attr("x", 2)
          .attr("width", width)
          .style("fill", "#e1e1e1")
          .style("fill-opacity", 0.3);
        this.grayRectYM = svg.append("rect")
          .attr("id", "lastGrayArea")
          .attr("x", 2)
          .attr("width", width)
          .style("fill", "#e1e1e1")
          .style("fill-opacity", 0.3);

        // voronoi overlay
        this.clips = svg.append("svg:g").attr("id", "point-clips");
        this.paths = svg.append("svg:g").attr("id", "point-paths");

        //once built, update to trigger come into play events
        this.update();

    },

    update: function(resetAxis) {
        var _this = this;

        // prepare data for the axis
        var xData = chartData.map(function(d) { return eval("d."+dimensions[0].code); });
        var yData = chartData.map(function(d) { return eval("d."+dimensions[1].code); });
        var xDataAll = chartDataAll.map(function(d) { return eval("d."+dimensions[0].code); });
        var yDataAll = chartDataAll.map(function(d) { return eval("d."+dimensions[1].code); });
        var xMed, yMed, xMin, yMin, xMax, yMax, xQ1, yQ1, xQ3, yQ3;

        xData.sort(d3.ascending);
        yData.sort(d3.ascending);
        xDataAll.sort(d3.ascending);
        yDataAll.sort(d3.ascending);

        xMin = d3.min(xData);
        yMin = d3.min(yData);
        xMax = d3.max(xData);
        yMax = d3.max(yData);
        xMed = d3.median(xData);
        yMed = d3.median(yData);
        xQ1 = d3.quantile(xData, 0.25);
        yQ1 = d3.quantile(yData, 0.25);
        xQ3 = d3.quantile(xData, 0.75);
        yQ3 = d3.quantile(yData, 0.75);

        // axis scale domain. always use full dataset, to maintain the axis stable
        this.xaGlobalMax = d3.max(xDataAll);
        this.yaGlobalMax = d3.max(yDataAll);

        this.x.domain([0,this.xaGlobalMax]);
        this.y.domain([0,this.yaGlobalMax]);

        //calc text labels y positions (avoid overlaps)
        var yMaxText = this.y(yMax);
        var yQ3Text = shiftText(this.y(yQ3), yMaxText);
        var yMedText = shiftText(this.y(yMed), yQ3Text);
        var yQ1Text = shiftText(this.y(yQ1), yMedText);
        var yMinText = shiftText(this.y(yMin), yQ1Text);

        //update axis
        this.xAxisLabel
            .text(dimensions[0].label);
        this.xaLineMin
          .transition().duration(transitionTime)
          .attr("x1", this.x(xMin))
          .attr("x2", this.x(xMax));
        this.xaTextMin
          .transition().duration(transitionTime)
          .attr("x", this.x(xMin))
          .text(formatNum(xMin));
        this.xaTextMax
          .transition().duration(transitionTime)
          .attr("x", this.x(xMax))
          .text(formatNum(xMax));
        this.xaLineQ
          .transition().duration(transitionTime)
          .attr("x1", this.x(xQ1))
          .attr("x2", this.x(xQ3));
        this.xaTextQ1
          .transition().duration(transitionTime)
          .attr("x", this.x(xQ1))
          .text(formatNum(xQ1));
        this.xaTextQ3
          .transition().duration(transitionTime)
          .attr("x", this.x(xQ3))
          .text(formatNum(xQ3));
        this.xaLineMed
          .transition().duration(transitionTime)
          .attr("x1", this.x(xMed)-1.5)
          .attr("x2", this.x(xMed)+1.5);
        this.xaTextMed
          .transition().duration(transitionTime)
          .attr("x", this.x(xMed))
          .text(formatNum(xMed));

        this.yAxisLabel
          .text(dimensions[1].label)
        this.yaLineMin
          .transition().duration(transitionTime)
          .attr("y1", this.y(yMin))
          .attr("y2", this.y(yMax));
        this.yaTextMin
          .transition().duration(transitionTime)
          .attr("y", yMinText)
          .text(formatNum(yMin));
        this.yaTextMax
          .transition().duration(transitionTime)
          .attr("y", yMaxText)
          .text(formatNum(yMax));
        this.yaLineQ
          .transition().duration(transitionTime)
          .attr("y1", this.y(yQ1))
          .attr("y2", this.y(yQ3));
        this.yaTextQ1
          .transition().duration(transitionTime)
          .attr("y", yQ1Text)
          .text(formatNum(yQ1));
        this.yaTextQ3
          .transition().duration(transitionTime)
          .attr("y", yQ3Text)
          .text(formatNum(yQ3));
        this.yaLineMed
          .transition().duration(transitionTime)
          .attr("y1", this.y(yMed)-1.5)
          .attr("y2", this.y(yMed)+1.5);
        this.yaTextMed
          .transition().duration(transitionTime)
          .attr("y",yMedText)
          .text(formatNum(yMed));

        //update gray rectangles
        this.grayRectXQ
          .transition().duration(transitionTime)
          .attr("x", this.x(xQ1)+0.5)
          .attr("width", this.x(xMed - xQ1)-1);
        this.grayRectXM
          .transition().duration(transitionTime)
          .attr("x", this.x(xMed)+1.5)
          .attr("width", this.x(xQ3 - xMed)-1.5);
        this.grayRectYQ
          .transition().duration(transitionTime)
          .attr("y",  this.y(yQ3))
          .attr("height", this.y(yMed) - this.y(yQ3) -1.5);
        this.grayRectYM
          .transition().duration(transitionTime)
          .attr("y",  this.y(yMed) + 1)
          .attr("height", this.y(yQ1) - this.y(yMed) - 1.5);

        // redraw bubles to put them on top
        $('#bubles').insertAfter('#lastGrayArea');
        // position, size and color bubles
        bubles.selectAll(".buble")
          .data(chartData, function(d) {return "buble" + d.k; })
          .transition().duration(transitionTime)
              .attr("cx", function(d) { return _this.x(eval("d."+dimensions[0].code)); })
              .attr("cy", function(d) { return _this.y(eval("d."+dimensions[1].code)); })
              .attr("r", sizeBubles)
              .style("fill", colorBubles);

        // voronoi overlay for mouse over
        this.vertices = chartData.map(function(d) { return [_this.x(eval("d."+dimensions[0].code)), _this.y(eval("d."+dimensions[1].code)), d.k]; });
        this.buildOverlay();

    },

    buildOverlay: function() {
          var _this = this;

          _this.clips.selectAll("clipPath").remove();
          _this.clips.selectAll("clipPath")
              .data(_this.vertices)
            .enter().append("svg:clipPath")
              .attr("id", function(d, i) { return "clip-"+i;})
            .append("svg:circle")
              .attr('cx', function(d) { return d[0]; })
              .attr('cy', function(d) { return d[1]; })
              .attr('r', 30);

          _this.paths.selectAll("path").remove();
          _this.paths.selectAll("path")
              .data(d3.geom.voronoi(_this.vertices))
            .enter().append("svg:path")
              .attr("d", function(d) { return "M" + d.join(",") + "Z"; })
              .attr("id", function(d,i) {
                return "path-"+i; })
              .attr("clip-path", function(d,i) { return "url(#clip-"+i+")"; })
              .style('fill-opacity', 0);

          _this.paths.selectAll("path")
            .on("mouseover", function(d, i) {
              svg.select('circle#buble-'+_this.vertices[i][2])
                .style('stroke-width', 2);
              buildTooltip('#buble-'+_this.vertices[i][2]);
            })
            .on("mouseout", function(d, i) {
              svg.select('circle#buble-'+_this.vertices[i][2])
                .style('stroke-width', 0.5);
              $("#tooltip").hide();
            })
            .on("click", function(d, i) {
              theCircle = $(svg.select('circle#buble-'+_this.vertices[i][2])[0][0]);
              if($(theCircle).attr('class')=="buble"){
                $(theCircle).attr('class','buble selected');
              }else {
                $(theCircle).attr('class','buble');
              }
            });
    },

    clear: function() {
      this.xAxis.remove();
      this.yAxis.remove();
      this.grayRectXQ.remove();
      this.grayRectXM.remove();
      this.grayRectYQ.remove();
      this.grayRectYM.remove();
      this.clips.remove();
      this.paths.remove();
      this.xaGlobalMax = null;
      this.yaGlobalMax = null;
    }

}