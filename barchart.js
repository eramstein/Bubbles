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

var barchart = {
	build: function() {

		this.yaGlobalMax = null;
		this.yDim = null;
        this.y = d3.scale.linear()
            .range([height, 0]);

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

        this.update();

    },
    update: function(resetAxis) {
    	var _this = this;

    	// find which dimension is the yDim (continuous). It assumes one dim is continuous and the other null.
    	if(dimensions[0].type == 'q'){
    		this.yDim = dimensions[0];
    	}
    	else {
    		this.yDim = dimensions[1];
    	}

    	// set scales and data for axis
    	var yData = chartData.map(function(d) { return eval("d."+_this.yDim.code); });
    	yData.sort(d3.ascending);
    	yMin = d3.min(yData);
        yMax = d3.max(yData);
        yMed = d3.median(yData);
        yQ1 = d3.quantile(yData, 0.25);
        yQ3 = d3.quantile(yData, 0.75);

		if(this.yaGlobalMax == null || resetAxis){
            this.yaGlobalMax = yMax;
        }
        this.y.domain([0,this.yaGlobalMax]);

        //calc text labels y positions (avoid overlaps)
        var yMaxText = _this.y(yMax);
        var yQ3Text = shiftText(_this.y(yQ3), yMaxText);
        var yMedText = shiftText(_this.y(yMed), yQ3Text);
        var yQ1Text = shiftText(_this.y(yQ1), yMedText);
        var yMinText = shiftText(_this.y(yMin), yQ1Text);

        // axis
        this.yAxisLabel
          .text(this.yDim.label)
        this.yaLineMin
          .attr("y1", this.y(yMin))
          .attr("y2", this.y(yMax));
        this.yaTextMin
          .attr("y", yMinText)
          .text(formatNum(yMin));
        this.yaTextMax
          .attr("y", yMaxText)
          .text(formatNum(yMax));
        this.yaLineQ
          .attr("y1", this.y(yQ1))
          .attr("y2", this.y(yQ3));
        this.yaTextQ1
          .attr("y", yQ1Text)
          .text(formatNum(yQ1));
        this.yaTextQ3
          .attr("y", yQ3Text)
          .text(formatNum(yQ3));
        this.yaLineMed
          .attr("y1", this.y(yMed)-1.5)
          .attr("y2", this.y(yMed)+1.5);
        this.yaTextMed
          .attr("y", yMedText)
          .text(formatNum(yMed));

        this.grayRectYQ
          .attr("y",  this.y(yQ3))
          .attr("height", this.y(yMed) - this.y(yQ3) -1.5);
        this.grayRectYM
          .attr("y",  this.y(yMed) + 1)
          .attr("height", this.y(yQ1) - this.y(yMed) - 1.5);

        // sort bubles
        chartData.sort(function (a, b) {
            return eval("a."+_this.yDim.code) - eval("b."+_this.yDim.code);
        });

        //set barWidth
        var barWidth = 25;
        if(chartData.length>20){
            barWidth = (width-20)/chartData.length;
        }

        //set buble moving delay based on the number of bubles, so that the total transition time stays the same
        var delayMs = Math.round(transitionTime / chartData.length);

        // bars below the bubles
        svg.selectAll(".bar")
          .data(chartData, function(d) {return "bar" + d.k; })
        .enter().append("rect")
          .attr("class","bar")
          .attr("x", function(d, i) {return Math.min(barWidth*(i+1),width/bubles.length*(i+1)) - 10; })
          .attr("y", function(d) { return _this.y(eval("d."+_this.yDim.code)) + 10; })
          .attr("height",0);

        svg.selectAll(".bar")
          .data(chartData, function(d) {return "bar" + d.k; })
          .transition().duration(transitionTime)
          .delay(function(d, i) {return i*delayMs;})
              .attr("x", function(d, i) {return Math.min(barWidth*(i+1),width/bubles.length*(i+1)) - 10; })
              .attr("y", function(d) { return _this.y(eval("d."+_this.yDim.code)) + 10; })
              .attr("height", function(d) { return height - _this.y(eval("d."+_this.yDim.code)) - 10; })
              .attr("width",20)
              .style("fill-opacity", 0.2)
              .style("fill", colorBubles);

        svg.selectAll(".bar")
          .data(chartData, function(d) {return "bar" + d.k; })
        .exit().remove();

        // redraw bubles to put them on top
        $('#bubles').insertAfter('#lastGrayArea');
    	// position, size and color bubles
        bubles.selectAll(".buble")
          .data(chartData, function(d) {return "buble" + d.k; })
          .transition().duration(transitionTime)
          .delay(function(d, i) {return i*delayMs;})
              .attr("cx", function(d, i) { return Math.min(barWidth*(i+1),width/bubles.length*(i+1)); })
              .attr("cy", function(d) { return _this.y(eval("d."+_this.yDim.code)); })
              .attr("r", sizeBubles)
              .style("fill", colorBubles);


    },
    clear: function() {
      svg.selectAll(".bar").remove();
      this.yAxis.remove();
      this.grayRectYQ.remove();
      this.grayRectYM.remove();
      this.yaGlobalMax = null;
    }
}