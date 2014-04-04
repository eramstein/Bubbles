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

var boxplot = {
	build: function() {

		this.yaGlobalMax = null;
		this.xDim = null;
		this.yDim = null;
		this.xLabels = [];

		this.x = d3.scale.ordinal()
  			.rangeBands([0,width]);
        this.y = d3.scale.linear()
            .range([height, 0]);

        this.yAxisLabel = svg.append("text")
          .attr("class", "dimensionLabel")
          .attr("transform", "rotate(-90)")
          .attr("y", -70)
          .attr("x", -height/3)
          .style("text-anchor", "end");

        this.update();

    },
    update: function(resetAxis) {
    	var _this = this;

    	// find which dimension is the xDim (discrete), and which is the yDim (continuous). It assumes one dim is continuous and the other discrete.
    	if(dimensions[0].type == 'q'){
    		this.xDim = dimensions[1];
    		this.yDim = dimensions[0];
    	}
    	else {
    		this.xDim = dimensions[0];
    		this.yDim = dimensions[1];
    	}

    	// build labels for x axis
    	_this.xLabels = [];
    	$(fieldVals).each(function(index, obj) {
    		if(obj.f==_this.xDim.code){
    			_this.xLabels.push(obj.v);
    		}
    	});

    	// set scales
    	var yData = chartData.map(function(d) { return eval("d."+_this.yDim.code); });
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

    	// position, size and color bubles
    	// add some randomness to the x values to avoid stacking them all on a line ? -10+Math.random() * 20
        bubles.selectAll(".buble")
          .data(chartData, function(d) {return "buble" + d.k; })
          .transition().duration(transitionTime)
              .attr("cx", function(d) { return _this.x(eval("d."+_this.xDim.code)); })
              .attr("cy", function(d) { return _this.y(eval("d."+_this.yDim.code)); })
              .attr("r", sizeBubles)
              .style("fill", colorBubles);

		//y axis label
		d3.selectAll(".yAxisGroup").remove();
		this.yAxisLabel
          .text(this.yDim.label);
        //boxplots (one per X category)
        $(this.xLabels).each(function(index, obj) {
        	//get y data for that category
        	var yData = chartData
        						 .filter(function(d) {if(eval("d."+_this.xDim.code)==obj){return true;}; })
        						 .map(function(d) { return eval("d."+_this.yDim.code); })
        	;
            if(yData.length>1){
            	yData.sort(d3.ascending);
    	        yMin = d3.min(yData);
    	        yMax = d3.max(yData);
    	        yMed = d3.median(yData);
    	        yQ1 = d3.quantile(yData, 0.25);
    	        yQ3 = d3.quantile(yData, 0.75);

                //calc text labels y positions (avoid overlaps)
                var yMaxText = _this.y(yMax)+3;
                var yQ3Text = shiftText(_this.y(yQ3), yMaxText)+3;
                var yMedText = shiftText(_this.y(yMed), yQ3Text)+3;
                var yQ1Text = shiftText(_this.y(yQ1), yMedText)+3;
                var yMinText = shiftText(_this.y(yMin), yQ1Text)+3;

            	//draw plots
        		var newGroup = svg.append("g")
        			  .attr("class","yAxisGroup")
        			  .attr("y", -20);
        		yaLineMin = newGroup.append("line")
        		  .style("stroke", "#000")
    	          .attr("x1",  _this.x(obj)+25.5)
    	          .attr("x2",  _this.x(obj)+25.5);
    	        yaTextMin = newGroup.append("text")
    	          .attr("font-size", "12")
    	          .attr("x",  _this.x(obj)+30)
    	          .style("text-anchor", "start");
    	        yaTextMax = newGroup.append("text")
    	          .attr("font-size", "12")
    	          .attr("x",  _this.x(obj)+30)
    	          .style("text-anchor", "start");
    	        yaLineQ = newGroup.append("line")
    	          .attr("x1", _this.x(obj)+25 + 0.5)
    	          .attr("x2", _this.x(obj)+25 + 0.5)
    	          .style("stroke", "#000")
    	          .style("stroke-width", 3);
    	        yaTextQ1 = newGroup.append("text")
    	          .attr("font-size", "12")
    	          .attr("x", _this.x(obj)+30)
    	          .style("text-anchor", "start");
    	        yaTextQ3 = newGroup.append("text")
    	          .attr("font-size", "12")
    	          .attr("x", _this.x(obj)+30)
    	          .style("text-anchor", "start");
    	        yaLineMed = newGroup.append("line")
    	          .attr("x1", _this.x(obj)+25 + 0.5)
    	          .attr("x2", _this.x(obj)+25 + 0.5)
    	          .style("stroke", "#fff")
    	          .style("stroke-width", 3);
    	        yaTextMed = newGroup.append("text")
    	          .attr("font-size", "12")
    	          .attr("x", _this.x(obj)+30)
    	          .style("text-anchor", "start");

    		    yaLineMin
    	          .attr("y1", _this.y(yMin))
    	          .attr("y2", _this.y(yMax));
    	        yaTextMin
    	          .attr("y", yMinText)
    	          .text(formatNum(yMin));
    	        yaTextMax
    	          .attr("y", yMaxText)
    	          .text(formatNum(yMax));
    	        yaLineQ
    	          .attr("y1", _this.y(yQ1))
    	          .attr("y2", _this.y(yQ3));
    	        yaTextQ1
    	          .attr("y", yQ1Text)
    	          .text(formatNum(yQ1));
    	        yaTextQ3
    	          .attr("y", yQ3Text)
    	          .text(formatNum(yQ3));
    	        yaLineMed
    	          .attr("y1", _this.y(yMed)-1.5)
    	          .attr("y2", _this.y(yMed)+1.5);
    	        yaTextMed
    	          .attr("y", yMedText)
    	          .text(formatNum(yMed));
            }
            //case only 1 buble for the category
            else {
                yMed = d3.median(yData);
                var newGroup = svg.append("g")
                      .attr("class","yAxisGroup")
                      .attr("y", -20);
                yaTextMed = newGroup.append("text")
                  .attr("font-size", "12")
                  .attr("x",  _this.x(obj)+30)
                  .style("text-anchor", "start");
                yaTextMed
                  .attr("y", _this.y(yMed)+3)
                  .text(formatNum(yMed));
            }
    	});

    },
    clear: function() {
    	this.yAxisLabel.remove();
    	d3.selectAll(".yAxisGroup").remove();
    	d3.selectAll(".xLabelText").remove();
    }
}