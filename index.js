import axios from 'axios';
import _ from 'lodash';

axios.get('https://candidate.hubteam.com/candidateTest/v2/partners?userKey=688c35d004bf880e6bd81e4d582d')
  .then(function (response) {
    findDates(response.data.partners);
  })
  .catch(function (error) {
    console.log(error);
  });

function parseData(data){
  const countryData = {};

  _.map(data, (el) => {
    if (countryData.hasOwnProperty(el.country)){
      countryData[el.country].partners.push(el);
    }else{
      countryData[el.country] = [];
      countryData[el.country]['partners']=[];
      countryData[el.country].partners.push(el);
    }

  });
  return countryData;
}

function getDatesByCountry(countryData){
  let allDates=[];
  //each country
  for (var country in countryData) {
    if (countryData.hasOwnProperty(country)) {
      allDates = [];
      //each user in country
      for (let i=0;i<countryData[country].partners.length; i++){
        //each available date
        for (let j=0; j<countryData[country].partners[i].availableDates.length; j++){
          if (isUnique(countryData[country].partners[i].availableDates[j], allDates)){
            allDates.push(countryData[country].partners[i].availableDates[j]);
          }
        }
      }
    }
    allDates.sort(function(a,b){
      return new Date(a) - new Date(b);
    });
    countryData[country]['allDates']=allDates;
  }
}

function isUnique(el, arr){
  for (let i = 0; i<arr.length; i++){
    if(el==arr[i]) return false;
  }
  return true;
}

function findAttendees(countryData){
  let day1, day2;
  let maxAttendees = 0;
  let startDate = "";
  let attendeeList=[];
  let finalList = {};
  finalList["countries"]=[];

  let curCount = 0;
  let curDate = "";
  let curList=[];

  for (var country in countryData) {
    if (countryData.hasOwnProperty(country)) {
      maxAttendees = 0;
      startDate = "";
      attendeeList=[];

      for(let i=0;i<countryData[country].allDates.length-1;i++){
        curCount=0;
        curDate = "";
        curList=[];
        if (Date.parse(countryData[country].allDates[i+1]) - Date.parse(countryData[country].allDates[i]) === 86400000){//dates are consec
          day1 = countryData[country].allDates[i];
          day2 = countryData[country].allDates[i+1];
          for (let j=0; j<countryData[country].partners.length;j++){
            if (canGo(day1,countryData[country].partners[j].availableDates) && canGo(day2,countryData[country].partners[j].availableDates)){
              //add to list
              curCount++;
              curDate= day1;
              curList.push(countryData[country].partners[j].email);
            }
          }
        }
        if (curCount > maxAttendees){
          maxAttendees = curCount;
          startDate = curDate;
          attendeeList = curList;
        }
      }
    }
    finalList.countries.push({
      "attendeeCount": maxAttendees,
      "attendees":attendeeList,
      "name": country,
      "startDate": startDate
    })
  }
  return finalList;
}

function canGo(day1,availableDates){
  for(let i = 0;i<availableDates.length; i++){
    if (day1 == availableDates[i]) return true;
  }
  return false;
}



function findDates(data){

  //parse data by country
  const countryData = parseData(data);

  //get set of dates for each country
  getDatesByCountry(countryData);
  console.log(countryData);

  //find attendee list
  const final = findAttendees(countryData);
  console.log(final);

  //post attendee list
  axios.post('https://candidate.hubteam.com/candidateTest/v2/results?userKey=688c35d004bf880e6bd81e4d582d', final)
  .then(function(response){
    console.log(response)
  });

}
