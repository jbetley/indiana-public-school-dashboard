// Indiana Public School Academic Dashboard
// d3.js utility functions
// author:   jbetley (https://github.com/jbetley)
// version:  0.9
// date:     03.11.25


// function to wrap text in d3 chart
// https://bl.ocks.org/mbostock/7555321 //
// modified: 1) added 'x' dimension; 2) briefly remove pane class to ensure
// getComputedTextLength() works if text is initially rendered behind a tab
function wrap(text, width) {
  text.each(function() {

    let text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1,
      x = text.attr("x"),
      y = text.attr("y"),
      dy = parseFloat(text.attr("dy") || 0),
      tspan = text.text(null).append("tspan").attr("x", x).attr("y", y)
        .attr("dy", dy + "em");

    let tabs = d3.selectAll('div.tab-pane').classed('tab-pane', false);

    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));

      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];

// TODO: This is a wacky kludge to get the words to split evenly, no idea
// TODO: what is happening here - need to figure it out
        let dyTmp;
        
        if (lineNumber == 1) {
          dyTmp = (++lineNumber * lineHeight) + dy -.9
        }
        else {
          dyTmp = ++lineNumber * lineHeight + dy +.1
        }

        tspan = text.append("tspan").attr("x", x).attr("y", y)
          .attr("dy", dyTmp + "em").text(word);
      } 
    }
    tabs.classed('tab-pane', true);
  });
}


// d3 legend functions - positions horizontal legend components (rect + text)
//https://stackoverflow.com/questions/13954489/how-to-create-a-horizontal-
// legend-with-d3-js
function legendXPositionText(data, position, textOffset, avgFontWidth) {
  return legendXPosition(data, position, avgFontWidth) + textOffset;
}

function legendXPosition(data, position, avgFontWidth) {

  let labelWidth = 15;
  if (position == 0) {
    return 0;
  } else {
    var xPosition = 0;
    for (i = 0; i < position; i++) {
// TODO: Trying to determine why data[i].length used to work but doesnt
// TODO:  now- is 1 sufficient?
      // console.log(data[i].length)
      xPosition += (1 * avgFontWidth + labelWidth); //data[i].length
    }
    return xPosition;
  }
}


// get width of text before the item has been rendered
// otherwise can use getComputedTextLength()
// https://stackoverflow.com/questions/29031659/calculate-width-of-text-
// before-drawing-the-text
var BrowserText = (function () {
  var canvas = document.createElement('canvas'),
      context = canvas.getContext('2d');

    /**
     * Measures the rendered width of arbitrary text given the font size 
     * and font face
     * @param {string} text The text to measure
     * @param {number} fontSize The font size in pixels
     * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
     * @returns {number} The width of the text
     **/

    function getWidth(text, fontSize, fontFace) {
        context.font = fontSize + 'px ' + fontFace;
        return context.measureText(text).width;
    }
    return {
        getWidth: getWidth
    };
})();


// converts RGB values to their hex equivalent
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}).join('')
