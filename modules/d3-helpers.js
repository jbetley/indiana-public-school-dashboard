// Indiana Public School Academic Dashboard
// d3.js charting functions
// author:   jbetley (https://github.com/jbetley)
// version:  0.9
// date:     02.18.25

// https://datawanderings.com/2019/10/28/tutorial-making-a-line-chart-in-d3-js-v-5/
// https://observablehq.com/@greenafrican/grouped-bar-chart
// https://dataviz.unhcr.org/tools/d3/d3_stacked_column_100perc_chart.html
// https://d3-graph-gallery.com/graph/barplot_stacked_percent.html
// https://stackoverflow.com/questions/71809474/stacked-bar-chart-with-general-update-pattern-d3-js
// https://stackoverflow.com/questions/65568012/making-a-d3-js-stacked-bar-chart-responsive
// https://stackoverflow.com/questions/66603432/d3-js-how-to-add-the-general-update-pattern-to-a-stacked-bar-chart
// https://gist.github.com/jfsiii/0d4f863fec8b56d94b534db97816cd67
// https://codereview.stackexchange.com/questions/195936/update-the-line-charts-without-deleting-the-svg
// https://codepen.io/billdwhite/pen/OJLeLR
// https://stackoverflow.com/questions/72630781/d3-wrapping-text-legends
// https://dataviz.unhcr.org/tools/d3/d3_grouped_bar_chart.html


/// Multi-Line Year over Year Chart ///
function multiLine() {

  let defaultWidth = window.innerWidth/2 - 125;

  var margin = {top: 15, right: 35, bottom: 80, left: 35},
    width = defaultWidth - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom,
    widthScale,
    updateData,
    updateWidth,
    focus,
    categories,
    colors,
    data = [],
    y = d3.scaleLinear().range([height, 0]),
    x = d3.scalePoint().range([0, width]);

  var line = d3.line()
    .x(function(d) { return x(d.year); })
    .y(function(d) { return y(d.proficiency); });

  var xAxis = d3.axisBottom(x)
    .scale(x)
    .tickSizeInner(0)
    .tickSizeOuter(0)
    .tickFormat(d3.format('.4'))
    .tickPadding([10]);

  var yAxis = d3.axisLeft()
    .scale(y)
    .ticks(5)
    .tickSizeInner(-width)
    .tickSizeOuter(0)
    .tickPadding([5])
    .tickFormat(d3.format(".0%"));

  // hardcode colors to categories to ensure that colors are
  // consistently displayed
  var colors = {}
  const colorList = [ "#7b6888", "#df8f2d", "#a8b462", "#ebbb81", "#74a2d7", "#d4773f",
                      "#83941f", "#f0c33b", "#bc986a", "#96b8db"]

  function chart(selection){

    selection.each(function () {

      var dataByYear = data;

      var dataProcessed = processData(dataByYear);
      var dataByCategory = dataProcessed[0];
      var years = dataProcessed[1];

      categories = dataByYear.columns;
      categories = categories.filter(el => el != "School Name")
      categories.forEach((category, i) => colors[category] = colorList[i])

      y.domain([(0), d3.max(dataByCategory, function(c) {
        return d3.max(c.values, function(d) {
            return d.proficiency + .10; })
            })
        ]);

      x.domain(years);

      var dom = d3.select(this);

      var svg = dom.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // TODO: testing removing the extra linechart "level"
      // var svg = dom.append("svg")
      //   .attr("width", width + margin.left + margin.right)
      //   .attr("height", height + margin.top + margin.bottom)

      // let id = dom._groups[0][0].id
      // var linechart = svg.append("g")
      //   .attr('class', 'linechart-g')
      //   .attr('id', id)
      //   .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("g")
        .attr("class", "x axis")
        .attr('transform', `translate(0,${ height })`)
        .style("font-size", 8)
        .style("font-family", "Inter, sans-serif")
        .attr("color", "#6783a9")
        .call(xAxis);

      svg.append("g")
        .attr('class', 'y axis')
        .style("font-size", 8)
        .style("font-family", "Inter, sans-serif")
        .attr("color", "#6783a9")
        .call(yAxis);

      svg.selectAll(".y.axis")
        .select('.domain')
        .remove()

      // tooltip line
      focus = svg.append('g')
        .attr('class', 'focus')
        .style('display', 'none');

      focus.append('line')
        .attr('class', 'x-hover-line hover-line')
        .attr('y1' , 0)
        .attr('y2', height);

      var legendContainer = svg.append('g')
        .attr('class', 'legendcontainer');

      updateData = function() {

        // display empty svg is there is no data
        if (data.length == 0 || data.columns.length == 0) {

          svg.selectAll("path.lines").remove()
          svg.selectAll("circle.circles").remove()
          svg.selectAll("rect.overlay").remove()
          svg.selectAll(".legendcontainer").attr('display', 'none')
          svg.selectAll(".x.axis").attr('display', 'none')
          svg.selectAll(".y.axis").attr('display', 'none')

          svg.append("text")
            .attr('class', 'nodatatext')
            .attr("font-size","18px")
            .attr("y", height/2)
            .attr("x", width/2)
            .attr("dy", ".47em")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("fill", "steelblue")
            .text("No data to display.");
        }
        else {

          svg.selectAll(".nodatatext").remove()

          dataByYear = data

          dataProcessed = processData(dataByYear);

          dataByCategory = dataProcessed[0];
          years = dataProcessed[1];

          categories = dataByYear.columns;
          categories = categories.filter(el => el != "School Name")
          categories.forEach((category, i) => colors[category] = colorList[i])

          y.domain([(0), d3.max(dataByCategory, function(c) {
            return d3.max(c.values, function(d) {
                return d.proficiency + .10});
                })
            ]);

          x.domain(years);

          svg.select("g.x.axis")
            .transition()
            .duration(250)
            .call(xAxis)
            .call(g => {
              g.selectAll("text")
                .style("text-anchor", "middle")
              g.selectAll("line")
                .attr('stroke', '#A9A9A9')
              g.select(".domain")
                .attr('stroke', '#A9A9A9')
              })
            .attr('display', 'block')

          svg.select("g.y.axis")
            .transition()
            .duration(250)
            .call(yAxis)
            .call(g => {
              g.selectAll("text")
              g.selectAll("line")
                .attr('stroke', '#A9A9A9')
                .attr('stroke-width', 0.7)
                .attr('opacity', 0.3)
            g.select(".domain").remove()
            })
            .attr('display', 'block')

          // remove y-axis line
          svg.selectAll(".y.axis").select('.domain').remove()

          // this seems like a kludge
          legendContainer.selectAll('.legend').remove()
          legendContainer.attr('display', 'block');

          const fontWidth = 6;
          const rectOffset = 10;

          var legend = legendContainer.selectAll('.legend')
            .data(dataByCategory)
              .enter().append('g')
              .attr('class', 'legend');

          legend.append('rect')
            .attr("x", function(d, i) {
              var xPost = legendXPosition(d.id, i, fontWidth);
              return xPost;
            })
            .attr('y', 30)
            .attr('width', 8)
            .attr('height', 8)
            .style('fill', function (d) {
              return colors[d.id];
            });

          legend.append("text")
            .attr("x", function(d, i) {
              var xPost = legendXPositionText(d.id, i, rectOffset, fontWidth);
              return xPost;
            })
            .attr('y', 37)
            .style("font-size", 10)
            .style('fill', function (d) {
              return colors[d.id];
            })
            .text(function (d) {
              return d.id;
            })

// TODO: LEGEND PLACEMENT SUUUUUUCCCCKKKSSS
// TODO: Make the legend responsive? May need to make this a function and re-run it
// TODO: steps, 1) build horizontal legend; 2) break the line if necessary;
// TODO: 3) calculate center based on current svg; 4) ADD to WIDTH resize function
// https://stackoverflow.com/questions/49454761/how-to-horizontally-centre-a-responsive-multi-line-legend-in-d3

          // base xOffset is the starting x position of the legendcontainer
          var legendStartX = d3.select(".legendcontainer").node().getCTM().e
          var xOffset = 0; 
          var row = 1;
          var y_pos = 0;
          const fontSize = 10;
          var rectWidth = 10; // start at 10 due to 0-based indexing
          var svgWidth = d3.select("svg")._groups[0][0].attributes[0].value

          // used to capture x,y coords for each legend item
          var legendHistory = [];

          svg.selectAll("g.legend")
            .attr("transform", function (d, i) {

              rectWidth = i * 10

              // getComputedTextLength() returns 0 if the text hasn't been rendered (e.g.,
              // on initial load of the app when focus is in another tab and display is
              // set to none for the academic_info page) - so we use a different utility
              // function (Browsertext) that uses built-in functionality in the HTML5 canvas
              // 2D context if xpos is 0
              var x_pos = d3.select(this).select("text").node().getComputedTextLength();

              if (x_pos == 0) {
                x_pos = BrowserText.getWidth(d.id, fontSize, "Inter, sans-serif")
              }

              // xOffset is the length of the string plus the xOffset value
              xOffset = xOffset + x_pos;

              // if the length of the string + the current xPosition exceeds
              // the width of the svg, we want to wrap to next line - the first
              // condition only triggers if the length of the string measured from
              // the current offset is longer than total width of svg.
              let boundingArea = 0;

              if (categories.length > 6) {
                boundingArea = svgWidth - 180
              }
              else {
                boundingArea = svgWidth - 100
              }

              if (xOffset + rectWidth >= boundingArea) {

                // reset xOffset to 0 plus length of moves string
                xOffset = legendStartX
                xOffset = xOffset + x_pos;

                // shift down 15 pixels
                y_pos = row * 15

                // NOTE: because this is a "group" translation, it doesn't directly impact
                // the rec/text position (x values) determined by legendXPosition functions.
                // Set x value back to left edge
                d3.select(this).select("rect").attr("x", 0)
                d3.select(this).select("text").attr("x", rectOffset)

                row+=1
              }
              else {
                // First row
                if (row == 1) {
                    y_pos = 0
                }
                else {

                  let rectWidth = parseInt(d3.select(this).select("rect")._groups[0][0].attributes[2].value)

                  // account for rect size and 12 pixel offset between rect and text
                  // add twice to text to account for prior and current offset
                  d3.select(this).select("rect").attr("x", rectWidth + rectOffset)
                  d3.select(this).select("text").attr("x", rectWidth + rectOffset + rectOffset)
                }
              };

              const finalXposition = (xOffset - x_pos + legendStartX);
              const finalYposition = y_pos;

              legendHistory.push({id: categories[i], x: finalXposition, y: finalYposition});

              // final translation is with respect to the initial translation of
              // the legendcontainer.
              return "translate(" + finalXposition + "," + finalYposition + ")"
            });

          // once the legend has been completed, do some calcs to shift the
          // legendcontainer to the middle of the svg.

          // tst[0].x is the x value for the first legend item
          // TODO: there has to be a better way to get this value
          const legendItemStartingX = legendHistory[0].x
          // the current x position of the legendcontainer
          const currX = d3.select(".legendcontainer").node().getBBox().x + legendItemStartingX
          // account for the initial X translation of the svg
          const initialSvgTranslate = 35
          // the width of the container
          const legendWidth = svg.selectAll(".legendcontainer").node().getBBox().width

          const shiftToCenter = (((svgWidth - legendWidth)/2) - currX) - initialSvgTranslate

          svg.selectAll(".legendcontainer")
            .attr('transform', "translate(" + shiftToCenter + "," + (height + (margin.bottom / 5)) +")");

          // Set up transition.
          const dur = 200;
          const t = d3.transition().duration(dur);

          // TODO: getting duplicate lines!
          // TODO: Testing getting rid of this extra layer
          // let lineGroupUpdate = svg.selectAll(".linechart-g")
          //   .data(dataByCategory)

          // lineGroupUpdate.selectAll(".linechart").remove()

          // let lineUpdate = lineGroupUpdate.selectAll(".linechart")
          // TODO: Testing getting rid of this extra layer

          let lineUpdate = svg.selectAll(".linechart")
            .data(dataByCategory)
            .join('g')
            .attr('class', 'linechart');

          svg.selectAll("path.lines").remove()

          var lines = lineUpdate.selectAll("path.lines")
            .data(dataByCategory)
            .join(
              enter => {
                enter.append('path')
                  .attr('class', 'lines')
                  .attr("fill", "none")
                  .style("stroke-width", function(d) { return "2"; })
                  .attr("stroke", function (d,i) { return colors[d.id]})
                  .attr("d", d => line(d.values))
                  .transition(t)
                  .attr("d", d => line(d.values));
              },
              update => {
                update
                  .transition(t)
                  .attr("d", d => line(d.values));
              },
              exit => exit.remove()
            );

          svg.selectAll("circle.circles").remove();

          const vals = flattenObject(dataByCategory)

          var circles = lineUpdate.selectAll("circle.circles")
            .data(vals)
            .join(
              enter => {
                enter.append('circle').attr('class', 'circles')
                  .attr("r", 3.5)
                  .style("fill", function (d,i) { return colors[d.id]})
                  .attr("cx", function (d,i,j) { return x(d.year) })
                  .attr("cy", function (d,i) { return x(d.proficiency) })
                  .transition(t)
                  .attr("cx", function (d,i) { return x(d.year)})
                  .attr("cy", function (d,i) { return y(d.proficiency)})
              },
              update => {
                update
                  .transition(t)
                  .attr("cx", function (d,i) { return x(d.year)})
                  .attr("cy", function (d,i) { return y(d.proficiency)})
              },
              exit => exit.remove()
            );

          svg.selectAll(".tipbox").remove()

          var tipBox = svg.selectAll(".tipbox")
            .data(dataByCategory)
            .enter().append('g')
            .attr('class', 'tipbox');

          tipBox.append('path')
            .style("fill", function (d,i) { return colors[d.id]})
            .attr('class', 'path');

          tipBox.append("text")
            .style("fill", "white")
            .style("font-size", 9)
            .style("font-weight", "500")
            .style("font-family", "font-family: 'Open Sans', verdana, arial, sans-serif")
            .attr("z-index", 99)
            .attr("dy", "0.35em")   // anchor text close to middle vertically
            .attr('class', 'text');

          svg.selectAll("rect.overlay").remove()

          // determine the actual height and width of svg and
          // sets the overlay to the same width/height
          svgAttributes = d3.select("g")._groups[0][0].parentNode.attributes
          svgWidth = svgAttributes.getNamedItem("width").value
          // const svgWidth = svgAttributes.getNamedItem("width").value
          const svgHeight = svgAttributes.getNamedItem("height").value

          var overlay = svg.append('rect')
            .attr("transform", "translate(-" + margin.left + ",-" + margin.top + ")")
            .attr("class", "overlay")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .on("mouseover", mouseOver)
            .on("mouseout", mouseOut)
            .on("mousemove", mouseMove)
          }
        } // end updateData

        updateWidth = function() {

          // width is passed in as window.innerWidth/2
          widthScale = width - margin.left - margin.right;

          // TODO: the "svg" variable is actually "g" so parentnode is the svg
          let svgParent = d3.select(svg._groups[0][0].parentNode)

          // TODO: need to figure out how to automate transformAdjust val
          transformAdjust = 80;
          svgParent.transition().duration(200).attr('width', widthScale + transformAdjust);

          // reset xScale range and redraw everything
          x.range([0, widthScale]);

          svg.select("g.x.axis")
            .transition()
            .duration(200)
            .call(xAxis);

          svg.select("g.y.axis")
            .transition()
            .duration(200)
            .call(yAxis.tickSizeInner(-widthScale));

          svg.selectAll("path.lines")
            .transition()
            .duration(200)
            .attr("d", d => line(d.values));

          svg.selectAll("circle.circles")
            .transition()
            .duration(200)
            .attr("cx", function (d,i) { return x(d.year)})
            .attr("cy", function (d,i) { return y(d.proficiency)});

          svg.select("rect.overlay").attr("width", width);

          // TODO: TESTING
          // base xOffset is the starting x position of the legendcontainer
          var legendStartX = d3.select(".legendcontainer").node().getCTM().e
          var xOffset = 0;
          var row = 1;
          var y_pos = 0;
          const fontSize = 10;
          var rectWidth = 10; // start at 10 due to 0-based indexing
          const origSvgWidth = d3.select("svg")._groups[0][0].attributes[0].value
          const percentChange = widthScale/origSvgWidth
          var svgWidth = widthScale
          const rectOffset = 10;

          // used to capture x,y coords for each legend item
          var legendHistory = [];

          svg.selectAll("g.legend")
            .attr("transform", function (d, i) {

              rectWidth = i * 10

              // getComputedTextLength() returns 0 if the text hasn't been rendered (e.g.,
              // on initial load of the app when focus is in another tab and display is
              // set to none for the academic_info page) - so we use a different utility
              // function (Browsertext) that uses built-in functionality in the HTML5 canvas
              // 2D context if xpos is 0
              var x_pos = d3.select(this).select("text").node().getComputedTextLength();

              if (x_pos == 0) {
                x_pos = BrowserText.getWidth(d.id, fontSize, "Inter, sans-serif")
              }

              // xOffset is the length of the string plus the xOffset value
              xOffset = xOffset + x_pos;

              // if the length of the string + the current xPosition exceeds
              // the width of the svg, we want to wrap to next line - the first
              // condition only triggers if the length of the string measured from
              // the current offset is longer than total width of svg.

              let boundingArea = 0;

              if (categories.length > 6) {
                boundingArea = svgWidth - (180 * percentChange)
              }
              else {
                boundingArea = svgWidth - (100 * percentChange)
              }

              if (xOffset + rectWidth >= boundingArea) {

                // reset xOffset to 0 plus length of moves string
                xOffset = legendStartX
                xOffset = xOffset + x_pos;

                // shift down 15 pixels
                y_pos = row * 15

                // NOTE: because this is a "group" translation, it doesn't directly impact
                // the rec/text position (x values) determined by legendXPosition functions.
                // Set x value back to left edge
                d3.select(this).select("rect").attr("x", 0)
                d3.select(this).select("text").attr("x", rectOffset)

                row+=1
              }
              else {
                // First row
                if (row == 1) {
                    y_pos = 0
                }
                else {

                  let rectWidth = parseInt(d3.select(this).select("rect")._groups[0][0].attributes[2].value)

                  // account for rect size and 12 pixel offset between rect and text
                  // add twice to text to account for prior and current offset
                  d3.select(this).select("rect").attr("x", rectWidth + rectOffset)
                  d3.select(this).select("text").attr("x", rectWidth + rectOffset + rectOffset)
                }
              };

              const rightPos = d3.select(this).select("text").node().getBoundingClientRect().right
              const leftPos = d3.select(this).select("text").node().getBoundingClientRect().left
              const txtWidth = d3.select(this).select("text").node().getBoundingClientRect().width
              let finalXposition = (xOffset - x_pos + legendStartX);
              let finalYposition = y_pos;

              legendHistory.push(
                {
                  index: i,
                  id: categories[i],
                  x: finalXposition,
                  y: finalYposition,
                  right: rightPos,
                  left: leftPos
                }
              );

              // // TODO: Test to push legends apart if they overlap?
              // if (i > 0) {
              //   if (legendHistory[i].y == legendHistory[i-1].y) {
              //     if (legendHistory[i].left < legendHistory[i-1].right) {
              //       // console.log("OVERLAP: " + legendHistory[i].id)
              //       const diff = legendHistory[i-1].right - legendHistory[i].left // not working
              //       finalXposition = finalXposition + 20;
              //     }
              //   }
              // }
              // final translation is with respect to the initial translation of
              // the legendcontainer.
              return "translate(" + finalXposition + "," + finalYposition + ")"
            });

          // once the legend has been completed, do some calcs to shift the
          // legendcontainer to the middle of the svg.

          // tst[0].x is the x value for the first legend item
          const legendItemStartingX = legendHistory[0].x
          // the current x position of the legendcontainer
          const currX = d3.select(".legendcontainer").node().getBBox().x + legendItemStartingX
          // account for the initial X translation of the svg
          const initialSvgTranslate = 35
          // the width of the container
          const legendWidth = svg.selectAll(".legendcontainer").node().getBBox().width

          const shiftToCenter = (((svgWidth - legendWidth)/2) - currX) - initialSvgTranslate

          svg.selectAll(".legendcontainer")
            .attr('transform', "translate(" + shiftToCenter + "," + (height + (margin.bottom / 5)) +")");
        };


    }); // end selection

    updateData();

  function mouseOver() {
    focus.style("display", null);
    d3.select(this.parentNode).selectAll('.tipbox')
      .style("display", null);
  }

  function mouseOut() {
    focus.style("display", "none");
    d3.select(this.parentNode).selectAll('.tipbox')
      .style("display", "none");
  }

  function mouseMove() {

    // used later for tipBox positioning
    var boxPosition = []

    // "that" is the svg; "those" is the transformed "g" element
    that = d3.select(this.parentNode)
    those = d3.select(this.parentNode)._groups[0][0]

    // get combined data from all path elements in the selection
    rawData = that.selectAll(".linechart").data()

    // get list of categories to add to dataByYear array
    columns = rawData.map(function(d) { return d.id });

    // function to convert into data by year
    var dataByYear = unprocessData(rawData)

    dataByYear['columns'] = columns

    // uses scaleQuantize() to create an inverse scale of an ordinal
    // scale (scalePoint in this case) - returns the element from the
    // scale that is closest to the mouse's x-position, even if the value
    // is out of bounds.
    // https://stackoverflow.com/questions/20758373/inversion-with-ordinal-scale
    var inverseModeScale = d3.scaleQuantize()
      .domain(x.range())
      .range(x.domain())

    var year = inverseModeScale(d3.mouse(those)[0]);
    var years = dataByYear.map(function(d) { return d.Year; });

    // data for the targeted year
    var yearData = dataByYear.find(obj => obj.Year === year)

    focus.attr("transform", "translate(" + x(year) + ",0)");

    /// tipbox with connecting arrow using svg path
    that.selectAll('.tipbox path')
      .style("opacity", 1)
      .attr( 'd', function(d) {

        // dataByCategory is the year, proficiency, and id for the selected
        // category. dataByCategory is undefined if there is no data for the
        // category for the year
        // YearData is "year, categories..." for all years
        dataByCategory = d.values.filter(d => d.year == year)[0];

        let tipboxRectOffset = 0,
            path = [],
            yStart,
            xStart;

        // changing these values shouldn't break anything
        var boxHeight = 26;
        var boxWidth = 36;

        // dataByYear does not have an ID field. DataCategory does except
        // when undefined, so we need to check.
        if (dataByCategory != undefined) {

          yStart = y(dataByCategory.proficiency);
          xStart = x(dataByCategory.year);

          // if the closest "year" to mouse position is equal to the
          // rightmost year (the closest to the right edge), flip the
          // tipbox to the left

          if (year == years[years.length-1]) {
            // https://yqnn.github.io/svg-path-editor/
            // left-> M xStart yStart l -8 3 l 0 10 l -36 0 l -0 -26 l 36 -0 l 0 10 l 8 3
            var topArrowH = -8
            var topArrowV = 3
            var topFrontH = 0
            var topFrontV = 10
            var topH = -boxWidth
            var topV = 0
            var rightH = 0
            var rightV = -boxHeight
            var bottomH = boxWidth
            var bottomV = 0
            var bottomFrontH = 0
            var bottomFrontV = 10
            var bottomArrowH = 8
            var bottomArrowV = 3
          }
          else {
            // right->  M xStart yStart l 8 -3 l 0 -10 l 36 0 l 0 26 l -36  0 l 0 -10 l -8 -3
            var topArrowH = 8
            var topArrowV = -3
            var topFrontH = 0
            var topFrontV = -10
            var topH = boxWidth
            var topV = 0
            var rightH = 0
            var rightV = boxHeight
            var bottomH = -boxWidth
            var bottomV = 0
            var bottomFrontH = 0
            var bottomFrontV = -10
            var bottomArrowH = -8
            var bottomArrowV = -3
          }

          // we don't want tipboxes to overlap, so we need to check the y position
          // of each point and determine if an offset is necessary given the height
          // of the tipbox (26px) and desired spacing (3px).
          boxPosition = []

          Object.keys(yearData).forEach((k, i) => {
            if (k != "Year") {
              positionInfo = {}
              positionInfo.id = k
              positionInfo.i = i
              positionInfo.y = y(yearData[k])
              positionInfo.shift = 0
              boxPosition.push(positionInfo)
              }
          });

          boxPosition.sort(function(a,b) {return a.y - b.y; });

          // https://stackoverflow.com/questions/35757899/how-to-avoid-overlapping-tooltips-of-multi-series-line-chart-d3-js
          // NOTE: this shifts everything down. It would take a more complicated algorithm
          // to shift the boxes either up or down depending on their vertical position
          const tipboxSpacing = 3;

          const tipboxTotalHeight = boxHeight + tipboxSpacing;

          boxPosition.forEach (function(p,i) {
            if (i > 0) {
              var last = boxPosition[i-1].y;
              boxPosition[i].shift = Math.max (0, (last + tipboxTotalHeight) - boxPosition[i].y);
              boxPosition[i].y += boxPosition[i].shift;
            }
          })

          boxPosition.sort(function(a,b) { return a.i - b.i; })

          tipboxRectOffset = boxPosition.filter(d => d.id == dataByCategory.id)[0].shift

          // build tooltip path shifting the y position of the tooltip up
          // or down based on the topArrow vertical position
          path = "M " + xStart + " " + yStart +
            " l " + topArrowH + " " + (topArrowV + tipboxRectOffset) +
            " l " + topFrontH + " " + topFrontV +
            " l " + topH + " " + topV +
            " l " + rightH + " " + rightV +
            " l " + bottomH + " " + bottomV +
            " l " + bottomFrontH + " " + bottomFrontV +
            " l " + bottomArrowH + " " + (bottomArrowV - tipboxRectOffset);

          return path
        }
      })
      .style('fill', function (d,i) {
        if (d) {
          return colors[d.id]
        }
      });

      that.selectAll('.tipbox text')
        .attr("x", function(d) {

          data = d.values.filter(d => d.year == year)[0];

          if (data != undefined) {

            // determine x position of the text based on the x position
            // of the left side of the tipbox path (the arrow), the width
            // of the tipbox (44 pixels), and the length of the str value
            // in pixels
            const tipboxPath = d3.select(this.parentNode).select("path.path");
            var tipboxLeftEdge = tipboxPath.node().getBBox().x

            // add 8 pixels to the width calculation to account for the
            // length of the connecting arrow (leftEdge is measured from
            // the tip of the arrow, not the edge of the first horizontal)
            var tipboxWidth = tipboxPath.node().getBBox().width + 8

            // get total pixel width of text string as it appears
            // in the text box (e.g., "52.1%","25.0%"")
            let num = (data.proficiency * 100).toFixed(1);
            const txtWidth = BrowserText.getWidth(`${num}%`, 9, "Inter, sans-serif")

            tipboxRectOffset = (tipboxWidth - txtWidth) / 2

            // adjustment when tipbox has been flipped to left
            if (year == years[years.length-1]) {
              var pathX = tipboxLeftEdge + tipboxRectOffset - 8;
            }
            // normal right-side tipbox
            else {
              var pathX = tipboxLeftEdge + tipboxRectOffset;
            }

            return pathX

          } else {
            return null
          }
        })
        .attr("y", function(d) {
          data = d.values.filter(d => d.year == year)[0];

          // shift the y position of the text
          if (data != undefined) {

            // boxPosition.y should give us the middle of the tipBox as adjusted
            // by any shifting. note, this assumes that dy is shifted to ensure
            // the text is middle anchored vertically
            let pathY = boxPosition.filter(d => d.id == data.id)[0].y;

            return pathY

          } else {

            return null

          }
        })
        .text(function(d) {
          data = d.values.filter(d => d.year == year)[0];
          if (data != undefined) {
            return d3.format(",.1%")(data.proficiency);
          }
          else {
            return null
          }
        });
      } // end mouseMove
    };  // chart fn

  // not sure we need all of these
  chart.data = function(value) {
      if (!arguments.length) return data;
      data = value;
      if (typeof updateData === 'function') updateData();
      return chart;
    };

  chart.subject = function(value) {
    if (!arguments.length) return subject;
    subject = value;
    if (typeof updateSubject === 'function') updateSubject();
    return chart;
  };

  chart.category = function(value){
    if (!arguments.length) return category;
    category = value;
    if (typeof updateCategory === 'function') updateCategory();
    return chart;
  };

  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    if (typeof updateWidth === 'function') updateWidth();
    return chart;
};

  chart.id = function(value){
    if (!arguments.length) return id;
    id = value;
    if (typeof updateId === 'function') updateId();
    return chart;
  };

  return chart;
  }; // end lineChart function


/// single line chart with tooltip (e.g., enrollmentChart) ///
function singleLine() {
// viewbox: https://jsfiddle.net/cexLbfnk/1/

  let defaultWidth = window.innerWidth/2 - 125;

  var margin = {top: 45, right: 35, bottom: 80, left: 35},
    width = defaultWidth - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom,
    focus,
    widthScale,
    updateData,
    updateWidth,
    y = d3.scaleLinear().range([height, 0]),
    x = d3.scalePoint().range([0, width]);
    // x = d3.scaleTime().range([0, width]);

  let data,
    id;

  var xAxis = d3.axisBottom()
    .scale(x)
    .tickSizeInner(0)
    .tickSizeOuter(0)
    .tickFormat(d3.format('.4'))
    .tickPadding([10]);

  var yAxis = d3.axisLeft()
    .scale(y)
    .ticks(5)
    .tickSizeInner(-width)
    .tickSizeOuter(0)
    .tickPadding([5]);

  var line = d3.line()
    .x(function(d) { return x(d.Year); })
    .y(function(d) { return y(d["Total Enrollment"]); });

  const color =  "#7b6888";

  function chart(selection) {

    selection.each(function () {

      const years = data.map(el => el.Year);

      x.domain(years);

      const minEnrollment = d3.min(data, function (d) { 
        return +d["Total Enrollment"];
      });
      const maxEnrollment = d3.max(data, function (d) { 
        return +d["Total Enrollment"];
      });

      y.domain([minEnrollment - 200, maxEnrollment + 200]);

      var dom = d3.select(this);

      var svg = dom.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("g")
        .attr("class", "x axis")
        .attr('transform', `translate(0,${ height })`)
        .style("font-size", 8)
        .style("font-family", "Inter, sans-serif")
        .attr("color", "#6783a9")
        .call(xAxis);

      svg.append("g")
        .attr('class', 'y axis')
        .style("font-size", 8)
        .style("font-family", "Inter, sans-serif")
        .attr("color", "#6783a9")
        .call(yAxis);

      // tooltip line
      focus = svg.append('g')
        .attr('class', 'focus')
        .style('display', 'none');

      focus.append('line')
        .attr('class', 'x-hover-line hover-line')
        .attr('y1' , 0)
        .attr('y2', height);

      tooltip = d3.select(this)
        .append("div")
        .attr('class', 'tooltip')
        .style("position", "absolute")
        .style('display', 'none')
        .style("background-color", "white")
        .style("font-size", "10px")
        .style("font-weight", "500")
        .style("font-family", "Inter, sans-serif")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "6px");

      updateData = function() {

        const years = data.map(el => el.Year);

        x.domain(years);

        const minEnrollment = d3.min(data, function (d) { 
          return +d["Total Enrollment"];
        });
        const maxEnrollment = d3.max(data, function (d) { 
          return +d["Total Enrollment"];
        });

        y.domain([minEnrollment-200, maxEnrollment+200]);

        svg.select("g.x.axis")
          .transition()
          .duration(250)
          .call(xAxis)
          .call(g => {
            g.selectAll("text")
              .style("text-anchor", "middle")
            g.selectAll("line")
              .attr('stroke', '#A9A9A9')
            g.select(".domain")
              .attr('stroke', '#A9A9A9')
            })
          .attr('display', 'block');

        svg.select("g.y.axis")
          .transition()
          .duration(250)
          .call(yAxis)
          .call(g => {
            g.selectAll("text")
              .style("text-anchor", "left")
            g.selectAll("line")
              .attr('stroke', '#A9A9A9')
              .attr('stroke-width', 0.7)
              .attr('opacity', 0.5)
            g.select(".domain")
              .attr('stroke', '#A9A9A9')
          })
          .attr('display', 'block');

        const dur = 200;
        const t = d3.transition().duration(dur);

        let lineUpdate = svg.selectAll(".linechart")
          .data([data])
          .join('g')
          .attr('class', 'linechart');

        svg.selectAll("path.lines").remove();

        var lines = lineUpdate.selectAll("path.lines")
          .data([data])
          .join(
            enter => {
              enter.append('path').attr('class', 'lines')
                .attr("fill", "none")
                .style("stroke-width", function(d) { return "2"; })
                .attr("stroke", color)
                .attr("d", function(d) { return line(d) })
                .transition(t)
                .attr("d", d => line(d));
            },
            update => {
              update
                .transition(t)
                .attr("d", d => line(d));
            },
            exit => exit.remove()
          );

        svg.selectAll("circle.circles").remove();

        var circles = lineUpdate.selectAll("circle.circles")
          .data(data)
          .join(
            enter => {
              enter.append('circle').attr('class', 'circles')
                .attr("r", 3.5)
                .style("fill", color)
                .attr("cx", function (d,i,j) { return x(d.Year) })
                .attr("cy", function (d,i) { return x(d["Total Enrollment"]) })
                .transition(t)
                .attr("cx", function (d,i) { return x(d.Year)})
                .attr("cy", function (d,i) { return y(d["Total Enrollment"])})
            },
            update => {
              update
                .transition(t)
                .attr("cx", function (d,i) { return x(d.Year)})
                .attr("cy", function (d,i) { return y(d["Total Enrollment"])})
            },
            exit => exit.remove()
          );

        svg.selectAll("rect.overlay").remove();

          // determine the actual height and width of the svg group and
          // set the overlay to the same width/height
          svgAttributes = d3.select("g")._groups[0][0].parentNode.attributes
          svgWidth = svgAttributes.getNamedItem("width").value
          const svgHeight = svgAttributes.getNamedItem("height").value

        var overlay = svg.append('rect')
          .attr("transform", "translate(-" + margin.left + ",-" + margin.top + ")")
          .attr("class", "overlay")
          .attr("width", svgWidth)
          .attr("height", svgHeight)
          .on("mouseover", mouseOver)
          .on("mouseout", mouseOut)
          .on("mousemove", mouseMove);

      } // end update Function

      updateWidth = function() {

        // width is passed in as window.innerWidth/2
        widthScale = width - margin.left - margin.right;

        let svgParent = d3.select(svg._groups[0][0].parentNode)
        transformAdjust = 80;
        svgParent.transition().duration(200).attr('width', widthScale + transformAdjust);

        // reset xScale range and redraw everything
        x.range([0, widthScale]);

        svg.select("g.x.axis")
          .transition()
          .duration(200)
          .call(xAxis);

        svg.select("g.y.axis")
          .transition()
          .duration(200)
          .call(yAxis.tickSizeInner(-widthScale));

        svg.select("path.lines")
          .transition()
          .duration(200)
          .attr("d", d => line(d));

        svg.selectAll("circle.circles")
          .transition()
          .duration(200)
          .attr("cx", function (d,i) { return x(d.Year)})
          .attr("cy", function (d,i) { return y(d["Total Enrollment"])});

        svg.select("rect.overlay").attr("width", widthScale + transformAdjust);

      };

    }) // end each

    updateData();

    function mouseOver() {
      focus.style("display", null);

      tooltip
        .style("display", "block");
      d3.select(this)
        .style("opacity", .5);
      d3.select(this.parentNode).selectAll('.tooltip')
        .style("display", null);
    };

    function mouseOut() {
      focus.style("display", "none");
      tooltip
        .style("display", "none");
    };

    function mouseMove() {

      // "this" is the rect
      // 'those' is the svg html element
      that = d3.select(this.parentNode);
      // those = d3.select(this.parentNode)._groups[0][0];
      those = d3.select("svg")._groups[0][0];

      // get combined data from all path elements in the selection
      data = that.select(".linechart").data();

      var years = data[0].map(function(d) { return d.Year; });

      data['columns'] = Object.keys(data);

      data = data[0];

      // TODO: ADJUST The bisection to fit single chart (see multiline)

      // NOTE: See explanation in multiline mouseMove
      var inverseModeScale = d3.scaleQuantize()
      .domain(x.range())
      .range(x.domain())

      // mouse position
      const x0 = inverseModeScale(d3.mouse(those)[0]);

      // const x0 = x.invert(d3.mouse(those)[0]);

      //bisect the data
      const j = (d3.bisect(years, x0, 1)) - 1;

      //get the two closest elements to the mouse
      const d0 = data[j];
      const d1 = data[j+1];

      //check which one is actually the closest
      let distance = x0 - d0.Year;

      // don't need to shift demographic data because it has 2020 data
      let center = .5
      let year;

      if (distance < center) {
        yearData = d0
        year = d0.Year
      }
      else {
        yearData = d1
        year = d1.Year
      };

      focus.attr("transform", "translate(" + x(year) + ",0)");

      var html = `<span style='font-size: 1em; color: ${color};'>
        Total Enrollment:&nbsp&nbsp${yearData["Total Enrollment"]}</span>`;

      tooltip
        .html(html)
        .style("top", function (d) {

          // boxTop + y() places the tooltip directly on the circle
          // so we shift a bit
          const boxTop = that.node().getBoundingClientRect().top
          const shiftUp = 35;

          return y(yearData["Total Enrollment"]) + boxTop - shiftUp + "px"})

        .style("left", function (d) {

          // leftEdge is the left edge of the dom element in
          // the browser
          let leftEdge = that.node().getBoundingClientRect().x
          let boxWidth = that.node().getBoundingClientRect().width
          var rightEdge = leftEdge + boxWidth;

          //base x position is right on circle - we want
          // to shift a bit to the right
          const shiftRight = 25;
          const xPos = leftEdge + x(yearData["Year"]) + shiftRight;

          // tooltip is 120px wide, so add half of the width to the check
          // if tooltip would go over right edge, shift it back by the
          // width of the tooltip (the "-10" shifts it just to the left
          // of the focus line for style purposes)
          const tooltipWidth = 120;

          if ((xPos + (tooltipWidth/2)) > rightEdge) {
            return xPos - tooltipWidth - 10 + "px"
          }
          else {
            return xPos  + "px"
          }
        })

      }; // end mouseMove
  }; // end selection

  chart.data = function(value) {
    if (!arguments.length) return data;
    data = value;
    if (typeof updateData === 'function') updateData();
    return chart;
  };

  chart.id = function(value){
    if (!arguments.length) return id;
    id = value;
    if (typeof updateId === 'function') updateId();
    return chart;
  };

  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    if (typeof updateWidth === 'function') updateWidth();
    return chart;
};

  return chart;
}; // end simpleLineChart function


// Enrollment by Ethnicity/Subgroup (demographic page)
function horizontalGroupBar() {

  let defaultWidth = window.innerWidth/2 - 125;

  var margin = {top: 45, right: 20, bottom: 25, left: 50},
    width = defaultWidth - margin.left - margin.right,
    height = 380 - margin.top - margin.bottom,
    widthScale,
    updateData,
    updateWidth,
    x = d3.scaleLinear().range([0, width]),
    y0 = d3.scaleBand().range([0, height]).padding(.1),
    y1 = d3.scaleBand().padding(0.05);

  let data,
      id;

  var xAxis = d3.axisBottom()
    .scale(x)
    .ticks(5)
    .tickPadding(6)
    .tickFormat(d3.format(".0%"));

  var yAxis = d3.axisLeft()
    .scale(y0)
    .ticks(null, "s");

  const colorList =  ["#74a2d7", "#df8f2d"];

  function chart(selection) {

    selection.each(function () {

      let selectedYear;
      let yearString;
      let titleText = "";

      const chartData = data[0]
      const missingString = data[1] // not currently needed

      const categoryKeys = Array.from(chartData).map(d => d[0]);
      const entityKeys = Array.from(Array.from(chartData)[0][1]).map(d=>d[0]);

      x.domain([0, 1]).nice();
      y0.domain(categoryKeys);
      y1.domain(entityKeys).range([0, y0.bandwidth()]);

      const elementID = "#" + id;

      var dom = d3.select(elementID);

      var svg = dom.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
          .style("font-size", 8)
          .style("font-family", "Inter, sans-serif")
          .attr("color", "#6783a9");

      svg.append("g")
        .attr('class', 'y axis')
        .call(yAxis)
        .selectAll("text")
          .style("font-size", 8)
          .style("font-family", "Inter, sans-serif")
          .attr("color", "#6783a9");

      var legendContainer = svg.append('g')
        .attr('class', 'legendcontainer')
        .attr('transform', "translate(" + -(margin.left/4) + "," + -(margin.top) +")");

      // chart end-note
      var endtext = svg.append("g")
        .attr("class", "endtext");

      endtext.append("text")
        .attr('class', 'endnote')
        .style("fill", "steelblue")
        .style("font-size", 10);

      var title = svg.append("g");

      // title is positioned with respect to the svg, but we want
      // to position it with respect to the parent container - so
      // we get parent container width and left offset
      let divWidth = dom._groups[0][0].parentElement.clientWidth;
      let divElement = document.getElementById(id).parentElement;
      let paddingLeft = parseInt(getComputedStyle(divElement).paddingLeft);

      let xShift = paddingLeft/2;
      let rectWidth = divWidth - ((margin.left + margin.right) * 2);
      let textShift = (rectWidth / 2) - paddingLeft;

      title.append("rect")
        .classed("titlerect", true)
        .attr("width", rectWidth)
        .attr("x", -xShift)
        .attr("y", -70)
        .attr("rx", 5)
        .style("fill", "#6783a9")
        .attr("height", "30px");

      selectedYear = document.getElementById("yearSelect").value;

      yearString = longYear(selectedYear);

      if (exists(data[0], 'Free or Reduced Price Meals')) {
        titleText = ["Enrollment by Subgroup (" + yearString +")"]
      }
      else {
        titleText = ["Enrollment by Ethnicity (" + yearString +")"]
      };

      title.append("text")
        .classed("title", true)
        .attr("fill", "white")
        .style("font-weight", 700)
        .attr("font-size", "12px")
        .style("font-family", "Inter, sans-serif")
        .style('text-anchor','middle')
        .style('alignment-baseline', 'middle')
        .attr('dx', textShift)
        .attr('y', -55)
        .text(titleText);

      updateData = function() {

        // svg.select("#" + id)

        const chartData = data[0]
        const missingString = data[1]

        const categoryKeys = Array.from(chartData).map(d => d[0]);
        const entityKeys = Array.from(Array.from(chartData)[0][1]).map(d=>d[0]);

        x.domain([0, 1]).nice();
        y0.domain(categoryKeys);
        y1.domain(entityKeys).range([0, y0.bandwidth()]);

        let color = d3.scaleOrdinal()
          .domain(entityKeys)
          .range(colorList);

        const dur = 200;
        const t = d3.transition().duration(dur);

        svg.select("g.x.axis")
          .transition(t)
          .call(xAxis)
          .call(g => {
            g.select(".domain").remove()
          });

        svg.select("g.y.axis")
          .transition(t)
          .call(yAxis)
          .call(g => {
            g.select(".domain").remove()
          });

        setTimeout(() => {
          svg.select("g.y.axis")
            .selectAll(".tick text")
            .style("font-size", 10)
            .style("font-family", "Inter, sans-serif")
            .attr('dy', 0)
            .call(wrap, 60);
        }, 0);

        legendContainer.selectAll('.legend').remove();
        legendContainer.attr('display', 'block');

        // transform is handled below to allow for legend to wrap
        const fontWidth = 6;
        const rectOffset = 12;

        var legend = legendContainer.selectAll('.legend')
          .data(entityKeys)
          .enter().append('g')
          .attr('class', 'legend');

        legend.append('rect')
          .attr("x", function(d, i) {
            const xPost = legendXPosition(d, i, fontWidth);
            return xPost;
          })
          .attr('y', 20)
          .attr('width', 8)
          .attr('height', 8)
          .style('fill', function (d) {
            return color(d);
          });

        legend.append("text")
          .attr("x", function(d, i) {
            const xPost = legendXPositionText(d, i, rectOffset, fontWidth);
            return xPost;
          })
          .attr('y', 27) // shifts text to middle of rect
          .style("font-size", 10)
          .style('fill', "#6783a9")
          .text(function (d) {
            return d;
          });

        // offset legend labels from one another
        var x_offset = 0
        var row = 1;
        var y_pos = 0;
        const fontSize = 10;

        svg.selectAll("g.legend")
          .attr("transform", function (d, i) {

            var x_pos = d3.select(this).select("text").node().getComputedTextLength();

            if (x_pos == 0) {
              x_pos = BrowserText.getWidth(d.id, fontSize, "Inter, sans-serif")
            }

            // width of svg
            const svgWidth = d3.select("svg")._groups[0][0].attributes[0].value

            // offset is the length of the string plus the previous offset value
            x_offset = x_offset + x_pos;

            // if the length of the string + the current xposition exceeds
            // the width of the svg, we want to wrap to next line - the first
            // condition only triggers if the length of the string measured from
            // the current offset is longer than total width of svg.
            if ((svgWidth - x_offset) <= x_pos ) {

              // reset x_offset to 0 (back to left side)
              x_offset = 0
              x_offset = x_offset + x_pos;

              // shift down 15 pixels
              y_pos = row * 15

              // NOTE: because this is a "group" translation, it doesn't directly impact
              // the rec/text position (x values) determined by legendXPosition functions.
              // Set x value back to left edge
              d3.select(this).select("rect").attr("x", 0)
              d3.select(this).select("text").attr("x", rectOffset)

              row+=1
            }
            else {
              // First row
              if (row == 1) {
                  y_pos = 0
              }
              else {

                let rectWidth = parseInt(d3.select(this).select("rect")._groups[0][0].attributes[2].value)

                // account for rect size and 12 pixel offset between rect and text
                // add twice to text to account for prior and current offset
                d3.select(this).select("rect").attr("x", rectWidth + rectOffset)
                d3.select(this).select("text").attr("x", rectWidth + rectOffset + rectOffset)
              }
            };
            return "translate(" + (x_offset - x_pos) + "," + y_pos + ")"
          });

        let barUpdate = svg.selectAll(".groupedbar")
          .data([chartData])
          .join('g')
          .attr('class', 'groupedbar');

        let bars = barUpdate.selectAll("g")
          .data(chartData)
          .join("g")
            .attr("transform", function(d) { return `translate(0,${y0(d[0])})` })
          .selectAll("rect")
          .data(function (d) { return d[1] })
          .join("rect")
            .attr('class', 'bars')
            .transition(t)
            .attr("x", function(d) { return x(0) })
            .attr("y", function (d) { return y1(d[0]) })
            .attr("height", y1.bandwidth())
            .attr("width", function (d) { return x(d[1])} )
            .attr("fill", function(d) {return color(d[0])});

        labels = barUpdate.selectAll("g")
          .data(chartData)
          .join("g")
          .selectAll("text")
          .data(function (d) { return d[1] })
          .join("text")
          .attr('class', 'label')
          .attr("x", function(d) {
            return x(d[1]) + 5;
          })
          .attr("fill", function(d) {
            return color(d[0])
          })
          .attr("y", function(d, i) {
            return y1(d[0]) + y0.bandwidth()/4;
          })
          .style("font-size", 10)
          .style("font-family", "Inter, sans-serif")
          .text(function(d, i) {
            return d3.format(".2%")(d[1]);
          });

        svg.selectAll("text.endtext").remove();

        if (missingString.length > 0) {
          endnote = [missingString]

          endtext.selectAll(".endnote")
            .data(endnote, function(d) { return d })
            .enter()
            .append("text")
              .style("fill", "steelblue")
              .style("font-size", 10)
              .attr("x", -(margin.right*2))
              .attr("y", height + 40)
              .attr("class","endtext")
              .style("font-weight", 300)
              .text(function(d) { return d })
              .call(wrap, width + margin.right);
        };

        // update title
        let selectedYear = document.getElementById("yearSelect").value;
        let yearString = longYear(selectedYear);

        if (exists(data[0], 'Free or Reduced Price Meals')) {
          titleText = ["Enrollment by Subgroup (" + yearString +")"]

        }
        else {
          titleText = ["Enrollment by Ethnicity (" + yearString +")"]
        };

        svg.selectAll("text.title").remove();
        svg.selectAll("rect.titlerect").remove();

        divWidth = dom._groups[0][0].parentElement.clientWidth;
        divElement = document.getElementById(id).parentElement;
        paddingLeft = parseInt(getComputedStyle(divElement).paddingLeft);
  
        xShift = paddingLeft/2;
        rectWidth = divWidth - ((margin.left + margin.right) * 2);
        textShift = (rectWidth/2) - xShift;

        title.append("rect")
          .attr("width", rectWidth)
          .attr("x", -xShift)
          .attr("y", -70)
          .attr("rx", 5)
          .style("fill", "#6783a9")
          .attr("height", "30px");

        title.append("text")
          .classed("title", true)
          .attr("fill", "white")
          .style("font-weight", 700)
          .attr("font-size", "12px")
          .style("font-family", "Inter, sans-serif")
          .style('text-anchor','middle')
          .style('alignment-baseline', 'middle')
          .attr('dx', textShift)
          .attr('y', -55)
          .text(titleText);

      }; // end update Function

      updateWidth = function() {

        // width is passed in as window.innerWidth/2
        widthScale = width - margin.left - margin.right;

        let actualSvg = d3.select(svg._groups[0][0].parentNode);

        transformAdjust = 80;
        actualSvg.transition().duration(250).attr('width', widthScale + transformAdjust);

        // reset xScale range and redraw everything
        x.range([0, widthScale]);

        svg.select("g.x.axis")
          .transition()
          .duration(250)
          .call(xAxis);

        svg.selectAll("rect.bars")
          .transition()
          .duration(250)
          .attr("x", function(d) { return x(0) })
          .attr("width", function (d) { return x(d[1]) });

        svg.selectAll("text.label")
          .transition()
          .duration(150)
          .attr("x", function(d) { return x(d[1]) + 5;});

        // the containing div will always be 70 pixels wider than the svg post
        // transition (because of 35px padding on the div). the rect is attached to
        // the svg group so we need to adjust to account for the width change.
        // even so, the rect is off center, manual adjustment fixes, but I'd 
        // prefer a more organic situation
        const svgWidth = widthScale + transformAdjust;
        // const containerWidth = svgWidth + 70;
        // const manualAdjustment = 7;
        // const xVal = ((containerWidth - svgWidth) / 4) - manualAdjustment;
 
        divElement = document.getElementById(id);

        paddingLeft = parseInt(getComputedStyle(divElement.parentElement).paddingLeft);
        let divPadding = paddingLeft * 2;
        let divWidth = divPadding + svgWidth;

        // console.log(svgWidth)
        // console.log(widthScale)
        // console.log(divWidth - svgWidth)

        // TODO: CANNOT GET WIDTH CORECT

        xShift = paddingLeft/2;
        rectWidth = divWidth - ((margin.left + margin.right) * 2); // this is arbitrary
        textShift = (rectWidth/2) - xShift;
        console.log(divWidth)
        console.log(rectWidth)

        // TODO: DOUBLE RECTS ARE ADDED
        svg.selectAll("text.title").remove();
        svg.selectAll("rect.titlerect").remove();

        title.select("rect")
          .transition()
          .duration(0)
          .attr("width", rectWidth) // 
          .attr("x", 0); //-xShift);
          // .attr("width", (widthScale))
          // .attr("x", -xVal) 

        svg.select("text.titletext")
        .transition()
        .duration(0)
        .attr("font-size", function(d) {
          if (widthScale < 180) {
            return "8px"
          }
          else if (widthScale < 230) {
            return "10px"
          }
          else {
            return "12px"
          }
        })
        .attr('dx', textShift)
        // no idea how I came up with this formula
        // .attr('dx', function(d) {
        //   return (widthScale + margin.left + margin.right)/2 - margin.left + manualAdjustment
        // });

        // TODO: Adjust x (higher) dynamically, somehow
        svg.selectAll("text.endtext")
          .attr("x", -(margin.right*2))
          .text(function(d) { return d })
          .call(wrap, widthScale + margin.right);
    };
    }); // end each

    updateData();

  }; // end selection

  chart.data = function(value) {
    if (!arguments.length) return data;
    data = value;
    if (typeof updateData === 'function') updateData();
    return chart;
  };

  chart.id = function(value){
    if (!arguments.length) return id;
    id = value;
    if (typeof updateId === 'function') updateId();
    return chart;
  };

  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    if (typeof updateWidth === 'function') updateWidth();
    return chart;
};

  return chart;
}; // end horizontalGroupBarChart


/* Proficiency Breakdown charts */
function horizontalStackedBar() {

  var margin = {top: 15, right: 25, bottom: 15, left: 60},
    width = 540 - margin.left - margin.right,
    height = 380 - margin.top - margin.bottom,
    updateData,
    focus,
    categories,
    colors,
    x = d3.scaleLinear().domain([0, 1]).range([0, width]),
    y = d3.scaleBand().range([0, height]).padding(.3);

  let data,
    id;

  var colors = {};
  const colorList = ["#df8f2d", "#ebbb81", "#96b8db", "#74a2d7"];
  
  // const manualAdjustment = 7;

  var yAxis = d3.axisLeft(y).tickSize(0).tickPadding(8);

  function chart(selection){

    selection.each(function () {

      let barData = data[0];
      let selectedYear = data[2];

      categories = barData.columns.slice(1);

      categories.forEach((category, i) => colors[category] = colorList[i]);

      y.domain(barData.map(d => d.Category));

      var dom = d3.select(this);
      let id = dom._groups[0][0].id;

      var svg = dom.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("transform", `translate(${margin.left}, 0)`);

      svg.append("g")
        .attr('class', 'y axis')
        .style("font-size", 8)
        .style("font-family", "Inter, sans-serif")
        .attr("color", "#6783a9")
        .call(yAxis)
        .call(d => d.select(".domain").remove())
        .attr("transform", `translate(0, 20)`);

      var title = svg.append("g");

      // this is how we center the title rect: get width of svg and the "x"
      // transform value. Get the difference between the svg width and the rect
      // width, divide it by two and subtract the transform value
      let svgWidth = dom.select("svg").attr("width");
      let svgTransform = dom.select("svg").node().transform.baseVal.consolidate().matrix.e;
      let rectWidth = (width + margin.left + margin.right)/2;
      let xShift = (svgWidth - rectWidth)/2 - svgTransform;
      let textShift = (svgWidth / 2) - svgTransform;

      title.append("rect")
        .attr("width", rectWidth)
        .attr("x", xShift)
        .attr("rx", 5)
        .style("fill", "#6783a9")
        .attr("height", "30px");

      title.append("text")
        .classed("title", true)
        .attr("fill", "white")
        .style("font-weight", 700)
        .attr("font-size", "12px")
        .style("font-family", "Inter, sans-serif")
        .style('text-anchor','middle')
        .style('alignment-baseline', 'middle')
        .attr('dx', textShift)
        .attr('dy', 16)
        .text("Proficiency Breakdown (" + selectedYear +")");

      // apply translate to all barstack items (including axis) to
      // make room for title
      var barstack = svg.append("g")
        .attr('class', 'barstack')
        .attr('id', id)
        .attr("transform", `translate(0, 20)`);

      var endtext = svg.append("g")
        .attr("class", "endtext");

      endtext.append("text")
        .attr('class', 'endnote')
        .style("fill", "steelblue")
        .style("font-size", 10);

      focus = svg.append('g')
        .attr('class', 'focus')
        .style('display', 'none');

      focus.append('line')
        .attr('class', 'hover-back-line')
        .attr('x1', 0)
        .attr('x2', width+10);

      focus.append('line')
        .attr('class', 'hover-line')
        .attr('x1', 0)
        .attr('x2', width+10);

      // TODO: This is incorrect somehow - making div the parent causes
      // TODO: location to be measured from browser rather than element
      var tooltipContainer = d3.select("#" + id);

      var tooltip = tooltipContainer.append("div")
        .style("position", "absolute")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("width", "200px")
        .style("height", "80px")
        .style("background-color", "white")
        .style("font-size", "10px")
        .style("font-family", "Inter, sans-serif")
        .style("text-align", "left")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px");
      
      const mouseOver = function(d) {

        focus.style("display", null);

        tooltip
          .style("opacity", 1);

        d3.select(this)
          .style("opacity", .5);

      };

      const mouseMove = function(event,d) {

        const datum = d3.select(this).datum().data;

        var html = "";
        const f = d3.format(",.2%");

        let z = 0;
        for (const k in datum) {
          if (k !== "Category") {
            html += `<span style='font-size: 1em; color: ${colorList[z]};'><i class='fa fa-square center-icon'></i></span>&nbsp&nbsp&nbsp${k}: ${d3.format(",.2%")(datum[k])}<p>`
            z++
          };
        };

        // find the top ("y") coordinate of the selected rect and half
        // the height - we want focus bar in the middle of the rect
        let ywhere = parseFloat(d3.select(this).attr("y"));
        let halfheight = parseFloat(d3.select(this).attr("height")) / 2;

        // text y var is already located in middle and text does not
        // have a height var so will show up as NaN - so we sub 0
        if (isNaN(halfheight)) { halfheight = 0 };

        // add 20 to account for barstack translate
        const why = ywhere + halfheight + 20;

        focus
          .attr("transform", "translate(0," + why + ")")
          .style("z-index", "99");

        // TODO: find way to get position from selected rather than
        // TODO: position of svg from top of screen - none of the
        // TODO: usual (getBoundingClientRec, bbox, etc.) work

        // the offset from the top of the screen to the top of the svg
        let that = d3.select("#" + id)._groups[0][0].offsetTop;

        tooltip.html(html)
          .style("top", that + why - 120 + "px")
          .style("left", (d3.mouse(this)[0]+120) + "px")

      };

      const mouseLeave = function(d) {
        focus.style("display", "none");
        tooltip
            .style("opacity", 0);

        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 1);
      };

      updateData = function() {

        const stack = d3.stack()
          .keys(categories)
          .order(d3.stackOrderNone)
          .offset(d3.stackOffsetNone);

        let barData = data[0];
        let insufficient = data[1];
        let selectedYear = data[2];

        var endnote = "";
        if (insufficient.length > 0) {
          endnote = [insufficient.join(", ") + "."]
        };

        const stackedData = stack(barData);

        categories = barData.columns.slice(1);
        categories.forEach((category, i) => colors[category] = colorList[i]);

        y.domain(barData.map(d => d.Category));

        svg.select("g.y.axis")
          .transition()
          .duration(250)
          .call(yAxis)
          .call(g => {
            g.selectAll("text")
            g.selectAll("line")
              .attr('stroke', '#A9A9A9')
              .attr('stroke-width', 0.7)
              .attr('opacity', 0.3)
          g.select(".domain").remove()
          })
          .attr('display', 'block')
          .attr("transform", `translate(0, 20)`);

        setTimeout(() => {
          svg.select("g.y.axis")
            .selectAll(".tick text")
            .style("font-size", 10)
            .style("font-family", "Inter, sans-serif")
            .attr('dy', 0)
            .call(wrap, 60);
        }, 0);

        const dur = 200;
        const t = d3.transition().duration(dur);

        barstack.selectAll("g")
          .data(stackedData)
          .join(
            enter => enter
              .append("g")
              .attr("fill", function (d,i) { return colors[d.key]}),
            null, // no update function here
            exit => {
              exit
                .transition()
                .duration(dur / 2)
                .style("fill-opacity", 0)
                .remove();
            }
          )
          .selectAll("rect")
          .data(d => d)
          .join(
            enter => enter
              .append("rect")
              .attr("class", "bar")
              .attr("x", function(d) { return x(d[0])})
              .attr("y", function(d,i) {
                return y(d.data.Category)
              })
              .attr("width", function(d) { return x(d[1]) - x(d[0])})
              .attr("height",function(d) { return y.bandwidth() })
              .on("mouseover", mouseOver)
              .on("mousemove", mouseMove)
              .on("mouseleave", mouseLeave),
            null,
            exit => {
              exit
                .transition()
                .duration(dur / 2)
                .style("fill-opacity", 0)
                .remove();
            }
          )
          .transition(t)
          .delay((d, i) => i * 20)
          .attr("x", function(d) { return x(d[0])})
          .attr("y", function(d,i) { return y(d.data.Category) })
          .attr("width", d => x(d[1]) - x(d[0]))
          .attr("height",function(d) { return y.bandwidth() });

        barstack.selectAll("g")
          .data(stackedData)
          .join(
            enter => enter
              .append("g"),
            null,
            exit => {
              exit
                .transition()
                .duration(dur / 2)
                .text("")
                .remove();
            }
          )
          .selectAll("text")
          .data(d => d)
          .join(
            enter => enter
              .append("text")
              .attr("class", "bartext")
              .text(function(d ,i) {
                const val = (d[1]-d[0]);
                if (val < .1) { return "" }
                else { return d3.format(",.2%")(val) }
              })
              .attr("text-anchor", "middle")
              .style("fill", "steelblue")
              .style("font-size", 10)
              .attr("y", function(d,i) { return y(d.data.Category) + (y.bandwidth()/2)})
              .attr("dy", function(d) {
                return ".5em"
              })
              .attr("x", function(d) { return (x(d[0]) + x(d[1]))/2}),
              null,
              exit => {
                exit
                  .transition()
                  .duration(dur / 2)
                  .text("")
                  .remove();
              }
          )
          .transition(t)
          .delay((d, i) => i * 20)
          .text(function(d ,i) {
            const val = (d[1]-d[0]);
            if (val < .1) { return "" }
            else { return d3.format(",.2%")(val) }
          })
          .attr("y", function(d,i) {
            return y(d.data.Category) + (y.bandwidth()/2)
          })
          .attr("dy", function(d) {
            return ".5em"
          })
          .attr("x", function(d) { return (x(d[0]) + x(d[1]))/2});

          svg.selectAll("text.endtext").remove();
          svg.selectAll(".endline").remove();

          if (endnote.length > 0) {

            svg.append("line")
              .attr("class","endline")
              .style("stroke", "steelblue")
              .style('shape-rendering','crispEdges')
              .style("opacity", 0.5)
              .attr("x1", -20)
              .attr("y1", height+15)
              .attr("x2", width/2 + 75)
              .attr("y2", height+15);

            endtext.selectAll(".endnote")
              .data(endnote, function(d) { return d })
              .enter()
              .append("text")
              .style("fill", "steelblue")
              .style("font-size", 10)
              .attr("y", height + 30)
              .attr("dx", -20)
              .attr("class","endtext")
              .style("font-weight", 700)
              .text("Insufficient N-Size: ")
              .append("tspan")
              .style("font-weight", 300)
              .text(function(d) { return d });
          };

          svg.selectAll("text.title").remove();

          svgWidth = dom.select("svg").attr("width");
          svgTransform = dom.select("svg").node().transform.baseVal.consolidate().matrix.e;
          rectWidth = (width + margin.left + margin.right)/2;
          xShift = (svgWidth - rectWidth)/2 - svgTransform;
          textShift = (svgWidth / 2) - svgTransform;

          title.append("rect")
          .attr("width", rectWidth)
          .attr("x", xShift)
          .attr("rx", 5)
          .style("fill", "#6783a9")
          .attr("height", "30px");

          title.append("text")
            .classed("title", true)
            .attr("fill", "white")
            .style("font-weight", 700)
            .attr("font-size", "12px")
            .style("font-family", "Inter, sans-serif")
            .style('text-anchor','middle')
            .style('alignment-baseline', 'middle')
            .attr('dx', textShift)
            .attr('dy', 16)
            .text("Proficiency Breakdown (" + selectedYear +")");
        }; // end Update
      }); // end each

      updateData();

    }; // end stackedBar chart

    // getter and setter methods
  chart.data = function(value) {
    if (!arguments.length) return data;
    data = value;
    if (typeof updateData === 'function') updateData();
    return chart;
  };

  chart.id = function(value){
    if (!arguments.length) return id;
    id = value;
    if (typeof updateId === 'function') updateId();
    return chart;
  };

  return chart;
}; // end stackedBar


// Analysis Grouped Bar //
// https://dataviz.unhcr.org/tools/d3/d3_grouped_column_chart.html
// https://nocommandline.com/blog/building-a-responsive-d3-js-chart/
function verticalGroupBar() {
  var margin = {top: 45, right: 20, bottom: 25, left: 40},
    width = 1000 - margin.left - margin.right,
    height = 360 - margin.top - margin.bottom,
    fontSize = 10,
    updateData,
    y = d3.scaleLinear().range([height, 0]),
    x0 = d3.scaleBand().range([0, width]).padding(.1),
    x1 = d3.scaleBand().padding(0.05);

  let data,
      id;

  var xAxis = d3.axisBottom()
    .scale(x0)
    .ticks(null, "s");

  var yAxis = d3.axisLeft()
    .scale(y)
    .ticks(5)
    .tickPadding(6)
    .tickFormat(d3.format(".0%"));

  function chart(selection) {

    selection.each(function () {

      let chartData = data;

      const categoryKeys = Array.from(chartData).map(d => d[0]);
      const entityKeys = Array.from(Array.from(chartData)[0][1]).map(d=>d[0]);


      y.domain([0, 1]).nice();
      x0.domain(categoryKeys);
      x1.domain(entityKeys).range([0, x0.bandwidth()]);

      var dom = d3.select("#" + id);

      var svg = dom.append("svg")
        .attr("viewBox", "0 0 600 360")
        .attr("preserveAspectRatio", "xMinYMin")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
          .style("font-size", 8)
          .style("font-family", "Inter, sans-serif")
          .attr("color", "#6783a9");

      svg.append("g")
        .attr('class', 'y axis')
        .call(yAxis)
        .selectAll("text")
          .style("font-size", 8)
          .style("font-family", "Inter, sans-serif")
          .attr("color", "#6783a9");

      var tooltipContainer = d3.select(this);

      var tooltip = tooltipContainer.append("div")
        .attr('class', 'bartooltip')
        .style("position", "absolute")
        .style('display', 'none')
        .style("background-color", "white")
        .style("font-size", fontSize + "px")
        .style("font-weight", "500")
        .style("height", "20px")
        .style("font-family", "Inter, sans-serif")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("padding-right", "4px")
        .style("padding-left", "5px")
        .style("padding-top", "2px")
        .style("padding-bottom", "8px");

      // var legendContainer = svg.append('g')
      //   .attr('class', 'legendcontainer')
      //   .attr('transform', "translate(" + -(margin.left/4) + "," + -(margin.top) +")")

      // chart end-note
      var endtext = svg.append("g")
        .attr("class", "endtext");

      endtext.append("text")
        .attr('class', 'endnote')
        .style("fill", "steelblue")
        .style("font-size", 10);


      // NOTE: Is there a better way to do this?
      const svgWidth = width + margin.left + margin.right;
      // const xVal = ((svgWidth - width) - (margin.left/3))/2;

      updateData = function() {

        let chartData = [...data];
        // chartData = data;

        const colorObject = chartData.pop()
        
        // TODO: Add insufficient and missing n-size strings
        // const missingString = data[1]

        const categoryKeys = Array.from(chartData).map(d => d[0]);
        // const entityKeys = Array.from(Array.from(chartData)[0][1]).map(d=>d[0]);

        // const entityKeys = colorObject.map(function (obj) { return  obj.school });
        const entityKeys = colorObject.map(obj => obj.school);
        // const colorList = colorObject.map(function (obj) { return  obj.color });
        const colorList = colorObject.map(obj => obj.color);

        y.domain([0, 1]).nice();
        x0.domain(categoryKeys);
        x1.domain(entityKeys).range([0, x0.bandwidth()]);

        let color = d3.scaleOrdinal()
          .domain(entityKeys)
          .range(colorList);

        const dur = 200;
        const t = d3.transition().duration(dur);

        svg.select("g.x.axis")
          .transition(t)
          .call(xAxis)
          .call(g => {
            g.select(".domain").remove()
          });

        svg.select("g.y.axis")
          .transition(t)
          .call(yAxis)
          .call(g => {
            g.select(".domain").remove()
          });

        setTimeout(() => {
          svg.select("g.y.axis")
            .selectAll(".tick text")
            .style("font-size", 10)
            .style("font-family", "Inter, sans-serif")
            .attr('dy', 0)
            .call(wrap, 60);
        }, 0);

        // legendContainer.selectAll('.legend').remove()
        // legendContainer.attr('display', 'block');

        // // transform is handled below to allow for legend to wrap
        // const fontWidth = 6;
        // const offset = 12;

        // var legend = legendContainer.selectAll('.legend')
        //   .data(entityKeys)
        //   .enter().append('g')
        //   .attr('class', 'legend')

        // legend.append('rect')
        //   .attr("x", function(d, i) {
        //     const xPost = legendXPosition(d, i, fontWidth);
        //     return xPost;
        //   })
        //   .attr('y', 20)
        //   .attr('width', 8)
        //   .attr('height', 8)
        //   .style('fill', function (d) {
        //     return color(d);
        //   });

        // legend.append("text")
        //   .attr("x", function(d, i) {
        //     const xPost = legendXPositionText(d, i, offset, fontWidth);
        //     return xPost;
        //   })
        //   .attr('y', 27) // shifts text to middle of rect
        //   .style("font-size", 10)
        //   .style('fill', "#6783a9")
        //   .text(function (d) {
        //     return d;
        //   })

        // // offset legend labels from one another
        // var xOffset = 0
        // var row = 1;
        // var y_pos = 0;

        // svg.selectAll("g.legend")
        //   .attr("transform", function (d, i) {

        //     var x_pos = d3.select(this).select("text").node().getComputedTextLength();

        //     if (x_pos == 0) {
        //       x_pos = BrowserText.getWidth(d.id, fontSize, "Inter, sans-serif")
        //     }

        //     // width of svg
        //     const svgWidth = d3.select("svg")._groups[0][0].attributes[0].value

        //     // offset is the length of the string plus the previous offset value
        //     xOffset = xOffset + x_pos;

        //     // if the length of the string + the current xposition exceeds
        //     // the width of the svg, we want to wrap to next line - the first
        //     // condition only triggers if the length of the string measured from
        //     // the current offset is longer than total width of svg.
        //     if ((svgWidth - xOffset) <= x_pos ) {

        //       // reset xOffset to 0 (back to left side)
        //       xOffset = 0
        //       xOffset = xOffset + x_pos;

        //       // shift down 15 pixels
        //       y_pos = row * 15

        //       // NOTE: because this is a "group" translation, it doesn't directly impact
        //       // the rec/text position (x values) determined by legendXPosition functions.
        //       // Set x value back to left edge
        //       d3.select(this).select("rect").attr("x", 0)
        //       d3.select(this).select("text").attr("x", offset)

        //       row+=1
        //     }
        //     else {
        //       // First row is at boxPosition 0
        //       if (row == 1) {
        //           y_pos = 0
        //       }
        //       else {

        //         let rectWidth = parseInt(d3.select(this).select("rect")._groups[0][0].attributes[2].value)

        //         // account for rect size and 12 pixel offset between rect and text
        //         // add twice to text to account for prior and current offset
        //         d3.select(this).select("rect").attr("x", rectWidth + offset)
        //         d3.select(this).select("text").attr("x", rectWidth + offset + offset)
        //       }
        //     };
        //     return "translate(" + (xOffset - x_pos) + "," + y_pos + ")"
        //   });
        // END LEGEND

        // TODO: Trying to nest groups -> entire chart -> by category -> by school -> text, rect, tooltip
        // TODO: Cannot seem to figure it out
        // let allBars = svg.selectAll(".allbars")
        //   .data([chartData])
        //   .join('g')
        //   .attr('class', 'allbars');

        // // each category of bars
        // let categoryBars = allBars.selectAll(".barcategory")
        //   .data(chartData)
        //   .join("g")
        //   .attr('class', 'barcategory');

        // let barx  = categoryBars.selectAll(".barx")
        //   .data(function(d, i) {
        //     return d[1]
        //   })
        //   .join("g")
        //     .attr("transform", function(d) { return `translate(${x0(d[0])},0)` })
        //   .attr('class', 'barx');

        // barx.append("rect")
        //   .attr('class', 'rect')
        //   .data(function (d,i) { 
        //       console.log("WTF")
        //       console.log(d[1])
        //       return d[1] 
        //   })
        //   .join("rect");

        // barx.append("text")
        //   .attr('class', 'text')
        //   .text(function (d,i) {
        //     console.log(d[0])
        //     return d[0]
        //   })
        //   .join("text");

        // console.log("TESTING")
        // console.log(barx)
        // TODO: TEST 

        // all bars on the page
        let barUpdate = svg.selectAll(".groupedbar")
          .data([chartData])
          .join('g')
          .attr('class', 'groupedbar');

        let bars = barUpdate.selectAll("g")
          .data(chartData)
          .join("g")
            .attr("transform", function(d) { return `translate(${x0(d[0])},0)` })
          .selectAll("rect")
          .attr('class', 'bars')
          .data(function (d) { return d[1] })
          .join("rect");

        bars.transition(t)
            .attr("x", function (d) { return x1(d[0]) })
            .attr("y", function(d) { return y(d[1]) })
            .attr("width", x1.bandwidth())
            .attr("height", function (d) { return height - y(d[1])} )
            .attr("fill", function(d) {return color(d[0])});
      

// TODO: errors updating bars - Too many bars causing them to overlap. Increase width? or
// TODO: decrease bandwidth of bars 
// TODO: Getting data errors as well (hs?)

        bars
          // .on("mouseover", mouseOver)
          // .on("mouseout", mouseOut)
          // .on("mousemove", mouseMove)
          .on("mouseover", function(d) {

            var matrix = this.getScreenCTM()
              .translate(+ this.getAttribute("x"), + this.getAttribute("y"));

            // gets width of text string
            boxwidth = BrowserText.getWidth(d[0], fontSize, "Inter, sans-serif")

            tooltip.transition().duration(200).style('display', 'block');
            tooltip.html(`${d[0]}<br>Proficiency: ${d3.format(".0%")(d[1])}`)
              .style("left", (window.scrollX + matrix.e + x1.bandwidth()) + "px")
              .style("top", (window.scrollY + matrix.f - 15) + "px") // 15 is half of box height + top/bottom padding
              .style("width",boxwidth + 4 + "px");
            })
          .on('mouseout', function(d) {
            tooltip.transition().duration(500).style('display', "none");
          });

      //   // TODO: TESTING
      //   let tipBox = bars.selectAll(".tipbox")
      //     // .data(chartData)
      //     .enter().append('g')
      //     .attr('class', 'tipbox');

      //   tipBox.append('path')
      //     .style("fill", function (d,i) { return "blue"}) //colors[d.id]})
      //     .attr('class', 'path');

      //   tipBox.append("text")
      //     .style("fill", "white")
      //     .style("font-size", 9)
      //     .style("font-weight", "500")
      //     .style("font-family", "font-family: 'Open Sans', verdana, arial, sans-serif")
      //     .attr("z-index", 99)
      //     .attr("dy", "0.35em")   // anchor text close to middle vertically
      //     .attr('class', 'text');
      //  // TODO: TESTING

        // NOTE: All of the if/else blocks are to ensure that labels look consistent regardless
        // of how high or wide they are. Note, 0% appears as text with no bar
        labels = barUpdate.selectAll("g")
          .data(chartData)
          .join("g")
          .selectAll("text")
          .attr('class', 'label')
          .data(function (d) { return d[1] })
          .join("text")
          .attr("text-anchor", "middle")
          .attr("y", function(d) {
            if (d[1] < .06) {
              return y(d[1]) - 5
            } else if ((d[1] < .08)) {
              return y(d[1]) + 11
            } else
            {
              return y(d[1]) + 12
            }
          })
          .attr("fill", function(d) {
            if (d[1] < .06) {
              return color(d[0])
            } else {
              return "#ffffff"
            }
          })
          .attr("x", function(d, i) {
            return x1(d[0]) + x1.bandwidth()/2 + 0.5;
          })
          .style("font-size", function(d, i) {
            if (x1.bandwidth() < 27) {
              return 8
            }
            else {
              return 9
            }
          })
          .style("font-weight", 600)
          .style("font-family", "Inter, sans-serif")
          .text(function(d, i) {
            return d3.format(".0%")(d[1]);
          });
// TODO: ADD
        // svg.selectAll("text.endtext").remove();

        // if (missingString.length > 0) {
        //   endnote = [missingString]

        //   endtext.selectAll(".endnote")
        //     .data(endnote, function(d) { return d })
        //     .enter()
        //     .append("text")
        //       .style("fill", "steelblue")
        //       .style("font-size", 10)
        //       .attr("x", -(margin.right*2))
        //       .attr("y", height + 40)
        //       .attr("class","endtext")
        //       .style("font-weight", 300)
        //       .text(function(d) { return d })
        //       .call(wrap, width + margin.right);
        // };

        // uupdate title
        // let selectedYear = document.getElementById("yearSelect").value
        // let yearString = longYear(selectedYear);

        // if (exists(data[0], 'Free or Reduced Price Meals')) {
        //   groupTitleText = ["ELA: Comparison By Subgroup (" + yearString +")"]
        // }
        // else {
        //   groupTitleText = ["ELA: Comparison By Ethnicity (" + yearString +")"]
        // }

        // svg.selectAll("text.titletext").remove();

        // groupTitle.selectAll("text.titletext")
        //   .data(groupTitleText, function(d) { return d })
        //   .enter()
        //   .append("text")
        //     .attr('class', 'titletext')
        //     .attr("fill", "white")
        //     .style("font-weight", 700)
        //     .attr("font-size", "12px")
        //     .style("font-family", "Inter, sans-serif")
        //     .style('text-anchor','middle')
        //     .style('alignment-baseline', 'middle')
        //     .attr('dx', function(d) {
        //       return (width + margin.left + margin.right)/2 - margin.left - margin.right/2
        //     })
        //     .attr('y', -55)
        //     .text(function(d) { return d });


      }; // end update Function
    }); // end each

    updateData();

  // TODO: TESTING TIPBOX PATH WITH WEE LITTLE ARROW
  // function mouseOver() {
  //   focus.style("display", null);
  //   d3.select(this).selectAll('.tipbox')
  //     .style("display", null);
  // }

  // function mouseOut() {
  //   focus.style("display", "none");
  //   d3.select(this).selectAll('.tipbox')
  //     .style("display", "none");
  // }

  // function mouseMove() {

  //   // used later for tipBox positioning
  //   var boxPosition = []

  //   // "that" is the svg; "those" is the transformed "g" element
  //   // that = d3.select(this.parentNode)
  //   // those = d3.select(this.parentNode)._groups[0][0]
  //   console.log("TESTINGGGG")
  //   console.log(this)

  //   // get combined data from all path elements in the selection
  //   box = d3.select(this)
  //   console.log(box)
  //   rawData = d3.select(this).data()
  //   // console.log(rawData)

  //   // get list of categories to add to dataByYear array
  //   // columns = rawData.map(function(d) { return d.id });

  //   // // function to convert into data by year
  //   // var dataByYear = unprocessData(rawData)

  //   // dataByYear['columns'] = columns

  //   // uses scaleQuantize() to create an inverse scale of an ordinal
  //   // scale (scalePoint in this case) - returns the element from the
  //   // scale that is closest to the mouse's x-position, even if the value
  //   // is out of bounds.
  //   // https://stackoverflow.com/questions/20758373/inversion-with-ordinal-scale
  //   // var inverseModeScale = d3.scaleQuantize()
  //   //   .domain(x.range())
  //   //   .range(x.domain())

  //   // var year = inverseModeScale(d3.mouse(those)[0]);
  //   // var years = dataByYear.map(function(d) { return d.Year; });

  //   // // data for the targeted year
  //   // var yearData = dataByYear.find(obj => obj.Year === year)

  //   // focus.attr("transform", "translate(" + x(year) + ",0)");

  //   /// tipbox with connecting arrow using svg path
  //   console.log(box)
  //   box.selectAll('.tipbox path')
  //     .style("opacity", 1)
  //     .attr( 'd', function(d) {
        
  //       console.log(d)
  //       // dataByCategory is the year, proficiency, and id for the selected
  //       // category. dataByCategory is undefined if there is no data for the
  //       // category for the year
  //       // YearData is "year, categories..." for all years
  //       dataByCategory = d.values.filter(d => d.year == year)[0];

  //       // let tipboxRectOffset = 0,
  //       //     path = [],
  //       //     yStart,
  //       //     xStart;

  //       // changing these values shouldn't break anything
  //       var boxHeight = 26;
  //       var boxWidth = 36;

  //       // dataByYear does not have an ID field. DataCategory does except
  //       // when undefined, so we need to check.
  //       if (dataByCategory != undefined) {

  //         yStart = y(dataByCategory.proficiency);
  //         xStart = x(dataByCategory.year);

  //         // if the closest "year" to mouse position is equal to the
  //         // rightmost year (the closest to the right edge), flip the
  //         // tipbox to the left

            
  //       // Tooltip Path
  //       // Right: M xStart yStart l 4 3 l 4 10 l 140 10 l 140 -10 l 4 -10 l 4 -3 l 0 0
  //       // var xStart = x
  //       // var yStart = y
  //       // var bottomArrowH = 4
  //       // var bottomArrowV = 3
  //       // var bottomFrontH = 4
  //       // var bottomFrontV = 10
  //       // var bottomH = 140
  //       // var bottomV = 10
  //       // var rightH = 140
  //       // var rightV = -10
  //       // var topH = 4
  //       // var topV = -10
  //       // var bottomFrontH = 4
  //       // var bottomFrontV = -3
  //       // var bottomArrowH = x
  //       // var bottomArrowV = y

  //       // https://yqnn.github.io/svg-path-editor/
  //       // Left: M xStart yStart l -4 3 l -4 10 l -140 10 l -140 -10 l -4 -10 l -4 -3 l 0 0
  //         var xStart = x
  //         var yStart = y
  //         var bottomArrowH = -4
  //         var bottomArrowV = 3
  //         var bottomFrontH = -4
  //         var bottomFrontV = 10
  //         var bottomH = -140
  //         var bottomV = 10
  //         var leftH = -140
  //         var leftV = -10
  //         var topH = -4
  //         var topV = -10
  //         var topFrontH = -4
  //         var topFrontV = -3
  //         var topArrowH = x
  //         var topArrowV = y

  //         // if (year == years[years.length-1]) {

  //         //   // left-> M xStart yStart l -8 3 l 0 10 l -36 0 l -0 -26 l 36 -0 l 0 10 l 8 3
  //         //   var topArrowH = -8
  //         //   var topArrowV = 3
  //         //   var topFrontH = 0
  //         //   var topFrontV = 10
  //         //   var topH = -boxWidth
  //         //   var topV = 0
  //         //   var rightH = 0
  //         //   var rightV = -boxHeight
  //         //   var bottomH = boxWidth
  //         //   var bottomV = 0
  //         //   var bottomFrontH = 0
  //         //   var bottomFrontV = 10
  //         //   var bottomArrowH = 8
  //         //   var bottomArrowV = 3
  //         // }
  //         // else {
  //         //   // right->  M xStart yStart l 8 -3 l 0 -10 l 36 0 l 0 26 l -36  0 l 0 -10 l -8 -3
  //         //   var topArrowH = 8
  //         //   var topArrowV = -3
  //         //   var topFrontH = 0
  //         //   var topFrontV = -10
  //         //   var topH = boxWidth
  //         //   var topV = 0
  //         //   var rightH = 0
  //         //   var rightV = boxHeight
  //         //   var bottomH = -boxWidth
  //         //   var bottomV = 0
  //         //   var bottomFrontH = 0
  //         //   var bottomFrontV = -10
  //         //   var bottomArrowH = -8
  //         //   var bottomArrowV = -3
  //         // }

  //         // we don't want tipboxes to overlap, so we need to check the y position
  //         // of each point and determine if an offset is necessary given the height
  //         // of the tipbox (26px) and desired spacing (3px).
  //         boxPosition = []

  //         Object.keys(yearData).forEach((k, i) => {
  //           if (k != "Year") {
  //             positionInfo = {}
  //             positionInfo.id = k
  //             positionInfo.i = i
  //             positionInfo.y = y(yearData[k])
  //             positionInfo.shift = 0
  //             boxPosition.push(positionInfo)
  //             }
  //         });

  //         boxPosition.sort(function(a,b) {return a.y - b.y; });

  //         // https://stackoverflow.com/questions/35757899/how-to-avoid-overlapping-tooltips-of-multi-series-line-chart-d3-js
  //         // NOTE: this shifts everything down. It would take a more complicated algorithm
  //         // to shift the boxes either up or down depending on their vertical position
  //         const tipboxSpacing = 3;

  //         const tipboxTotalHeight = boxHeight + tipboxSpacing;

  //         boxPosition.forEach (function(p,i) {
  //           if (i > 0) {
  //             var last = boxPosition[i-1].y;
  //             boxPosition[i].shift = Math.max (0, (last + tipboxTotalHeight) - boxPosition[i].y);
  //             boxPosition[i].y += boxPosition[i].shift;
  //           }
  //         })

  //         boxPosition.sort(function(a,b) { return a.i - b.i; })

  //         tipboxRectOffset = boxPosition.filter(d => d.id == dataByCategory.id)[0].shift

  //         // build tooltip path shifting the y position of the tooltip up
  //         // or down based on the topArrow vertical position
  //         path = "M " + xStart + " " + yStart +
  //           " l " + topArrowH + " " + (topArrowV + tipboxRectOffset) +
  //           " l " + topFrontH + " " + topFrontV +
  //           " l " + topH + " " + topV +
  //           " l " + rightH + " " + rightV +
  //           " l " + bottomH + " " + bottomV +
  //           " l " + bottomFrontH + " " + bottomFrontV +
  //           " l " + bottomArrowH + " " + (bottomArrowV - tipboxRectOffset);

  //         return path
  //       }
  //     })
  //     .style('fill', function (d,i) {
  //       if (d) {
  //         return colors[d.id]
  //       }
  //     });

  //     that.selectAll('.tipbox text')
  //       .attr("x", function(d) {

  //         data = d.values.filter(d => d.year == year)[0];

  //         if (data != undefined) {

  //           // determine x position of the text based on the x position
  //           // of the left side of the tipbox path (the arrow), the width
  //           // of the tipbox (44 pixels), and the length of the str value
  //           // in pixels
  //           const tipboxPath = d3.select(this.parentNode).select("path.path");
  //           var tipboxLeftEdge = tipboxPath.node().getBBox().x

  //           // add 8 pixels to the width calculation to account for the
  //           // length of the connecting arrow (leftEdge is measured from
  //           // the tip of the arrow, not the edge of the first horizontal)
  //           var tipboxWidth = tipboxPath.node().getBBox().width + 8

  //           // get total pixel width of text string as it appears
  //           // in the text box (e.g., "52.1%","25.0%"")
  //           let num = (data.proficiency * 100).toFixed(1);
  //           const txtWidth = BrowserText.getWidth(`${num}%`, 9, "Inter, sans-serif")

  //           tipboxRectOffset = (tipboxWidth - txtWidth) / 2

  //           // adjustment when tipbox has been flipped to left
  //           if (year == years[years.length-1]) {
  //             var pathX = tipboxLeftEdge + tipboxRectOffset - 8;
  //           }
  //           // normal right-side tipbox
  //           else {
  //             var pathX = tipboxLeftEdge + tipboxRectOffset;
  //           }

  //           return pathX

  //         } else {
  //           return null
  //         }
  //       })
  //       .attr("y", function(d) {
  //         data = d.values.filter(d => d.year == year)[0];

  //         // shift the y position of the text
  //         if (data != undefined) {

  //           // boxPosition.y should give us the middle of the tipBox as adjusted
  //           // by any shifting. note, this assumes that dy is shifted to ensure
  //           // the text is middle anchored vertically
  //           let pathY = boxPosition.filter(d => d.id == data.id)[0].y;

  //           return pathY

  //         } else {

  //           return null

  //         }
  //       })
  //       .text(function(d) {
  //         data = d.values.filter(d => d.year == year)[0];
  //         if (data != undefined) {
  //           return d3.format(",.1%")(data.proficiency);
  //         }
  //         else {
  //           return null
  //         }
  //       });
  //     } // end mouseMove
       // TODO: TESTING

    
  }; // end selection

  chart.data = function(value) {
    if (!arguments.length) return data;
    data = value;
    if (typeof updateData === 'function') updateData();
    return chart;
  };

  chart.id = function(value){
    if (!arguments.length) return id;
    id = value;
    if (typeof updateId === 'function') updateId();
    return chart;
  };

  // chart.setcolor = function(value){
  //   if (!arguments.length) return setcolor;
  //   setcolor = value;
  //   if (typeof updateColors === 'function') updateColors();
  //   return chart;
  // };

  return chart;
}; // end verticalBar
