// Indiana Public School Academic Dashboard
// table processing functions
// author:   jbetley (https://github.com/jbetley)
// version:  0.9
// date:     03.01.25  


// Academic Info Tables
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
  
    let filteredData = []
    // var noneTested = []
    // var insufficientN = []
  
    for (let i = 0; i < data.length; ++i) {
  
      let eachYear = {}
      // let eachNoneTested = {}
      // let eachinsufficientN = {}
  
      if (data[i] != undefined) {
  
        for (let a = 0; a < category.length; a++) {
  
          let proficient = categoryProficient[a];
          let tested = categoryTested[a]; 
          let proficiency = category[a]
  
          // if tested value is greater than 0 and not NaN - calculate Proficiency
          if (Number(data[i][tested]) > 0 && Number(data[i][tested]) == Number(data[i][tested])) {
            
            let testedCategory = tested.split("|")[0] + " N-Size";
  
            if (data[i][proficient] == "***") {
              eachYear[proficiency] = "***"
              eachYear[testedCategory] = data[i][tested]
            }
            else {
              result = calcProficiency(data[i], proficient, tested)
              eachYear[proficiency] = result
              eachYear[testedCategory] = data[i][tested]
            };
  
          //   result = calcProficiency(data[i], proficient, tested)
  
          //   // if result is NaN then TotalProficient was '***' (insufficient N-Size)
          //   if (result != result) {
          //     eachinsufficientN[data[i]["Year"]] = proficiency
          //   }
          //   // otherwise add result and N-Size for the category
          //   else {
          //     let testedCategory = tested.split("|")[0] + " N-Size";
          //     eachYear[proficiency] = result
          //     eachYear[testedCategory] = data[i][tested]
          //   }
          // }
          // // if Tested is 0 or Nan then no students were tested for that category and subject
          // else {
          //   eachNoneTested[data[i]["Year"]] = tested
          }
        };
      }
      else {
        console.log("ERROR")
      }
  
      // add relevant year to obj and then push to array
      eachYear["Year"] = data[i]["Year"]
      filteredData.push(eachYear);
      // noneTested.push(eachNoneTested);
      // insufficientN.push(eachinsufficientN);
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
};


function getAnalysisTableData(data, category, subject, selection, colors) {
    // Analysis Data Format - Single Year
    // Black|ELA: 0.015873015873015872
    // White|ELA: 0.013333333333333334
    // Hispanic|ELA: 0.0273972602739726
    // Category: "Schooly McSchool1"
  
    // academic analysis data - single year - comes in as an array of objects for multiple schools,
    // each representing a single year of data. Final table format is school names on the left with
    // categories as column names. 
  
  // TODO: Catch empty data here?
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
  
    for (let i = 0; i < data.length; ++i) {
  
      let eachYear = {}
  
      if (data[i] != undefined) {
  
        for (let a = 0; a < category.length; a++) {
  
          let proficient = categoryProficient[a];
          let tested = categoryTested[a]; 
          let proficiency = category[a]
  
          if (data[i][tested] == "***" || data[i][proficient] == "***") {
            eachYear[proficiency] = "***"
          }
          else if (Number(data[i][tested]) > 0 && Number(data[i][tested]) == Number(data[i][tested])) {
  
            result = calcProficiency(data[i], proficient, tested)
            eachYear[proficiency] = result
          }
        };
      }
      else {
        // TODO: HANDLE ERROR BETTER HERE
        console.log("ERROR")
      }
  
      // add relevant year to obj and then push to array
      eachYear["Category"] = data[i]["School Name"]
      filteredData.push(eachYear);
    };
  
    // filter out categories where the school has no data (note: this keeps
    // insuffient n-size value "***")
    let schoolColumns = Object.keys(filteredData.find(d => d["Category"] === schoolName));

    // if selected school has insufficent data for all categories (e.g.,
    // either tested or proficient is "***")- then we have no data to
    // display

    let originalData = structuredClone(filteredData);

    // use this data copy to test for sets with all insufficiency
    let schoolDataObject = filteredData.find(o => o.Category === schoolName);
    delete schoolDataObject.Category;
  
    const allInsufficient = Object.values(schoolDataObject).every((value) => value === "***");
  
    let finalData;
    
    if (allInsufficient == true) {
      finalData = [];
    }
    else {
      let academicData = filterKeys(originalData, schoolColumns)

      // Add color as separate column to table
      finalData = academicData.map(item1 => {
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
      
      finalData.push(missingCategories)
    }

    return finalData
};


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
};


function createInfoTable(data, tableID) {
  let keys = Object.keys(data.reduce(function(result, obj) {
     return Object.assign(result, obj);
  }, {}));

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
        e.valueFormatter = infoPercentageFormatter;
        e.flex = 1;
        e.resizable = false;
        e.cellClass = "ag-center-aligned-cell";
        e.headerClass = "text-center";
        e.tooltipValueGetter = function(params) {  
          if (params.value == undefined) 
            { return "N-Size: \u2014" }
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
};


// initializes an "empty" table - run on page load
function initializeTable(tableID) {

  keys = ["Category", "2020", "2021", "2022", "2023", "2024"];
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
};


// Demographic Page
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
          e.minWidth = 140;
          e.maxWidth = 140;
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
};


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
        };
    }
  };

  return options
};
