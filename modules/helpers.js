// Indiana Public School Academic Dashboard
// data processing functions
// author:   jbetley (https://github.com/jbetley)
// version:  0.9
// date:     02.14.25  


// format value as percentage (used for Ag Grid)
function basicPercentageFormatter(params) {
  if (params.value == undefined) {return ""}
  let s = Number(params.value).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2});
  return s
  }

function infoPercentageFormatter(params) {
  if (params.value == undefined) {return "---"}
  if (params.value[0] == undefined) {return "---"}
  let s = Number(params.value[0]).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2});
  return s
  }

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
 }


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
}


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


// Analysis Table
function createAnalysisTable(data, tableID) {

  let keys = Object.keys(data.reduce(function(result, obj) {
     return Object.assign(result, obj);
  }, {}));

  // Move "Category" to front of Array (and remove color from cols)
  keys = keys.filter(item => item != "Category" && item != "Color");
  keys.unshift("Category")

  let columns = keys.map(field => ({field}));

  // TODO: Eventually add N-Size - need different algo than infoTable
  // TODO: Adjust size of category depending on number of cols
  // cell-renderer adds the appropriately colored sqaure in front of school name
  columns.forEach(function(e) {
    if (e.field == "Category") {
      e.cellRenderer = function(params) {
        let name = params.value;
        let color = params.data.Color
        let cellValue = 
        `<span style='font-size: 1em; color:${color};'><i class='fa fa-square center-icon'></i></span>&nbsp&nbsp${name}`;
        return cellValue;
    }
      e.headerName = "",
      e.valueFormatter = "";
      e.resizable = false;
      e.autoHeight = true;
      e.wrapText = true;
      e.minWidth = 260;
      e.maxWidth = 270;
      e.cellClass = "ag-left-aligned-cell";
      e.headerClass = "text-center",
      e.cellStyle = {fontSize: '10px'}
     }
    else {
      e.valueFormatter = basicPercentageFormatter;
      e.flex = 1;
      e.wrapHeaderText = true;
      e.resizable = false;
      e.cellClass = "ag-center-aligned-cell";
      e.headerClass = "text-center";
    }
  });

  let options = {
     columnDefs: columns,
     rowData: data,
     gridId: tableID,
     domLayout : "autoHeight",
  };
  return options
}

// Info Table Ag Grid (adds tooltips)
function createInfoTable(data, tableID) {

  let keys = Object.keys(data.reduce(function(result, obj) {
     return Object.assign(result, obj);
  }, {}))

  // Move "Category" to front of Array
  keys = keys.filter(item => item != "Category");
  keys.unshift("Category")

  let columns = keys.map(field => ({field}));
  console.log("Info")
  console.log(data)
  columns.forEach(function(e) {

     if (e.field == "Category") {
        e.valueFormatter = "";
        e.resizable = false;
        e.autoHeight = true;
        e.wrapText = true;
        e.minWidth = 80;
        e.maxWidth = 90;
        e.cellClass = "ag-left-aligned-cell";
        e.headerClass = "text-center";
     }
     else {
        e.valueFormatter = infoPercentageFormatter;
        e.flex = 1;
        e.resizable = false;
        e.cellClass = "ag-center-aligned-cell";
        e.headerClass = "text-center";
        e.tooltipValueGetter = function(params) {  
          if (params.value == undefined) 
            { return "N-Size: ---" }
          else { return `N-Size: ${params.value[1]}` }
        };
        e.headerTooltip = "Category N-Size";
     }
  });

  let options = {
     columnDefs: columns,
     rowData: data,
     gridId: tableID,
     tooltipShowDelay: 0,
     enableBrowserTooltips: false
  };
  return options
}


// Basic Ag Grid table
function createBasicTable(data, tableID) {
  let keys = Object.keys(data.reduce(function(result, obj) {
     return Object.assign(result, obj);
  }, {}))

  // Move "Category" to front of Array
  keys = keys.filter(item => item != "Category");
  keys.unshift("Category")

  let columns = keys.map(field => ({field}));

  columns.forEach(function(e) {
     if (e.field == "Category") {
        e.valueFormatter = "";
        e.resizable = false;
        e.autoHeight = true;
        e.wrapText = true;
        e.minWidth = 80;
        e.maxWidth = 90;
        e.cellClass = "ag-left-aligned-cell";
        e.headerClass = "text-center";
     }
     else {
        e.valueFormatter = basicPercentageFormatter;
        e.flex = 1;
        e.resizable = false;
        e.cellClass = "ag-center-aligned-cell";
        e.headerClass = "text-center";
     }
  });

  let options = {
     columnDefs: columns,
     rowData: data,
     gridId: tableID
  };
  return options
}

// initialize empty table
function initializeTable(tableID) {

  keys = ["Category", "2020", "2021", "2022", "2023", "2024"]
  data = [
    {
      "Category": "",
      "2020": "",
      "2021": "",
      "2022": "",
      "2023": "",
      "2024": ""                      
    }
  ];

  let columns = keys.map(field => ({field}));
  
  columns.forEach(function(e) {
     if (e.field == "Category") {
        e.valueFormatter = "";
        e.resizable = false;
        e.autoHeight = true;
        e.wrapText = true;
        e.minWidth = 80;
        e.maxWidth = 90;
        e.cellClass = "ag-left-aligned-cell";
        e.headerClass = "text-center";
     }
     else {
        e.valueFormatter = basicPercentageFormatter;
        e.flex = 1;
        e.resizable = false;
        e.cellClass = "ag-center-aligned-cell";
        e.headerClass = "text-center";
     }
  });

  let options = {
    columnDefs: columns,
    rowData: data,
    gridId: tableID,
    domLayout : "autoHeight",
    tooltipShowDelay: 0,
    enableBrowserTooltips: false
  };
  return options
}


// enrollment table
function createEnrollmentTable(data) {

  let keys = getKeys(data);
  let columns = keys.map(field => ({field}));

  columns.forEach(function(e) {
      if (e.field == "grade") {
        e.valueFormatter = "";
        e.resizable = false;
        e.autoHeight = true;
        e.wrapText = true;
        e.minWidth = 120;
        e.maxWidth = 150;
        e.cellClass = "ag-center-aligned-cell-with-border";
        e.headerClass = "text-center";
      }
      else {
        e.flex = 1;
        e.resizable = false;
        e.cellClass = "ag-center-aligned-cell";
        e.headerClass = "text-center";
      }
  });

  let options = {
      columnDefs: columns,
      rowData: data,
      getRowStyle: params => {
        // add border-top to last row
        if (params.node.rowIndex === params.node.parent.allLeafChildren.length-1) {
            return { 
              borderTop: "1px solid steelblue"
        };
        }
    }
  };

  return options

 }


// take an array of objects with each object representing "Category"
// values for a group (e.g., by "Year" or by "School Name") and
// convert it into an array of objects grouped by "Category",
// with the group value (the "onKey" paramater becoming the key
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

      // TODO: Testing not including any undefined categories (as opposed to
      // TODO: converting to 0) Which is better?
      if (typeof data[b][category[a]] != "undefined") {
        obj[data[b][onKey]] = data[b][category[a]]
        obj["Category"] = category[a]
      }
    }
    transposed.push(obj)
  }

  return transposed
}


// calculate proficiency given tested/passed values
function calcProficiency (data, proficient, tested) {
  let result = parseInt(data[proficient]) / parseInt(data[tested])
  return result
}


function getAnalysisTableData(data, category, subject, selection, colors) {

  // Analysis Data Format - Single Year
  // Black|ELA: 0.015873015873015872
  // White|ELA: 0.013333333333333334
  // Hispanic|ELA: 0.0273972602739726
  // Category: "Schooly McSchool1"

  // academic analysis data - single year - comes in as an array of objects for multiple schools,
  // each representing a single year of data. Final table format is school names on the left with
  // categories as column names. 

  const schoolID = selection.school_id
  const schoolName = data.find(d => d["School ID"] === schoolID)["School Name"];

  const k8Tab = selection.k8_tab
  const hsTab = selection.hs_tab
  const typeTab = selection.type_tab

  let proficienctSuffix;
  let testedSuffix;
  
  if (typeTab == "k8Tab") {
    if (k8Tab == "ireadTab" || subject == "IREAD") {

      proficienctSuffix = "Pass N";
      testedSuffix = "Test N";
    }
    else {
      proficienctSuffix = "Total Proficient";
      testedSuffix = "Total Tested";
    }
  }
  else if (typeTab == "hsTab") {
    
    if (hsTab == "gradTab") {
      proficienctSuffix = "Graduates";
      testedSuffix = "Cohort Count"; 
    }
    else {
      proficienctSuffix = "At Benchmark";
      testedSuffix = "Total Tested"; 
    }
  }

  // identify string of data for school
  // 1) loop through subject|category proficient % - any value that is either *** or not existent goes in:
  //    "Selected school has insufficient n-size or no data for: [list of categoires]".
  // 2) get list of school categories remaining and drop all other categories from ALL objects
  // 3) go through other schools, any remaining categories that are either *** or non-existent goes in:
  //    Schools with insufficient n-size or no data: school name (category(ies))

  const categoryProficient = [];
  const categoryTested = [];

  for (let a = 0; a < category.length; a++) {
    if (subject == "Graduation") {
      categoryProficient.push(category[a] + "|" + proficienctSuffix);
      categoryTested.push(category[a] + "|" + testedSuffix);
    }
    else {
      categoryProficient.push(category[a] + "|" + subject + " " + proficienctSuffix);
      categoryTested.push(category[a] + "|" + subject + " " + testedSuffix);
    }
  }

  let filteredData = []

  // Selected School: White, Black, Hispanic
  var noneTested = []

  // Schools with insufficient n-size or no data:Mary Nicholson School 70 Center for Inquiry (Black), Merle Sidener Academy 59 (Black).
  var insufficientN = []

  var tstInfo = []

  for (let i = 0; i < data.length; ++i) {

    let eachYear = {}
    let eachNoneTested = []
    let eachinsufficientN = {}
    let eachTestInfo = []

    if (data[i] != undefined) {

      for (let a = 0; a < category.length; a++) {

        let proficient = categoryProficient[a];
        let tested = categoryTested[a]; 
        let proficiency = category[a]

        // if tested value is greater than 0 and not NaN - calculate Proficiency
        if (Number(data[i][tested]) > 0 && Number(data[i][tested]) == Number(data[i][tested])) {
// TODO: Create dict with insufficient and none-tested data
          result = calcProficiency(data[i], proficient, tested)
          console.log("RESULT")
          console.log(data[i]["School Name"])
          console.log("CategoryL")
          console.log(tested)
          console.log("NUM Tested:")
          console.log(data[i][tested])
          console.log("RESULT")          
          console.log(result)

          // if result is NaN then TotalProficient was '***' (insufficient N-Size)
          if (result != result) {
            const insufficientYear = data[i]["Year"];
            const insufficientName = data[i]["School Name"];
            eachTestInfo[insufficientYear] = [insufficientName, proficient]
            eachinsufficientN[insufficientYear] = proficiency
          }
          // otherwise add result for the category
          else {
            eachYear[proficiency] = result
          }
        }
        // if Tested is 0 or Nan then no students were tested for that category and subject
        else {
          eachNoneTested[data[i]["Year"]] = tested;
        }
      };
    }
    else {
      console.log("ERROR")
    }

    // add relevant year to obj and then push to array
    eachYear["Category"] = data[i]["School Name"]

    tstInfo.push(eachTestInfo);

    filteredData.push(eachYear);

    noneTested.push(eachNoneTested);

    insufficientN.push(eachinsufficientN);
  };

  // filter out all categories where the school has no data
  let schoolColumns = Object.keys(filteredData.find(d => d["Category"] === schoolName));

  let academicData = filterKeys(filteredData, schoolColumns)

  // Add color as separate column to table
  const finalData = academicData.map(item1 => {
    const matchingItem = colors.find(item2 => item2.school === item1.Category);
    if (matchingItem) {
      return { ...item1, Color: matchingItem.color };
    } else {
      return item1;
    }
  });

  // Get a list of the categories where school has no data
  let schoolCategories = schoolColumns.filter(i => i !== "Category")
  let missingCategories = category.filter((e) => !schoolCategories.includes(e));
  // Selected school has insufficient n-size or no data for:
  // Comparison schools with insufficient n-size or no data:
  // TODO: Get categories for which school has data, but comparison schools do not

  // console.log(tstInfo)
  // console.log(missingCategories)

  return finalData
}


// process data for Ag Grid tables
function getTableData(data, category, subject, selection) {

  // academic info data comes in as an array of objects for a single selected school, with each
  // object representing a single year of data. Final table format is category names on the left
  // with years years as column names.

  const pageTab = selection.page_tab
  const k8Tab = selection.k8_tab
  const hsTab = selection.hs_tab
  const typeTab = selection.type_tab

  let proficienctSuffix;
  let testedSuffix;

  if (pageTab == "infoTab") { 
    if (typeTab == "k8Tab") {
      if (k8Tab == "ireadTab") {

        proficienctSuffix = "Pass N";
        testedSuffix = "Test N";
      }
      else {
        proficienctSuffix = "Total Proficient";
        testedSuffix = "Total Tested";
      }

    }
    else if (typeTab == "hsTab") {
      
      if (hsTab == "gradTab") {
        proficienctSuffix = "Graduates";
        testedSuffix = "Cohort Count"; 
      }
      else {
        proficienctSuffix = "At Benchmark";
        testedSuffix = "Total Tested"; 
      }
    }
  }

  const categoryProficient = [];
  const categoryTested = [];

  for (let a = 0; a < category.length; a++) {
    if (subject == "Graduation") {
      categoryProficient.push(category[a] + "|" + proficienctSuffix);
      categoryTested.push(category[a] + "|" + testedSuffix);
    }
    else {
      categoryProficient.push(category[a] + "|" + subject + " " + proficienctSuffix);
      categoryTested.push(category[a] + "|" + subject + " " + testedSuffix);
    }
  }

  // TODO: Add these to Charts
  let filteredData = []
  var noneTested = []
  var insufficientN = []

  for (let i = 0; i < data.length; ++i) {

    let eachYear = {}
    let eachNoneTested = {}
    let eachinsufficientN = {}

    if (data[i] != undefined) {

      for (let a = 0; a < category.length; a++) {

        let proficient = categoryProficient[a];
        let tested = categoryTested[a]; 
        let proficiency = category[a]

        // if tested value is greater than 0 and not NaN - calculate Proficiency
        if (Number(data[i][tested]) > 0 && Number(data[i][tested]) == Number(data[i][tested])) {

          result = calcProficiency(data[i], proficient, tested)

          // if result is NaN then TotalProficient was '***' (insufficient N-Size)
          if (result != result) {
            eachinsufficientN[data[i]["Year"]] = proficiency
          }
          // otherwise add result and N-Size for the category
          else {
            let testedCategory = tested.split("|")[0] + " N-Size";
            eachYear[proficiency] = result
            eachYear[testedCategory] = data[i][tested]
          }
        }
        // if Tested is 0 or Nan then no students were tested for that category and subject
        else {
          eachNoneTested[data[i]["Year"]] = tested
        }
      };
    }
    else {
      console.log("ERROR")
    }

      // add relevant year to obj and then push to array
      eachYear["Year"] = data[i]["Year"]

      filteredData.push(eachYear);
      noneTested.push(eachNoneTested);
      insufficientN.push(eachinsufficientN);
      };

      let finalData = []

      for (let b = 0; b < category.length; b++) {
        let yearData = {}

        for (let c = 0; c < filteredData.length; c++) {

          if (category[b] in filteredData[c]) {
            const filterYear = filteredData[c].Year;
            const filterCategory = filteredData[c][category[b]];
            const filterNsize = filteredData[c][category[b] + " N-Size"];
            yearData[filterYear] = [filterCategory, filterNsize];
          }

        }
        if (Object.keys(yearData).length != 0) {
          yearData["Category"] = category[b]
          finalData.push(yearData)
        }
      }

    return finalData
}


function getChartData(data, category, subject, selection) {

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

  // get remaining categories after results are calculated
  let remaining = getKeys(filteredData);
  remaining = remaining.filter(elem => elem !== "Year");

  // add Column Names to data array
  filteredData['columns'] = remaining

  return filteredData
}


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
  // Graduation - none: category + "|" + "Cohort Count", "Graduates", [Graduation Rate]
  // SAT - EBRW/Math: category + "|" + subject + "Total Tested", "At Benchmark", [Benchmark %]
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

        proficiencyCount["Below Proficiency"] = filteredData[categoryList[j] + "|" + subject + " Below Proficiency"]
        proficiencyCount["Approaching Proficiency"]  = filteredData[categoryList[j] + "|" + subject + " Approaching Proficiency"]
        proficiencyCount["At Proficiency"]  = filteredData[categoryList[j] + "|" + subject + " At Proficiency"]
        proficiencyCount["Above Proficiency"]  = filteredData[categoryList[j] + "|" + subject + " Above Proficiency"]

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
}


// process data for linechart function (Academic Info Page)
function processData (data) {

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
}


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
}