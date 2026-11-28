// Indiana Public School Academic Dashboard
// chart processing functions
// author:   jbetley (https://github.com/jbetley)
// version:  0.9
// date:     03.01.25

 async function getDemographicData(select) {

    const fetchedData = await fetch(`${window.origin}/demographic`, {
       method: "POST",
          credentials: "include",
          cache: "no-cache",
          headers: {
             Accept: "application/json",
             "Content-Type": "application/json",
       },
       body:JSON.stringify(select)})
       .then(response=>{
          if (response.ok) {
             return response.json()
          } else {
             alert("Network Error: Could not load data.")
          }
       });
 
    // let demData = fetchedData[0];
    return fetchedData[0]
    // demographicsPage(demData);
 };

 async function getAcademicInfoData(select) {

   const fetchedData = await fetch(`${window.origin}/academic`, {
       method: "POST",
       credentials: "include",
       cache: "no-cache",
       headers: {
           Accept: "application/json",
           "Content-Type": "application/json",
       },
       body:JSON.stringify(select)})
      .then(response=>{
         if (response.ok) {
            return response.json()
         } else {
            alert("Network Error: Could not load data.")
         }
      });

      return fetchedData[0]
};

 async function getAcademicAnalysisData(select) {

   // TODO: Sometimes "select.comparison_schools" is empty - presumably
   // because at the time the data is passed, the checked schools have
   // not been registered - resolve passed vs. global use

   // TODO: TESTING REMOVING THIS
   // only populated once set by get comparison lsit
   // let directSelect = comparisonSelect.getSelected(); 

   // if (Array.isArray(directSelect) || directSelect.length) {
   //    select.comparison_schools = directSelect;
   // };

   const fetchedData = await fetch(`${window.origin}/academic`, {
      method: "POST",
      credentials: "include",
      cache: "no-cache",
      headers: {
            "Content-type": "application/json",
            "Accept": "application/json"
      },
      body:JSON.stringify(select)})
   .then(response=>{
      if (response.ok) {
         return response.json()
      } else {
         alert("Network Error: Could not load data.")
      }
   });
   
   return fetchedData[0];
   // academicAnalysisPage(analysisData);
};


async function loadComparisonSchools(select) {
   const comparisonSchoolList = await fetch(`${window.origin}/where`, {
      method: "POST",
      headers: {
            "Content-type": "application/json",
            "Accept": "application/json"
      },
      body:JSON.stringify(select)})
      .then(response=>{
         if (response.ok) {
            return response.json()
         } else {
            alert("Network Error: Could not load data.")
         }
      });

   return comparisonSchoolList;
};

async function getAvailableYears(select) {
   const yearData = await fetch(`${window.origin}/years`, {
      method: "POST",
         credentials: "include",
         cache: "no-cache",
         headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
      },
      body:JSON.stringify(select)})
      .then(response=>{
         if (response.ok) {
            return response.json()
         } else {
            alert("Network Error: Could not load data.")
         }
      })

      return yearData
};