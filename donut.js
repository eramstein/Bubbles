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

var donut = {
	build: function() {

		this.xDim = null;
		this.yDim = null;
        this.arcs = svg.append("svg:g").attr("transform", "translate("+width/2+","+height/2+")");
        this.arcLabels = svg.append("svg:g");

        this.pie = d3.layout.pie();

        this.outerRadius = 150;
        this.innerRadius = 200;
        this.midRadius = this.outerRadius + (this.innerRadius-this.outerRadius)/2;

        this.arc = d3.svg.arc()
            .outerRadius(150)
            .innerRadius(200);

        // y label
        this.yAxisLabel = svg.append("text")
          .attr("class", "dimensionLabel")
          .attr("y", height/2)
          .attr("x", width/2)
          .style("text-anchor", "middle");

        this.arcColors = d3.scale.ordinal()
            .range(["#eeeeee", "#dddddd", "#cccccc"]);

        this.update();

    },
    update: function() {
    	var _this = this;

        // --------------------------------------------------------------------
        // PREPARE DATA
        // --------------------------------------------------------------------

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

        var yData;
        // ----------------
        //nest by xDim for current data, and sum on yDim (if no yDim, just count bubles)
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

        // set pie
        _this.pie
            .value(function(d) { return d.values; });

        // --------------------------------------------------------------------
        // ARCS AND LABELS
        // --------------------------------------------------------------------

        //build new arcs
        this.arcs.selectAll("path")
          .data(_this.pie(rollup), function(d) { return d.data.key; })
        .enter().append("path")
              .attr("d", _this.arc)
              .each(function(d) { this._current = d; })
              .style("stroke","#666666")
              .style("fill", function(d, i) { return _this.arcColors(i); })
              .append("svg:title").text("");

        this.arcs.selectAll("text")
          .data(_this.pie(rollup), function(d) { return d.data.key; })
        .enter().append("text")
              .attr("dy", ".35em")
              .style("text-anchor", "middle")
              .style("font-weight","bold");

        //update existing arcs
        this.arcs.selectAll("path")
          .data(_this.pie(rollup), function(d) { return d.data.key; })
              .transition().duration(transitionTime)
              .attrTween("d", arcTween)
            .selectAll("title").text(function(d) {return d.data.key + ": " + formatNum(d.data.values)});

         this.arcs.selectAll("text")
          .data(_this.pie(rollup), function(d) { return d.data.key; })
              .transition().duration(transitionTime)
              .attr("transform", function(d) {
                    //set it outside the pie
                    var c = _this.arc.centroid(d),
                        x = c[0],
                        y = c[1],
                        // pythagorean theorem for hypotenuse
                        h = Math.sqrt(x*x + y*y);
                    return "translate(" + (x/h * (_this.innerRadius+40)) +  ',' +
                       (y/h * (_this.innerRadius+40)) +  ")";
              })
              .text(function(d) {return d.data.key + ": " + formatNum(d.data.values)})
              ;

        function arcTween(d) {
          var i = d3.interpolate(this._current, d);
          this._current = i(0);
          return function(t) {
            return _this.arc(i(t));
          };
        }

        //remove exiting arcs
        this.arcs.selectAll("path")
          .data(_this.pie(rollup), function(d) { return d.data.key; })
        .exit()
            .remove();

         this.arcs.selectAll("text")
          .data(_this.pie(rollup), function(d) { return d.data.key; })
        .exit()
            .remove();

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

        // --------------------------------------------------------------------
        // BUBBLES
        // --------------------------------------------------------------------

        //compute bubbles position

        //count how many bubble per category
        var categCount = [];
        var categAddedCountX = [];
        var categAddedCountY = [];
        $.each(rollup, function(i, item){
            categCount.push(0);
            categAddedCountX.push(0);
            categAddedCountY.push(0);
        });
        $.each(chartData, function(index, value){
          var categNum = 0;
          $.each(rollup, function(i, item){
            if (item.key == value[_this.xDim.code]) {categNum = i};
          });
          categCount[categNum]++;
        });

        function getPosition (d, addToCount) {
          // the whole addToCountXY stuff is crappy but no time to fix it now...
          var value = {};
          var categNum = 0;

          $.each(rollup, function(i, item){
            if (item.key == d[_this.xDim.code]) {categNum = i};
          });

          if(addToCount=="x") {categAddedCountX[categNum]++} else {categAddedCountY[categNum]++};

          var posInCateg;
          if(addToCount=="x") {posInCateg = categAddedCountX[categNum]} else {posInCateg = categAddedCountY[categNum]};

          //get the category's angles
          var start = _this.pie(rollup)[categNum].startAngle;
          var end = _this.pie(rollup)[categNum].endAngle;

          //the points get spread evenly in the category (add PI/2 because our pie starts at 12oclock while math convention starts at 3oclock)
          value.ang = start + (posInCateg-0.5)*(end - start)/(categCount[categNum]) - Math.PI/2;

          //calc position
          value.x = Math.cos(value.ang) * _this.midRadius + width/2;
          value.y = Math.sin(value.ang) * _this.midRadius + height/2;

          return value;
        }

        // redraw bubles to put them on top
        $('#bubles').insertAfter(this.arcs);
    	// position, size and color bubles
        bubles.selectAll(".buble")
          .data(chartData, function(d) {return "buble" + d.k; })
          .transition().duration(transitionTime)
              .attr("cx", function(d) { return getPosition(d, "x").x; })
              .attr("cy", function(d) { return getPosition(d, "y").y; })
              .attr("r", sizeBubles)
              .style("fill", colorBubles);



    },
    clear: function() {
    	this.yAxisLabel.remove();
    	this.arcs.remove();
        this.arcLabels.remove();
    }
}