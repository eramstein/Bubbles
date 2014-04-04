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

var bublechart = {

    build: function() {
    	this.layoutGravity = -0.01;
    	this.damper = 0.1;
    	this.nodes = [];
    	this.nodes_all = [];
    	this.centers = null;
	    this.force = null;
	    this.dots = null;

	    this.createCenters();
	    this.createNodes();
        this.filterNodes();
	    this.createForce();
	    this.startForce();
    },

    createCenters: function() {
    	var _this = this;
    	var centers = '';
    	var centerNum = [0,0];
    	d3.selectAll(".centerLabel").remove();

    	var dimCode = dimensions[0].code;
        var dimCode2 = null;
        this.currentDimTypes = dimensions.map(function(d){return d.type.substring(0, 1);}).sort(d3.ascending).join();
        if(this.currentDimTypes=="o,o"){
            dimCode2 = dimensions[1].code;
        }

        //case only 1 dimension: single row
        if(dimCode2==null){
        	$(fieldVals).each(function(index, obj) {
        		if(obj.f==dimCode){
                    centerNum[0]++;
        			if(centers!=""){
        				centers += ',';
        			}
        			centers += '"' + obj.v + '":{"x":' + 120*centerNum[0] + ',"y":' + height/3 + '}';
        			svg.append("text")
        			  .attr("x", 120*centerNum[0]*(1.15) -80)
        			  .attr("y", height/3 - 130)
        			  .attr("class", "centerLabel")
        			  .text(obj.v);
        		}
        	});
        }

        //case 2 dimensions: a grid
        if(dimCode2!=null){
            $(fieldVals).each(function(index, obj) {
                if(obj.f==dimCode){
                    centerNum[0]++;
                    centerNum[1] = 0;
                    $(fieldVals).each(function(index2, obj2) {
                        if(obj2.f==dimCode2){
                            centerNum[1]++;
                            if(centers!=""){
                                centers += ',';
                            }
                            centers += '"' + obj.v + obj2.v + '":{"x":' + 120*centerNum[0] + ',"y":' + centerNum[1] * height/6 + '}';
                            if (centerNum[1] == 1){
                                svg.append("text")
                                  .attr("x", 120*centerNum[0]*(1.15) -80)
                                  .attr("y", height/3 - 130)
                                  .attr("class", "centerLabel")
                                  .text(obj.v);
                            }
                            if (centerNum[0] == 1){
                                svg.append("text")
                                  .attr("x", -80)
                                  .attr("y", centerNum[1] * height/6)
                                  .attr("class", "centerLabel")
                                  .text(obj2.v);
                            }
                        }
                    });
                }
            });
        }

    	this.centers = JSON.parse("{" + centers + "}");
    },

    createNodes: function() {
    	var _this = this;
	    $(bubles[0][0].childNodes).each(function(index, obj) {
          var bubble = bubles[0][0].childNodes[index];
	      var node;
	      node = {
	        k: bubble.__data__.k,
	        radius: sizeBubles(bubble.__data__),
	        x: bubble.cx.baseVal.value,
	        y: bubble.cy.baseVal.value,
	        sourceData: bubble.__data__
	      };
	      _this.nodes.push(node);
	    });
	    _this.nodes_all = _this.nodes;
    },

    filterNodes: function() {
    	this.nodes = this.nodes_all.filter(function(d) {
	        var found = false;
            if($('input[name="checkbox-filter-marked"]:checked').length > 0){
    	        $.each($(".buble.selected"), function(index, value) {
                    if($(value).attr("key")==d.k){
                        found = true;
                    }
                });
            }
            else {
                $.each(chartData, function(index, value) {
                    if(value.k==d.k){
                        found = true;
                    }
                });
            }
	        return found;
	    });
	    this.createForce();
    },

    resizeNodes: function() {
    	$(this.nodes).each(function(index, obj) {
    		obj.radius = sizeBubles(obj.sourceData)
    	});
    },

    createForce: function() {
    	this.force = d3.layout.force().nodes(this.nodes).size([width, height]);
    },

    charge: function(d) {
    	return -Math.pow(d.radius, 2.0) / 8;
    },

    drawBubles: function() {
    	var _this = this;
    	// size and color bubles, and add node specific info (x,y,target)
        bubles.selectAll(".buble")
          .data(_this.nodes, function(d) {return "buble" + d.k; })
          .transition().duration(transitionTime)
              .attr("r", function(d) {return sizeBubles(d.sourceData)})
              .style("fill", function(d) {return colorBubles(d.sourceData)});
        bubles.selectAll(".buble")
          .data(_this.nodes, function(d) {return "buble" + d.k; })
          .exit()
          	  .transition()
              .attr("r", function(d) {return 0});
    },

    startForce: function() {
    	var _this = this;
    	_this.drawBubles();
	    // start a loop to move them towards their respective centers
	    this.force.gravity(this.layoutGravity).charge(this.charge).friction(0.9).on("tick", function(e) {
	      return bubles.selectAll(".buble").each(_this.moveTowardsCenters(e.alpha)).attr("cx", function(d) {
	        return d.x;
	      }).attr("cy", function(d) {
	        return d.y;
	      });
	    });

	    this.force.start();
    },

    moveTowardsCenters: function(alpha) {
    	var _this = this;
	    return function(d) {
        if(d.sourceData!==undefined){
  	      var target;
            if(_this.currentDimTypes=="o"){
      	    target = eval("_this.centers." + eval("d.sourceData."+dimensions[0].code));
            }
            else {
              target = eval("_this.centers." + eval("d.sourceData."+dimensions[0].code)+eval("d.sourceData."+dimensions[1].code));
            }
  	      d.x = d.x + (target.x - d.x) * _this.damper * alpha;
  	      d.y = d.y + (target.y - d.y) * _this.damper * alpha;
        }
	    };
    },

    update: function() {
    	this.createCenters();
    	this.filterNodes();
    	this.resizeNodes();
    	this.startForce();
    },

    clear: function() {
      this.force.stop();
      this.nodes = [];
      this.nodes_all = [];
      this.centers = null;
      $(".centerLabel").remove();
    }
}