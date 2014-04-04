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

var svg;
var margin;
var width;
var height;
var color;
var colorSurface;
var sizeScale;
var bubles;
var minC;
var maxC;
var legend = null;
var legendElements = null;

var formatNum = function (argument) {
  if(isNaN(argument)){
    return "";
  }
  else {
    if(argument>10){
        return formatNumExecute(argument);
    }
    else {
        return formatSmallNumExecute(argument);
    }
  }
}

var formatNumExecute = d3.format(",.0f");
var formatSmallNumExecute = d3.format(",.1f");

var colorInterpolator = d3.interpolateRgb("#ffffff", "#006600");

colorSurface = d3.scale.category10();

function prepareChart () {
	//prepare chart (elements common to all visualizations: svg and bubles)
    //-------------------------------------------------------
    margin = {top: 40, right: 200, bottom: 30, left: 100};
    width = 1040 - margin.left - margin.right;
    height = 500 - margin.top - margin.bottom;

    svg = d3.select("#chart_container").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id","chart_container_svg")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //scales common to multiple chart types
    color = d3.scale.category10();
    sizeScale = d3.scale.sqrt().range([5, 30]);

    //bubles
    bubles = svg.append("svg:g").attr("id", "bubles");

    //list rows
    listRows = svg.append("svg:g").attr("id", "listRows");

    //legend
    legend = svg.append("svg:g").attr("id", "legend");

    //marking
    trackMarquee(document.getElementById("chart_container_svg"), selectFromMarquee);
}

function buildBubles () {
    // new bubles
    bubles.selectAll(".buble")
      .data(chartData, function(d) {return "buble" + d.k; })
    .enter().append("circle")
      .attr("id", function(d, i) { return "buble-"+d.k; })
      .attr("key", function(d) { return d.k; })
      .attr("class", "buble")
      .style("stroke-width", 0.5)
      .style("fill-opacity", 0.5)
      .on("mouseover", function(d, i) {buildTooltip(this)})
      .on("mouseout", function(d, i) { $("#tooltip").hide();})
      .on("click", function(d, i) {
        if($(this).attr('class')=="buble"){
          $(this).attr('class','buble selected');
        }else {
          $(this).attr('class','buble');
        }
      })
    ;
    // remove dots
    bubles.selectAll(".buble")
      .data(chartData, function(d) { return "buble" + d.k; })
    .exit()
    .transition().duration(transitionTime)
          .attr("r", function(d) { return 0; });
}

function buildTooltip(elmtId){
    var itemId = $(elmtId).attr("key");
    var item = $.grep(chartData, function(toFind){
      return toFind.k == itemId;
    })[0];

    $.each(fieldsAll, function(index, field) {
      var newDiv = $('<div><span>'+field.label+': </span> <span id="tt_'+field.code+'"></span></div>');
      $("#tt_" + field.code).html(eval("item."+field.code));
    });

    var pos = $(elmtId).position();
    $("#tooltip").css({
        position: "absolute",
        top: (pos.top - 30) + "px",
        left: (pos.left + 50) + "px"
    }).show();
}

function colorBubles(d) {
   if(colorBy!=""){
     if (colorScaleType=="q") {
          return colorInterpolator(color(eval("d."+colorBy)));
     } else {
          return color(eval("d."+colorBy));
     }
   }
   else {
     return color("");
   }
}

function sizeBubles(d) {
   if(sizeBy!="") {
    return sizeScale(eval("d."+sizeBy));
   }
   else {
    return 10;
   }
}

function resetSizeScale () {
    if(sizeBy != ""){
        sData = chartDataAll.map(function(d) { return eval("d."+sizeBy); });
        sData.sort(d3.ascending);
        sGlobalMax = d3.max(sData);
        sGlobalMin = d3.min(sData);
        sizeScale.domain([sGlobalMin,sGlobalMax]);
    }
}

function buildLegend(){
    if(legendElements!=null){
        legendElements.remove();
    }

    if(colorBy==""){
      return false;
    }

    if(colorScaleType=="options"){
        legendElements = legend.selectAll(".legend")
          .data(color.domain(), function(d,i){return d;})
        .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(100," + i * 20 + ")"; });
        legend.selectAll(".legend")
          .data(color.domain(), function(d,i){return d;})
        .exit().remove();

        legendElements.append("rect")
          .attr("x", width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", color)
          .style("fill-opacity", 0.5);

        legendElements.append("text")
          .attr("x", width + 10)
          .attr("y", 9)
          .attr("dy", ".35em")
          .text(function(d) { return d; });
    }
    else {

        var gradient = svg.append("svg:defs")
          .append("svg:linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");

        gradient.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#006600")
            .attr("stop-opacity", 1);

        gradient.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#ffffff")
            .attr("stop-opacity", 1);

        legendElements = legend.append("g").attr("transform", "translate(" + (width+100)  + ",0)");

        legendElements.append("svg:rect")
            .attr("width", 20)
            .attr("height", 100)
            .style("fill", "url(#gradient)");

        legendElements.append("svg:text")
            .attr("x", 25)
            .attr("y", 5)
            .text(maxC);
        legendElements.append("svg:text")
            .attr("x", 25)
            .attr("y", 100)
            .text(minC);
    }
}

function shiftText(pos, prevTextPos) {
    if(prevTextPos>pos-10){
        return pos + (10 - (pos- prevTextPos) );
    }
    else {
        return pos;
    }
}
