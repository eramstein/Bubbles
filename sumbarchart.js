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

var sumbarchart = {
	build: function() {

		this.yaGlobalMax = null;
		this.xDim = null;
		this.yDim = null;
		this.xLabels = [];
        this.bars = svg.append("svg:g");
        this.barLabels = svg.append("svg:g");

		this.x = d3.scale.ordinal()
  			.rangeBands([0,width]);
        this.y = d3.scale.linear()
            .range([0, height-30]);

        // y label
        this.yAxisLabel = svg.append("text")
          .attr("class", "dimensionLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", -70)
          .attr("x", -height/3)
          .style("text-anchor", "end");

        // x bottom bar
        this.xLine = svg.append("line")
          .attr("x1", -margin.left/2)
          .attr("x2", width)
          .attr("y1", height-0.5)
          .attr("y2", height-0.5)
          .style("stroke", "#333")
          .style("stroke-width", 1);

        this.update();

    },
    update: function(resetAxis) {
    	var _this = this;

    	// find which dimension is the xDim (discrete), and optionnaly which is the yDim (continuous). It assumes one dim at least is discrete.
    	if(dimensions.length==2){
            if(dimensions[0].type == 'q'){
        		this.xDim = dimensions[1];
        		this.yDim = dimensions[0];
        	}
        	else {
        		this.xDim = dimensions[0];
        		this.yDim = dimensions[1];
        	}
        }
        else {
            this.xDim = dimensions[0];
            this.yDim = null;
        }

    	// build labels for x axis
    	_this.xLabels = [];
    	$(fieldVals).each(function(index, obj) {
    		if(obj.f==_this.xDim.code){
    			_this.xLabels.push(obj.v);
    		}
    	});

    	// set scales
        var yData;
        // ----------------
        //nest by xDim for all data, and sum on yDim (if no yDim, just count bubles)
        var rollup = d3.nest().key(function(d) {
          return d[_this.xDim.code];
        }).rollup(function(d) {
          return d3.sum(d, function(g) {
            if(_this.yDim!=null){
                return eval("g."+_this.yDim.code);
            }
            else {
                return 1;
            }
          });
        }).entries(chartDataAll);
        //find maximum height for all values (including those excluded by the filters)
    	yData = rollup.map(function(d) { return d.values; });
    	yData.sort(d3.ascending);
    	yMax = d3.max(yData);
		if(this.yaGlobalMax == null || resetAxis){
            this.yaGlobalMax = yMax;
        }

        this.x.domain(this.xLabels);
        this.y.domain([0,this.yaGlobalMax]);

        // add X labels
        d3.selectAll(".xLabelText").remove();
        $(this.xLabels).each(function(index, obj) {
    		svg.append("text")
    			  .attr("x", _this.x(obj))
    			  .attr("y", -20)
    			  .attr("class", "xLabelText")
    			  .style("text-anchor", "middle")
    			  .style("font-weight", "bold")
    			  .text(obj);
    	});

        //nest by xDim for current filtered data, and sum on yDim
        var rollup = d3.nest().key(function(d) {
          return d[_this.xDim.code];
        }).rollup(function(d) {
          return d3.sum(d, function(g) {
            if(_this.yDim!=null){
                return g[_this.yDim.code];
            }
            else {
                return 1;
            }
          });
        }).entries(chartData);

        // sort rollup by xDim
        function compareX(a,b) {
          if (a[_this.xDim.code] < b[_this.xDim.code])
             return -1;
          if (a[_this.xDim.code] > b[_this.xDim.code])
            return 1;
          return 0;
        }
        rollup.sort(compareX);

        //build bars based on totals by xDim values
        this.bars.selectAll("rect")
        .data(rollup, function(d) {return "bar" + d.key; })
          .enter()
            .append("rect")
              .attr("x", function(d) { return Math.round(_this.x(d.key)) -25.5; })
              .attr("y", function(d) { return Math.round(height - _this.y(d.values)) -0.5; })
              .attr("width",50)
              .attr("height",function(d) { return Math.round(_this.y(d.values)); })
              .style("fill", "#eeeeee")
              .style("stroke", "#333333")
              .style("stroke-width", 0.5);
        this.bars.selectAll("rect")
        .data(rollup, function(d) {return "bar" + d.key; })
          .exit().remove();
        this.bars.selectAll("rect")
        .data(rollup, function(d) {return "bar" + d.key; })
            .transition().duration(transitionTime)
              .attr("y", function(d) { return Math.round(height - _this.y(d.values)) -0.5; })
              .attr("height",function(d) { return Math.round(_this.y(d.values)); });

        //bar labels with total values
        this.barLabels.selectAll("text")
        .data(rollup, function(d) {return "barLabel" + d.key; })
          .enter()
            .append("text")
              .attr("x", function(d) { return _this.x(d.key); })
              .style("text-anchor", "middle");
        this.barLabels.selectAll("text")
        .data(rollup, function(d) {return "barLabel" + d.key; })
          .exit().remove();
        this.barLabels.selectAll("text")
        .data(rollup, function(d) {return "barLabel" + d.key; })
            .transition().duration(transitionTime)
              .attr("y", function(d) { return height - _this.y(d.values) - 5; })
              .text(function(d) { return formatNum(d.values); });

        //count number of bubles by xDim category
        var countByCategory = d3.nest()
          .key(function(item) { return item[_this.xDim.code]; })
          .rollup(function(items) { return items.length; })
          .map(chartData);

        var iteratorByCategory = d3.nest()
          .key(function(item) { return item[_this.xDim.code]; })
          .rollup(function(items) { return 0; })
          .map(chartData);

        var heightByCategory;
        if(_this.yDim!=null){
            heightByCategory = d3.nest()
              .key(function(item) { return item[_this.xDim.code]; })
              .rollup(function(d) { return d3.sum(d, function(g) {
                        return _this.y(g[_this.yDim.code]);
                      });
                })
              .map(chartData);
        }
        else {
            heightByCategory = d3.nest()
              .key(function(item) { return item[_this.xDim.code]; })
              .rollup(function(d) { return d3.sum(d, function(g) {
                        return _this.y(1);
                      });
                })
              .map(chartData);
        }

        //if 2 dims and xDim is colorBy, sort chartdata on current yDim , so that the bubles wit hthe lowest values go on the bottom (movement will look less chaotic)
        //else, sort by colorBy
        function compare(a,b) {
          if (a[_this.yDim.code] < b[_this.yDim.code])
             return -1;
          if (a[_this.yDim.code] > b[_this.yDim.code])
            return 1;
          return 0;
        }
        function compareColor(a,b) {
          if (a[colorBy] < b[colorBy])
             return -1;
          if (a[colorBy] > b[colorBy])
            return 1;
          return 0;
        }
        if(_this.yDim!=null && _this.xDim.code == colorBy){
            chartData.sort(compare);
        }
        else {
            chartData.sort(compareColor);
        }

        // redraw bubles to put them on top
        $('#bubles').insertAfter(this.bars);
    	// position, size and color bubles
    	// the vertical position is an even split within the corresponding bar
        bubles.selectAll(".buble")
          .data(chartData, function(d) {return "buble" + d.k; })
          .transition().duration(transitionTime)
              .attr("cx", function(d) { return _this.x(eval("d."+_this.xDim.code)); })
              .attr("cy", function(d) { iteratorByCategory[d[_this.xDim.code]]++;
                                        return height - heightByCategory[d[_this.xDim.code]]/countByCategory[d[_this.xDim.code]]*(iteratorByCategory[d[_this.xDim.code]]-0.5); })
              .attr("r", sizeBubles)
              .style("fill", colorBubles);

		//y axis label
		d3.selectAll(".yAxisGroup").remove();
        if(_this.yDim!=null){
    		this.yAxisLabel
              .text("Sum Of " + this.yDim.label);
        }
        else {
            this.yAxisLabel
              .text("Count");
        }

    },
    clear: function() {
    	this.yAxisLabel.remove();
    	this.bars.remove();
        this.barLabels.remove();
        d3.selectAll(".xLabelText").remove();
        this.xLine.remove();
    }
}