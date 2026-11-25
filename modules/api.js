// Indiana Public School Academic Dashboard
// chart processing functions
// author:   jbetley (https://github.com/jbetley)
// version:  0.9
// date:     03.01.25

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