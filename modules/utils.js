// Indiana Public School Academic Dashboard
// general utility functions
// author:   jbetley (https://github.com/jbetley)
// version:  0.9
// date:     03.01.25 


// remove "n" elements from the front of an array
const dropElements = (arr, n = 1) => arr.slice(n);


// not exactly sure what this is for
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


// remove object elements matching the passed string in
// an array of objects
function filterByValue(array, string) {
  array.filter(obj =>
    Object.keys(obj).forEach(key => {
      if (obj[key] == string) delete obj[key];
    })
  )
};


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


// TODO: THIS IS NOT AT ALL EFFICIENT. Apparantly loops through each line of
// TODO: data for each matched value (e.g., 120 times for EL, 120 times for Paid)
/**
   * Find any given number of keys and remove them
   * @param {array<object>} array - An array of objects
   * @param {string} search_str - string suffix to add to keys (if applicable)
   * @param {array<string>} keys - List of keys to keep
   * @return {array<object>} The array with filtered keys
   */
function filterData(array, search_str, keys) {

  let clone = structuredClone(array);

  for (let obj of clone) {
    Object.keys(obj).flatMap(key => {
      if (keys.some(function(v) {
        if ((v == "Year") || (v == "School Name")) {
          str = v
        }
        else {
          str = v + search_str
        }
        if (str === "Non English Learners|Graduation Rate") {
        }

        if (obj[str] != "***") {
          return key.indexOf(str) >= 0; 
        }

       }))
      {
        return [];
      }
      return delete obj[key];
    });
  }

  // check for any remaining "***" values and remove
  let filterValue = "***"
  filterByValue(clone, filterValue);

  return clone;

}


 // get ?array? of object keys
 function getKeys(data) {
  let keys = Object.keys(data.reduce(function(result, obj) {
    return Object.assign(result, obj);
  }, {}))

  return keys
}


// convert 4 digit year to six digit (2024 -> 2023-24)
function longYear(year) {
  let prevYear = Number(year) - 1;
  let fullYear = toString(prevYear) + "-" + year.slice(2);
  return fullYear
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


// pass a (single) object and a list of keys - will return
// "true" if object contains any of the keys in the list
function containsAnyKey(obj, keys) {
  for (const key of keys) {
    if (obj.hasOwnProperty(key)) {
      return true;
    }
  }
  return false;
};


// rename a key in an array of objects
function renameKey(array, oldKey, newKey) {
  return array.map(obj => {
     if (obj.hasOwnProperty(oldKey)) {
        obj[newKey] = obj[oldKey];
        delete obj[oldKey];
     }
     return obj;
  });
}


// see title of function
function replaceSubstringInArrayOfObjects(arr, key, searchValue, replaceValue) {
  return arr.map(obj => {
     if (obj.hasOwnProperty(key) && typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(searchValue, replaceValue);
     }
     return obj;
  });
}


// sort an array of objects by a provided property and list order
function orderByProperty(arr, property, order) {
  const orderMap = order.reduce((acc, value, index) => {
    acc[value] = index;
    return acc;
  }, {});

  arr.sort((a, b) => {

    const aIndex = orderMap[a[property]];
    const bIndex = orderMap[b[property]];

    if (aIndex === undefined && bIndex === undefined) return 0;
    if (aIndex === undefined) return 1;
    if (bIndex === undefined) return -1;

    return aIndex - bIndex;
  });

  return arr;
};


// replace the first duplicate value in the passed "obj"
// with the passed "newValue"
function replaceDuplicate(obj, newValue) {
  const seenValues = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (seenValues[value]) {
        obj[key] = newValue;
        return obj; // Exit after replacing the first duplicate
      } else {
        seenValues[value] = true;
      }
    }
  }
  return obj; // No duplicates found
};


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


// remove given value from an array of objects (same as above, but
// for array of objects)
function removeObjectWithValue(array, key, value) {
  return array.filter(obj => obj[key] !== value);
}
