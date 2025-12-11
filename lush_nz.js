//import necessary modules and libraries
import axios from 'axios';
import fetch from 'node-fetch';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "lush_nz"
const start_urls = "https://www.lushusa.com/"
const brand_name = "Lush"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "9859"
const chain_name = "Lush"
const categories = "600-6900-0096";
const foodtypes = null;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = "lush_nz"
  console.log('start fetching')
  let jsonData = {
    siteId: '349',
    chainName: 'Lush',
    ISO: 'NZL',
    SN: '9859',
    category: 'Specialty Store',
    url: 'https://www.lush.com/nz/en/shops',
    entities: []
  }

  let jsonString = ``
  let url = `https://www.lush.com/api/gateway`
  //["Wellington","Auckland","Christchurch","Dunedin","Gisborne","Hamilton","Nelson","Whangārei","Queenstown"]
  const cities = ["Wellington","Auckland","Christchurch","Dunedin","Gisborne","Hamilton","Nelson","Whangārei","Queenstown"]
  const dataAll = []
  for ( var city of cities) {
  const res = await fetch("https://www.lush.com/api/gateway", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin"
    },
    "referrerPolicy": "no-referrer",
    "body": `[{\"operationName\":\"yextGeoSearch\",\"variables\":{\"location\":\"${city}\",\"offset\":0,\"limit\":47,\"channel\":\"nz\"},\"query\":\"query yextGeoSearch($location: String!, $limit: Int, $offset: Int, $channel: String!) {\\n  yextGeoSearch(\\n    location: $location\\n    offset: $offset\\n    limit: $limit\\n    channel: $channel\\n  ) {\\n    pagination {\\n      total\\n      has_more\\n      page_token\\n      __typename\\n    }\\n    locations {\\n      address {\\n        city\\n        countryCode\\n        extraDescription\\n        line1\\n        line2\\n        line3\\n        postalCode\\n        region\\n        sublocality\\n        __typename\\n      }\\n      closed\\n      description\\n      distance {\\n        distanceKilometers\\n        distanceMiles\\n        __typename\\n      }\\n      email\\n      hours {\\n        monday {\\n          openIntervals {\\n            start\\n            end\\n            __typename\\n          }\\n          isClosed\\n          __typename\\n        }\\n        tuesday {\\n          openIntervals {\\n            start\\n            end\\n            __typename\\n          }\\n          isClosed\\n          __typename\\n        }\\n        wednesday {\\n          openIntervals {\\n            start\\n            end\\n            __typename\\n          }\\n          isClosed\\n          __typename\\n        }\\n        thursday {\\n          openIntervals {\\n            start\\n            end\\n            __typename\\n          }\\n          isClosed\\n          __typename\\n        }\\n        friday {\\n          openIntervals {\\n            start\\n            end\\n            __typename\\n          }\\n          isClosed\\n          __typename\\n        }\\n        saturday {\\n          openIntervals {\\n            start\\n            end\\n            __typename\\n          }\\n          isClosed\\n          __typename\\n        }\\n        sunday {\\n          openIntervals {\\n            start\\n            end\\n            __typename\\n          }\\n          isClosed\\n          __typename\\n        }\\n        reopenDate\\n        __typename\\n      }\\n      id\\n      latLng {\\n        lat\\n        lng\\n        __typename\\n      }\\n      lastEdited\\n      mainPhone\\n      name\\n      primaryImage {\\n        alt\\n        height\\n        url\\n        width\\n        __typename\\n      }\\n      secondaryImage {\\n        alt\\n        height\\n        url\\n        width\\n        __typename\\n      }\\n      services\\n      slug\\n      specialities\\n      timezone\\n      __typename\\n    }\\n    __typename\\n  }\\n}\"}]`,
    "method": "POST"
  });
  jsonString = await res.json() 

    const convertJson = jsonString[0].data.yextGeoSearch.locations
    console.log(convertJson)
dataAll.push(convertJson)
}

console.log('dataAll-> ', dataAll, dataAll.length)

const data = dataAll.flat()
    // console.log(getData)
    let entities = []
    let count = 0
    for (const item of data) {      
      const hours1 = item.hours; // Get the hours for the current item
      const formattedHours = hours1 ? formatHours(hours1) : {}; // Use item.hours here

      const latitude = item.latLng.lat;
      const longitude = item.latLng.lng;

      entities.push({
        id: item.id,
        name: item.name,
        address: item.address.line1 + ' ' + item.address.line2 + ' ' + item.address.line3 + ' ' + item.address.city + ' ' + item.address.region + ' ' + item.address.postalCode,
        phone: item.mainPhone,
        postalCode: item.address.postalCode,
        hours: convertHours(formattedHours),
        latitude: latitude,
        longitude: longitude
      });
    }
const uniqueData = entities.filter((entity, index, self) => {
  const foundIndex = self.findIndex((e) => e.id === entity.id);
  return foundIndex === index;
});

// console.log('res-> ', uniqueData[0])
jsonData.entities = uniqueData

return jsonData.entities;
//  fs.writeFileSync(`../2024-1-done/${savename}2.json`, JSON.stringify(data, null, 2));
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Define the formatHours function to format the hours data
function formatHours(hours) {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  let formattedHours = '';

  daysOfWeek.forEach(day => {
    if (hours[day]) {
      const openIntervals = hours[day].openIntervals;
      if (openIntervals) {
        const openHours = openIntervals.map(interval => {
          return `${interval.start}-${interval.end}`;
        });
        formattedHours += `${day} ${openHours.join(', ')}; `;
      } else {
        formattedHours += `${day} Closed; `;
      }
    } else {
      formattedHours += `${day} Closed; `;
    }
  });

  return formattedHours.trim(); // Remove trailing newline
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
//function to convert hours 
function convertHours(str) {
  if (typeof str !== 'string') {
    return "Input is not a string";
  }

  // Format days of the week
  str = str.replace("monday", 'Mo');
  str = str.replace("tuesday", 'Tu');
  str = str.replace("wednesday", 'We');
  str = str.replace("thursday", 'Th');
  str = str.replace("friday", 'Fr');
  str = str.replace("saturday", 'Sa');
  str = str.replace("sunday", 'Su');

  return str;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('lush_nz');

//process json data into geojson format for spider platform
const features = finalData.map( prop => {
    return {
            "addr:full":prop.address,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"New Zealand",
            "addr:postcode":prop.postalCode,
            "name":prop.name,
            "Id":prop.id || uuidv4(),
            "phones":{
                "store":[prop.phone]},
            "fax":{"store":null},
            "store_url":prop.url,
            "website":start_urls,
            "operatingHours":{"store":prop.hours},
            "services": prop.services || null,
            "chain_id": chain_id,
            "chain_name": chain_name,
            "brand": brand_name,
            "categories":categories,
            "foodtypes":foodtypes,
            "lat":prop.latitude,
            "lng":prop.longitude ,
        }
    
  });
  console.log ("{ item_scraped_count:" , features.length,"}")
  const logfile = `{ "item_scraped_count": ` +features.length + " }"
  const outputGeojson = GeoJSON.parse(features,{Point:['lat','lng'],removeInvalidGeometries:true});
      
  const geoExp = JSON.stringify(outputGeojson)
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}.geojson`,geoExp)
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}_log.json`,logfile)


