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

var list = {
  build: function() {
    //create HTML table
    this.table = d3.select("body").append("table")
            .attr("class", "listtable");
    this.thead = this.table.append("thead");
    this.tbody = this.table.append("tbody");
    this.headerRow = this.thead.append("tr");

    // append the header row
    this.headerRow.append("th").attr("class", "tableBubleCell");

    this.headerRow
        .selectAll(".lh")
        .data(fieldsAll)
        .enter()
        .append("th")
            .attr("class", "lh")
            .text(function(field) { return field.label; });

    // create a row for each object in the data
    this.rows = this.tbody.selectAll("tr")
        .data(chartData, function(d) {return d.k; })
        .enter()
        .append("tr");

    this.rows.append("td").attr("class", "tableBubleCell");

    // create a cell in each row for each column
    this.cells = this.rows.selectAll(".ld")
        .data(function(row) {
            return fieldsAll.map(function(field) {
                return {field: field.code, value: row[field.code]};
            });
        })
        .enter()
        .append("td")
            .attr("class", "ld")
            .html(function(d) { return d.value; });

    //update
    this.update();
  },
  update: function() {
    //move resize and color bubles
    bubles.selectAll(".buble")
          .data(chartData, function(d) {return "buble" + d.k; })
          .transition()
              .attr("cx", -30)
              .attr("cy", function(d,i) { return i*40 + 10; })
              .attr("r", sizeBubles)
              .style("fill", colorBubles);

    //show entering ones
    this.tbody.selectAll("tr")
        .data(chartData, function(d) {return d.k; })
        .attr("class", "");

    //hide exiting ones
    this.tbody.selectAll("tr")
        .data(chartData, function(d) {return d.k; })
        .exit()
        .attr("class", "hide");

    //make chart higher if necessary
    $("#chart_container").css("height", (chartData.length*40 + margin.top + margin.bottom) +"px");
    $("#ui-filter").css("height", (chartData.length*40 + margin.top + margin.bottom) +"px");
    $("#chart_container_svg").css("height", (chartData.length*40 + margin.top) +"px");

  },
  clear: function() {
    this.table.remove();
    $("#chart_container").css("height", "560px");
    $("#ui-filter").css("height", "560px");
    $("#chart_container_svg").css("height", height + margin.top + margin.bottom);
  }
}