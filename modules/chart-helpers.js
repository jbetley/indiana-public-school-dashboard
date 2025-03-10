// Indiana Public School Academic Dashboard
// chart processing functions
// author:   jbetley (https://github.com/jbetley)
// version:  0.9
// date:     03.01.25  


// format value as percentage (demographic/analysis pages)
function basicPercentageFormatter(params) {
  if (params.value == undefined) {
    return "\u2014"
  }
  else if (params.value == "***") {
    return "***"
  }
  else {
    let s = Number(params.value).toLocaleString(
      undefined,{style: 'percent', minimumFractionDigits:2}
    );
    return s
  }
};


// format value as percentage (info page)
function infoPercentageFormatter(params) {
  if (params.value == undefined) {
    return "\u2014"
  }
  else if (params.value[0] == undefined) {
    return "\u2014"
  }
  else if (params.value[0] == "***") {
    return "***"
  }
  else {
    let s = Number(params.value[0]).toLocaleString(
      undefined,{style: 'percent', minimumFractionDigits:2}
    );
    return s
  }
};


 // for all keys matching a list of "categories", replace value
 // with the percenatage it represents of another value
 // ("percentageOf"). "limit" is the minimum value to keep-
 // if result of the calc is below min value, store key name
 // in array and remove key from object
 function findPercentage(data, categories, percentageOf, limit) {
    let missing = []
    Object.keys(data).forEach(key => {
       if (categories.includes(key)) {
          let percentage = data[key]/percentageOf;
          if (percentage < limit) {
             missing.push(key)
             delete data[key]
          }
          else {
             data[key] = data[key]/percentageOf;
          }
       }
    });
    if (missing != undefined && missing.length != 0) {
       data["Missing"] = missing;
    }
    delete data["Total Enrollment"]
    
    return data
 };


// create a string of missing categories if they exist in school data;
// delete the same categories from corp data; and then remove the
// "Missing" key from both objects
function findMissing(schoolData, corpData) {
  let missingString = ""
  let missingCategories = schoolData["Missing"]
  
  if (missingCategories) {

      missingString = "Less than .05%: " + schoolData["Missing"].join(", ") + "."
      delete schoolData["Missing"]

      // remove school's missing categories from Corp object
      for (let i=0; i < missingCategories.length; i++) {
        delete corpData[missingCategories[i]]
      }
  }

  if (corpData["Missing"]) {
        delete corpData["Missing"]
      }
      
  return missingString
};


// process data for linechart function (Academic Info Page)
function processData (data) {

// TODO: Can we just iterate over "remaining" without adding to object?
  // get remaining categories after results are calculated
  let columns = getKeys(data);

  columns = columns.filter(elem => elem !== "Year");

  // add Column Names to data array
  data['columns'] = columns

  // convert array of objects grouped on "Year" to an array of
  // objects with an "id" key and a "values" key where values
  // is an array of objects with "year" and "proficiency" keys
  let slices = data.columns.map(function(col) {

    let sliced = {
      id: col,
      values: data.map(function(d){
          return {
              year: d.Year,
              proficiency: +d[col]
          };
      })
  };

  return sliced
  });

  // Clean the data: 1) filter out objects where proficiency
  // is NaN; 2) remove categories where all values are NaN; and
  // 3) track which years have data (for xAxis)
  let toRemove = []
  let years = []
  for (let i = 0; i < slices.length; ++i) {

    // all all non-Nan slices to tmpObj (value is NaN if it doesn equal iself)
    let tmpObj = slices[i].values.filter(d => d.proficiency == d.proficiency);

    let yrs = tmpObj.map(d => d.year);

    if (years.length < yrs.length) { years = yrs }

    // tmpObj will be empty if all values are NaN
    // if so, store the id (Category) in an array
    if (tmpObj.length === 0) {
      toRemove.push(slices[i].id)
    }
    // otherwise replace the existing values with the filtered ones
    else {
      // add id to values (used for tooltip)
      for (let k = 0; k < tmpObj.length; ++k) {
        tmpObj[k]["id"] = slices[i].id
      }

      slices[i].values = tmpObj
    }
  }

  let processedData = slices.filter(item => !toRemove.includes(item.id))

  return [processedData, years]
};


// revert the processing done by processData by pulling objects stored
// in the values key array of objects up one level for each id, merging
// all of the resulting arrays of objects into a single array of objects,
// and creating a new obj where the proficiency key is renamed to the
// id (category). Used for tooltip data
function unprocessData(data) {
  let arrays = [];

  for (let j = 0; j < data.length; j++) {
    arrays.push(data[j].values);
  }

  flatArray = arrays.flat()

  const newArray = flatArray.map((item) => {
    const obj = {};
    for (let keys in item) {
      if (keys === 'proficiency') {
        obj[item['id']] = item[keys]
      }
      obj['Year'] = item['year']
    };
    return obj
  });

  // merge on year key
  let finalData = {};
  newArray.forEach(a => finalData[a.Year] = {...finalData[a.Year], ...a});
  finalData = Object.values(finalData);

  return finalData
};


// process array for groupBarChart
function processBarData(data) {
  let finalArray = [];

  data.forEach(function (item) {
     let innerArray = [];
     let innerInnerArray = [];
     innerArray.push(item["Category"]);

     Object.keys(item).map(function(k) {
        if (k != "Category") {
           innerInnerArray.push([k,item[k]])
        };
  });
     innerArray.splice(1, 0, innerInnerArray);
     finalArray.push(innerArray);
  });
  return finalArray;
};


// take an array of objects with each object representing "Category"
// values for a group (e.g., by "Year" or by "School Name") and
// convert it into an array of objects grouped by "Category",
// with the group value (the "onKey" parameter becoming the key
// for each category value in the new object. For example (with an
// "onKey" value of "Year", this:
// 0: {Attendance Rate: 0.972341537, Chronic Absenteeism %:undefined, Year:2019}
// 1: {Attendance Rate: 0.957323536, Chronic Absenteeism %:0778816199376947, Year:2021}
// 2: {Attendance Rate: 0.0.9845, Chronic Absenteeism %:0.006269592476489028, Year:2022}
// becomes:
// 0: {2019:0.972341537, 2021:0.957323536, 2022:0.9845, Category:"Attendance Rate"}
// 1: {2019:undefined, 2021:0.0778816199376947, 2022:0.006269592476489028,
//    Category:"Chronic Absenteeism %"}
function transposeData(data, onKey) {

  // copy keys and drop Year to get whatever categories exist
  let keys = getKeys(data)
  
  let category = keys.filter(e => e !== onKey)

  const index = category.indexOf("Year");
  if (index > -1) {
    category.splice(index, 1);
  }
  
  let transposed = []

  for (let a = 0; a < category.length; a++) {
    let obj = {}
    for (let b = 0; b < data.length; b++) {

// TODO: Testing not including undefined categories (as opposed to
// TODO: converting to 0)- Test which is better.
      if (typeof data[b][category[a]] != "undefined") {
        obj[data[b][onKey]] = data[b][category[a]]
        obj["Category"] = category[a]
      }
    }
    transposed.push(obj)
  }

  return transposed
};


// calculate proficiency given tested/passed values
function calcProficiency (data, proficient, tested) {
  let result = parseInt(data[proficient]) / parseInt(data[tested])
  return result
};


// For Academic info charts - need to add empty chart test logic
function getInfoChartData(data, category, subject, selection) {

  const type = selection.school_type;
  const subtype = selection.school_subtype;

  if (
      type == "K8" ||
      (type == "K12" && (subtype == "K8" || subtype == "K12")) ||
      (typeof type === "undefined" && typeof subtype === "undefined")
  ) {

    if (['ELA', 'Math'].includes(subject)) {
        search_str = "|" + subject + " Proficient %"
    }
    else {
      search_str = "|IREAD Proficient %"
    }

  }
  else if (type == "HS" || type == "AHS" ||
    (type == "K12" && subtype == "HS")) {
    if (['EBRW', 'Math'].includes(subject)) {
      search_str = "|" + subject + " Benchmark %"
    }
    else {
      search_str = "|Graduation Rate"
    }
  }

  category = category.concat(["Year", "School Name"])

  let filteredData = filterData(data, search_str, category);

  // rename keys
  for (let obj of filteredData) {
    Object.keys(obj)
      .filter(key => key.includes(search_str))
      .forEach(key => {
        obj[key.replace(search_str, "")] = obj[key];
        delete obj[key];
      })
  }

  return filteredData
};


function getAnalysisChartData(data, category, subject, selection) {

  const type = selection.school_type;
  const subtype = selection.school_subtype;
  const schoolID = selection.school_id;
  const schoolName = data.find(d => d["School ID"] === schoolID)["School Name"];

  if (
      type == "K8" ||
      (type == "K12" && (subtype == "K8" || subtype == "K12")) ||
      (typeof type === "undefined" && typeof subtype === "undefined")
  ) {

    if (['ELA', 'Math'].includes(subject)) {
        search_str = "|" + subject + " Proficient %"
    }
    else {
      search_str = "|IREAD Proficient %"
    }

  }
  else if (type == "HS" || type == "AHS" ||
    (type == "K12" && subtype == "HS")) {
    if (['EBRW', 'Math'].includes(subject)) {
      search_str = "|" + subject + " Benchmark %"
    }
    else {
      search_str = "|Graduation Rate"
    }
  }

  let allCategories = category.concat(["Year", "School Name"])

// TODO: THIS ONLY WORKS FOR ANALYSIS DATA WHERE THERE ARE MULTIPLE SCHOOLS
// TODO: WHEN IT IS SINGLE SCHOOL WITH MULTIPLE YEAR IS MESSES UP CAUSE
// TODO: IT JUST TESTS THE FIRST YEAR
  let filteredData = filterData(data, search_str, allCategories);

  // if selected school has only "School Name" & "Year" it
  // means that they have insufficient or no data for all
  // categories - so we retunr an empty array
  let schoolDataObject = filteredData.find(o => o["School Name"] === schoolName);

  if (!checkSubstringsInObjectKeys(schoolDataObject, category)) {
    console.log("INSUFFFFFFFFF NSIZE FOR CHART")
    filteredData = []
  }
  else {

    // rename keys
    for (let obj of filteredData) {
      Object.keys(obj)
        .filter(key => key.includes(search_str))
        .forEach(key => {
          obj[key.replace(search_str, "")] = obj[key];
          delete obj[key];
        })
    }
  }

  return filteredData
};


// process data for multi-line information chart
function getHSLineData(data, category, subject, type) {

  if (type == "K8") {
    if (['ELA', 'Math'].includes(subject)) {
        remove_str = "|" + subject + " Proficient %"
    }
  }
  else if ((type == "HS") ||(type == "AHS")) {
    if (['EBRW', 'Math'].includes(subject)) {
      remove_str = "|" + subject + " Benchmark %"
    }
    else {  // Grad Rate
      remove_str = "|Graduation Rate"
    }
  }

// TODO: Make sure Grad Rate and SAT Proficiency % are calculated beforehand (?)
  // Graduation - none: category + "|" + "Cohort Count", "Graduates",
  //  [Graduation Rate]
  // SAT - EBRW/Math: category + "|" + subject + "Total Tested", "At Benchmark",
  //  [Benchmark %]
  category = category.concat(["Year", "School Name"])

  let filteredData = filterData(data, subject, category);

  remove_str = "|" + subject + " Proficient %"

  // rename keys
  for (let obj of filteredData) {
    Object.keys(obj)
      .filter(key => key.includes(remove_str))
      .forEach(key => {
        obj[key.replace(remove_str, "")] = obj[key];
        delete obj[key];
      })
  }

  // get remaining categories after results are calculated
  let remaining = getKeys(filteredData);
  remaining = remaining.filter(elem => elem !== "Year");

  // add Column Names to data array
  filteredData['columns'] = remaining

}


// process data for stackedBarCharts
function getProficiencyBreakdown(data, categoryList, subject, selection) {
  const year = selection.year;
  let yearData = data.filter((ele) => ele.Year === Number(year))[0];
  // const Year = yearData.Year
  
  let rating = ["Below Proficiency", "Approaching Proficiency", "At Proficiency", "Above Proficiency"]

  // iterate over all of the entries in data (ilearnObjAll), filtering out
  // those keys that do not include one of the substrings included
  // in rating array. "indexOf" returns the index of the first occurrence
  // of the specified substring (-1 if not present). "some" tests whether
  // at least one element in the array passes the given test
  let filteredData = Object.fromEntries(Object.entries(yearData).filter(
     ([key, value]) =>
     rating.some(v => key.indexOf(v) > -1) &&
        categoryList.some(v => key.indexOf (v + "|" + subject) > -1)
     )
  )

  let proficiencyData = []
  let insufficientN = []

  for (let j = 0; j < categoryList.length; j++) {

     // only add objects for categories where there is data in profData
     if ((Object.keys(filteredData).some(k => k.indexOf(categoryList[j]) > -1))) {

      let proficiencyCount = {}

        proficiencyCount["Below Proficiency"] = filteredData[categoryList[j] + 
          "|" + subject + " Below Proficiency"]
        proficiencyCount["Approaching Proficiency"]  = filteredData[categoryList[j] +
          "|" + subject + " Approaching Proficiency"]
        proficiencyCount["At Proficiency"]  = filteredData[categoryList[j] +
          "|" + subject + " At Proficiency"]
        proficiencyCount["Above Proficiency"]  = filteredData[categoryList[j] +
          "|" + subject + " Above Proficiency"]

        // only add non-null non-zero values to array
        if (isValid(proficiencyCount) == true) {
          proficiencyCount['Category'] = categoryList[j]

          // convert int values to percentages based on sum of all values
          let sumValues = Object.values(proficiencyCount).reduce((acc,val) =>{

            // sum values (skipping Category)
            if (isNaN(val) == false) {
              acc += parseInt(val)
            }
            return acc;
          },0)

          // iterate over keys, replacing the value for each type by its
          // percentage of the whole
          let result = Object.keys(proficiencyCount).reduce((acc,key) => {

            if (key === "Category") {
              acc[key] = proficiencyCount[key]
              return acc
            }
            else {
              let val = parseInt(proficiencyCount[key])
              acc[key] = (val/sumValues)
              return acc
            }
          },{})
          proficiencyData.push(result)
        }
        else {
          // create an array of strings for data with insufficient n-size
          let catName = categoryList[j]
          let catTested = yearData[catName + "|" + subject + " Total Tested"]
          let nsizeString = catName + " (Tested: " + catTested + ")"
          insufficientN.push(nsizeString)
        }
     }
  }

  rating.unshift("Category")
  proficiencyData["columns"] = rating

  return [proficiencyData, insufficientN, year]
};
