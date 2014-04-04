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

var chartData = [];
var chartDataAll = [];
var fields = [];
var fieldVals = [];
var fieldsAll = [];
var currentChartType = "";
var dimensions = [];
var prevDimensions = [];
var prevChartType = "";
var colorBy;
var newColorBy = "";
var colorScaleType;
var sizeBy = "";
var filter = [];
var transitionTime = 350;
var afterLoadCb;
var localData;


$(function() {
    prepareChart();
    var dataSource = "data.csv";
    if(window.location.hash) {
      dataSource = window.location.hash.substr(1);
    }
    loadData(firstDraw, dataSource);
});

function firstDraw () {
    prepareUI();
    colorChartBy();
    resetSizeScale();
    buildChart();
}

function buildChart () {
    //clear previous chart
    if(prevChartType != ""){
        deletePrevChart();
    }
    // bubles
    buildBubles();
    // chart elements
    eval(currentChartType + ".build()");
    // legend
    buildLegend();
}

function deletePrevChart () {
    eval(prevChartType + ".clear()");
}

function updateChart (resetAxis) {
    switch (currentChartType)
    {
    case "scatterplot":
        buildBubles();
        scatterplot.update(resetAxis);
    break;
    case "boxplot":
        buildBubles();
        boxplot.update(resetAxis);
    break;
    case "barchart":
        buildBubles();
        barchart.update(resetAxis);
    break;
    case "bublechart":
        bublechart.update();
    break;
    case "list":
        buildBubles();
        list.update();
    break;
    case "sumbarchart":
        buildBubles();
        sumbarchart.update(resetAxis);
    break;
    case "donut":
        buildBubles();
        donut.update();
    break;
    }
    // legend
    buildLegend();
}



function sizeChartBy (fromForm) {
    var newSizeBy = "";
    $.each($(".ui-size"), function(index, elmt) {
        if(elmt.value != "none"){
            newSizeBy = JSON.parse(elmt.value).code;
        }
     });
    // store selected colot in global var
    sizeBy = newSizeBy;
    //reset size scale
    resetSizeScale();
}


function plotChartBy (field) {
    var activeFields = dimensions.map(function (d) {
        return d.code;
    });
    //if removal of last dimension, cancel
    if(dimensions.length==1 && activeFields.indexOf(field.code)>=0){
        return false;
    }
    //update prev dimensions array
    prevDimensions = [];
    $.each(dimensions, function(index, value) {
        prevDimensions.push(value);
    });
    //if the new field was already in the dims, remove it
    //(we can't just check the active button due to a racing condition with bootstrap...)
    //(tbh bootsrap is not worth the trouble here, just too lazy to refactor this)
    if(activeFields.indexOf(field.code)>=0){
        dimensions.splice(activeFields.indexOf(field.code),1);
    }
    else {
        dimensions.push(field);
    }
    //if there are more than 2 dims, remove one
    if(dimensions.length>2){
        dimensions.splice(0,1);
    }
    //update plotBy checkboxes to reflect removal of one div
    activeFields = dimensions.map(function (d) {
        return d.code;
    });
    $.each($(".btn-plotBy"), function(index, elmt) {
        $(elmt).removeClass("active");
        if(activeFields.indexOf($(elmt).attr("field"))>=0){
            $(elmt).addClass("active");
        }
    });

    //check if the chart type has to be changed or not
    var prevDimTypes = prevDimensions.map(function(d){return d.type.substring(0, 1);}).sort(d3.ascending).join();
    var currentDimTypes = dimensions.map(function(d){return d.type.substring(0, 1);}).sort(d3.ascending).join();
    if(prevDimTypes!=currentDimTypes){
        //change chart type and UI
        setChartType ();
        //clear old chart and rebuild new one
        buildChart();
    }
    else{
        //if no, just update current chart
        updateChart(true);
    }
}

function changeView (el, viewType) {
    prevChartType = currentChartType;
    currentChartType = viewType;
    buildChart();
    $(el).addClass('active').siblings().removeClass('active');
}

function colorChartBy (fromForm) {
    newColorBy = "";
    $.each($(".ui-color"), function(index, elmt) {
        if(elmt.value != "none"){
            newColorBy = JSON.parse(elmt.value).code;
            colorScaleType = JSON.parse(elmt.value).type;
        }
    });
    // store selected color in global var
    colorBy = newColorBy;
    //reset color scale
    if(colorScaleType=="options"){
        color = d3.scale.category10();
    }
    else {
        color = d3.scale.linear();
        cData = chartData.map(function(d) { return eval("d."+colorBy); });
        cData.sort(d3.ascending);
        minC = d3.min(cData);
        maxC = d3.max(cData);
        color.domain([minC, maxC])
             .range([0,1]);
    }
}

function filterDataFromForm () {
    // we want to build a filter as an array of {"f":"","v":"","op":""}
    var filterArray = [];
    var currentVals = "";
    var fieldVal = "";
    // add a "in" statement for checkboxes
    $(".filter-type-options").each(function(index, obj) {
        currentVals = "";
        $(obj).children().children().children().children().children('.filter-checkbox:checked').each(function(i, elmt) {
            fieldVal = $(elmt).val();
            if(currentVals.indexOf("|"+fieldVal)<0){
                currentVals += "|"+fieldVal;
            }
        });
        filterArray.push({f:$(obj).attr("fieldCode"), v:currentVals, op:"in"});
    });
    // add a ">" or "<" statement for quantity fields
    $(".slider").each(function(index, obj) {
        var basicValues = $(obj).rangeSlider("values");
        filterArray.push({f:$(obj).attr("fieldCode"), v:basicValues.min, op:">"});
        filterArray.push({f:$(obj).attr("fieldCode"), v:basicValues.max, op:"<"});
    });
    //filter and update chart
    filterData (filterArray);
    updateChart(false);
}

function filterForMarked() {
    if($('input[name="checkbox-filter-marked"]:checked').length > 0){
        chartData = chartDataAll.filter(function(d) {
            var found = false;
            $.each($(".buble.selected"), function(index, value) {
                if($(value).attr("key")==d.k){
                    found = true;
                }
            });
            return found;
        });
        updateChart(false);
    }
    else {
        filterDataFromForm();
    }
}

function unmarkAll () {
    $.each($(".buble.selected"), function(index, value) {
        $(value).attr("class","buble")
    });
    if($('input[name="checkbox-filter-marked"]:checked').length > 0){
        $('#checkbox-filter-marked').attr('checked', false);
        filterForMarked();
    };
}

function setCheckboxesFromRadio (elmt) {
    var that = $(elmt);
    //for the same field, check the checkbox corresponding to this radio and uncheck all others
    that.parent().parent().parent().children().children().children('.filter-checkbox').prop('checked', false);
    that.parent().parent().children().children('.filter-checkbox').prop('checked', true);
    filterDataFromForm ();
}

function uncheckRadios (elmt) {
   var that = $(elmt);
    //for the same field, uncheck all radios
    that.parent().parent().parent().children().children().children('.filter-radio').prop('checked', false);
}

function filterData (filterArray) {
    chartData = chartDataAll.filter(function(d) {
        var found = true;
        $.each(filterArray, function(index, value) {
            switch (value.op)
            {
            case "in":
                currentVal = "|"+ eval("d."+value.f);
                if(value.v.toLowerCase().indexOf(currentVal.toLowerCase())<0){ found = false; }
            break;
            case "=":
                if(eval("d."+value.f)!=value.v){ found = false; }
            break;
            case ">":
                if(eval("d."+value.f)<value.v){ found = false; }
            break;
            case "<":
                if(eval("d."+value.f)>value.v){ found = false; }
            break;
            }
        });
        return found;
    });
}

function prepareUI () {
    //clear previous one
    $("#ui-dimensions").html("");
    $("#ui-color").html("");
    $("#ui-size").html("");
    $("#ui-filter").html("");
    //fill selects
    $.each($(".ui-select"), function(indexEl, elmt) {
        $.each(fields, function(indexField, field) {
            if($(elmt).hasClass("ui-size")==false || field.type=="q"){
                $(elmt).append("<option value='{\"code\":\"" + field.code + "\", \"type\":\"" + field.type + "\", \"label\":\"" + field.label + "\"}'>" + field.label + "</option>");
            }

        });
        $(elmt).append("<option value='none'>---</option>");
    });
    //fill plotBy checkboxes
    $.each(fields, function(indexField, field) {
        newCheck = $("<div  field='" + field.code + "' " +
                     " onclick='plotChartBy({\"code\":\"" + field.code + "\", \"type\":\"" + field.type + "\", \"label\":\"" + field.label + "\"});' " +
                     "        class='btn btn-primary btn-plotBy nohover'  " +
                     "        id='button-plotBy-" +  field.code + "' " +
                     "        >"  + field.label + "</div>");
        $("#ui-dimensions").append(newCheck);
    });
    //default selections
    $("#button-plotBy-a0").addClass("active");
    $("#button-plotBy-a1").addClass("active");
    $("#ui-color :nth-child(3)").attr("selected", "selected");
    $("#ui-size :last-child").attr("selected", "selected");
    //bind select events
    $("#ui-color").change(function () {
        colorChartBy(true);
        updateChart(false);
    })
    $("#ui-size").change(function () {
        sizeChartBy(true);
        updateChart(false);
    })
    //build filters
    $.each(fields, function(indexField, field) {
        // title and container
        newFilter = $("<div id='ui-filter-" + field.code + "' fieldCode='" + field.code + "' class='filter-block filter-type-" + field.type + "'><div class='filterTitle'>" + field.label + "</div></div>");
        newTable = $("<table class='table table-checks' style='background:white'></table>");
        $("#ui-filter").append(newFilter);
        $(newFilter).append(newTable);
        //for options fields, build a radios and checkboxes
        if (field.type == "options") {
            $.each(fieldVals, function(indexFieldVal, fieldVal) {
                if(fieldVal.f == field.code){
                    newRadio = $("<td><input type='radio' " +
                                 "        name='radio-"+fieldVal.f+"'  " +
                                 "        id='radio-"+indexField+"-"+indexFieldVal+"'  " +
                                 "        onchange=setCheckboxesFromRadio(this)" +
                                 "        class='filter-radio filter-box'  " +
                                 "        /></td>");
                    newCheck = $("<td><input type='checkbox' " +
                                 "        name='checkbox-"+fieldVal.f+"'  " +
                                 "        checked='checked'  " +
                                 "        class='filter-checkbox filter-box'  " +
                                 "        id='checkbox-"+indexField+"-"+indexFieldVal+"'  " +
                                 "        onchange=filterDataFromForm();uncheckRadios(this)" +
                                 "        value='" +  fieldVal.v + "' " +
                                 "        /></td>");
                    newLabel = $("<td><label for='checkbox-"+indexField+"-"+indexFieldVal+"' style='width:100%'>"+fieldVal.v+"</label></td>");

                    newContainer = $("<tr></tr>");
                    newContainer.append(newRadio);
                    newContainer.append(newCheck);
                    newContainer.append(newLabel);
                    $(newTable).append(newContainer);
                }
            });
        }
        //for quantity fields, build a "from" and "to" text fields
        if (field.type == "q") {
            newSlider = $("<div class='slider' fieldCode='"+field.code+"' />");
            var data = chartDataAll.map(function (d) {
                return d[field.code];
            });
            data.sort(function(a, b) { return a - b });
            var dataMin = data[0];
            var dataMax = data[data.length-1];
            $(newFilter).append(newSlider);
            $(newSlider).rangeSlider({bounds:{min: dataMin, max: dataMax}, defaultValues:{min: dataMin, max: dataMax},
                                      formatter:function(val){
                                        return formatNum(val);
                                      }});
        }
    });

    $(".slider").bind("valuesChanged", function(e, data){
      filterDataFromForm();
    });

}

function loadData (cb, dataSource) {
    afterLoadCb = cb;
    //get all data from TSV or CSV file
    if(dataSource.indexOf(".tsv")>0){
        d3.tsv(dataSource, setUpData);
    }
    else {
        d3.csv(dataSource, setUpData);
    }
}

function setUpData (data) {
      //create main dataset of the format [{"a1":1, "a2":1},...]
      chartDataAll = data.map(function(d,index) {
        var newObj = {};
        newObj.k = index;
        var i = 0;
        for (var property in d) {
            if (property!="") {
                if(isNaN(d[property])){
                    newObj["a"+i] = d[property];
                }
                else {
                    newObj["a"+i] = d[property]*1;
                }
                i++;
            }
        }
        return newObj;
      });
      //create list of fields
      fields = [];
      fieldVals = [];
      fieldsAll = [];
      //first pass the first record to get field names and codes and assume they are all quantities (numeric)
      var i = 0;
      for (var property in data[0]) {
        if (property!="") {
            var newObj = {};
            newObj.label = property;
            newObj.code = "a"+i;
            newObj.countDiff = 0;
            newObj.type = "q";
            fields.push(newObj);
            i++;
        }
      }
      //check if any value is non numeric, if yes make the field as quantitative (options) and store its value in fieldVals
      $.each(chartDataAll, function(index, value) {
        for (var property in value) {
            if(isNaN(value[property])){
                $.each(fields, function(index, field) {
                    if(field.code == property){
                        field.type = "options";
                        var newVal = {};
                        newVal.f = property;
                        newVal.v = value[property];
                        var found = false;
                        $.each(fieldVals, function(index, fieldsVal) {
                            if(fieldsVal.f==newVal.f && fieldsVal.v==newVal.v){
                                found = true;
                            }
                        });
                        if (found==false) {
                            fieldVals.push(newVal);
                            field.countDiff++;
                        }
                    }
                });
            }
        }
      });
      //store all fields in fieldsAll, then remove those with too many different values
      $.each(fields, function(index, field) {
        fieldsAll.push(field);
      });
      $.each(fieldsAll, function(index, field) {
        if(field.countDiff>12){
            fields.splice(index,1);
        }
      });
      //prepare tooltips
      $("#tooltip").html("");
      $.each(fieldsAll, function(index, field) {
        var newDiv = $('<div><span>'+field.label+': </span> <span id="tt_'+field.code+'"></span></div>');
        $("#tooltip").append(newDiv);
      });
      //initialize chartData with all data
      chartData = chartDataAll;
      //dimensions
      dimensions = [fields[0],fields[1]];
      colorBy = fields[2].code;
      colorScaleType = fields[2].type;
      //chart type
      setChartType();
      //callback
      afterLoadCb();
}

function setChartType () {
    var currentDimTypes = dimensions.map(function(d){return d.type.substring(0, 1);}).sort(d3.ascending).join();
    prevChartType = currentChartType;
    //if yes, find which chart it should be and
    //update radio buttons for chart types
    $(".label-viewtype").hide();
    $(".radio-viewtype").hide();
    switch (currentDimTypes)
    {
    case "q,q":
        currentChartType = "scatterplot";
        $("#radio-viewtype-scatterplot").show().addClass('active').siblings().removeClass('active');
    break;
    case "o,q":
        currentChartType = "boxplot";
        $("#radio-viewtype-boxplot").show().addClass('active').siblings().removeClass('active');
        $("#radio-viewtype-sumbarchart").show();
        $("#radio-viewtype-donut").show();
    break;
    case "o,o":
        currentChartType = "bublechart";
        $("#radio-viewtype-bublechart").show().addClass('active').siblings().removeClass('active');
    break;
    case "o":
        currentChartType = "bublechart";
        $("#radio-viewtype-bublechart").show().addClass('active').siblings().removeClass('active');
        $("#radio-viewtype-sumbarchart").show();
        $("#radio-viewtype-donut").show();
    break;
    case "q":
        currentChartType = "barchart";
        $("#radio-viewtype-barchart").show().addClass('active').siblings().removeClass('active');
    break;
    }
    $("#radio-viewtype-list").show().prop('checked', true);
    //re-round corners
    $(".btn-first").removeClass('btn-first');
    $("#chart-types").children(":visible").first().addClass("btn-first");
}

function selectDatasource () {
    $( "#ui" ).toggle();
    $( "#select-source" ).toggle();
}

function reloadData (dataSource) {
    window.location.href="#"+dataSource;
    location.reload(false);
}

function reloadDataFromLocalFile(input) {
  if (input.files && input.files[0]) {
      var reader = new FileReader();

      reader.onload = function (e) {
          localData = e.target.result;

          selectDatasource ();
          afterLoadCb = firstDraw;
          if(input.files[0].name.indexOf(".tsv")>0){
              setUpData(d3.tsv.parse(localData));
          }
          else {
              setUpData(d3.csv.parse(localData));
          }

      };

      reader.readAsText(input.files[0]);
  }
}
