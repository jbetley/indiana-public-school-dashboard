// Indiana Public School Academic Dashboard
// javascript utility functions
// author:   jbetley (https://github.com/jbetley)
// version:  0.9
// date:     07.04.24 


// get width of text before the item has been rendered
// otherwise can use getComputedTextLength()
// https://stackoverflow.com/questions/29031659/calculate-width-of-text-before-drawing-the-text
var BrowserText = (function () {
  var canvas = document.createElement('canvas'),
      context = canvas.getContext('2d');

    /**
     * Measures the rendered width of arbitrary text given the font size and font face
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


// remove "n" elements from the front of an array
const dropElements = (arr, n = 1) => arr.slice(n);


// uh convert an object to a string?
function toString(o) {
  Object.keys(o).forEach(k => {
     if (typeof o[k] === 'object') {
        return toString(o[k]);
     }   
     o[k] = '' + o[k];
  });
  return o;
}


// filter an array of objects by the keys listed in "keep"
function filterObj(list, kept) {
  return list.map(o => Object.fromEntries(kept.map(k => [k, o[k]])))
}


// remove keys from an array of objects if they are not present in array
function filterKeys(arr, keepKeys) {
  return arr.map(obj => {
    const newObj = {};
    for (const key in obj) {
      if (keepKeys.includes(key)) {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  });
}

// filter data by the key values present in categories array
function filterCategories(data, categories) {
  let filtered = Object.fromEntries(
      categories
      .filter(
        key => key in data
      ) 
      .map(
        key => [ key, data[key] ]
      )
  )
  return filtered
 }


 // get ?array? of object keys
 function getKeys(data) {
  let keys = Object.keys(data.reduce(function(result, obj) {
    return Object.assign(result, obj);
  }, {}))

  return keys
}


// Sort object as an array based on values
function sortObj(obj) {
  return Object.keys(obj).map(k => ([k, obj[k]])).sort((a, b) => (b[1] - a[1]))
}


// returns true if sum of all values is either Nan/Null or 0
function isValid(obj) {
  let sum = Object.values(obj).reduce((a, b) => Number(a) + Number(b), 0);
  if (isNaN(sum) || sum == 0) {
    return false
  }
  else {
    return true
  }
}


// converts array of objects with nested arrays of objects
// into a single array of objects with no nesting
function flattenObject(data) {
  let arrays = [];
  for (let j = 0; j < data.length; j++) {
    arrays.push(data[j].values);
  }
  flatArray = arrays.flat()
  return flatArray
}


// determine whether passed string exists in the passed array
function exists(arr, search) {
  return arr.some(row => row.includes(search));
}


 // removes all existing elements from select element (dropdown)
 function removeOptions(selectElement) {
  var i, L = selectElement.options.length - 1;
  for(i = L; i >= 0; i--) {
     selectElement.remove(i);
  }
}


// remove items from an object matching the passed value
function removeItemsByValue(obj, value) {
  for (const key in obj) {
    if (obj[key] === value) {
      delete obj[key];
    }
  }
}


// converts RGB values to their hex equivalent
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}).join('')