import fetch from "node-fetch";
import cheerio from "cheerio";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../../scripts/date.js';

const spider_name = "TimHortons_phi_fo"
const start_urls = "https://timhortons.ph/"
const brand_name = "Tim Hortons"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "1397"
const chain_name = "Tim Hortons"
const categories = "100-1100-0010";
const foodtypes = null;

// Function to convert the time format
function convertTimeFormat(input) {
  const patterns = [
    // Pattern for "6AM - 8PM (Mon-Fri), 7AM - 8PM (Sat)" to "(Mon-Fri) 6AM - 8PM, (Sat) 7AM - 8PM"
    { regex: /(\d+[APM]+\s*-\s*\d+[APM]+)\s*\((\w+-\w+)\),\s*(\d+[APM]+\s*-\s*\d+[APM]+)\s*\((\w+)\)/g, replace: "($2) $1, ($4) $3" },
    { regex: /(\d+[APM]+\s*-\s*\d+[APM]+) \(DAILY\)/g, replace: "(DAILY) $1" },
    { regex: /(\d+[APM]+\s*-\s*\d+[APM]+) \((Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Sunday)-(\w+)\)/g, replace: "($2-$3) $1" },
    { regex: /(\d+[APM]+\s*-\s*\d+[APM]+) \((Mon|Tue|Wed|Thu|Fri|Sat|Sun)-(\w+)\), (\d+[APM]+\s*-\s*\d+[APM]+) \((\w+)\)/g, replace: "($2-$3) $1, ($4) $3" },
    { regex: /(\d+[APM]+\s*-\s*\d+[APM]+) \((Mon|Tue|Wed|Thu|Fri|Sat|Sun)-(\w+)\), (\d+[APM]+\s*-\s*\d+[APM]+) \((\w+)-(\w+)\)/g, replace: "($2-$3) $1, ($4-$5) $3" },
    { regex: /(\d+[APM]+\s*-\s*\d+[APM]+) \((Mon|Tue|Wed|Thu|Fri|Sat|Sun)-(\w+)\) (\d+[APM]+\s*-\s*\d+[APM]+) \((\w+)-(\w+)\)/g, replace: "($2-$3) $1, ($4-$5) $3" },

    // Pattern for "24 Hours (DAILY)" to "(DAILY) 24 Hours"
    { regex: /24 Hours\s*\(DAILY\)/g, replace: "(DAILY) 24 Hours" },

    // Pattern for "6AM - 9PM (Mon-Thu, Sun) 24 Hours (Fri-Sat)" to "(Mon-Thu, Sun) 6AM - 9PM (Fri-Sat) 24 Hours"
    { regex: /(\d+[APM]+\s*-\s*\d+[APM]+)\s*\((\w+-\w+, \w+)\)\s*24 Hours\s*\((\w+-\w+)\)/g, replace: "($2) $1, ($3) 24 Hours" },
  ];

  for (const { regex, replace } of patterns) {
      if (regex.test(input)) {
          return input.replace(regex, replace);
      }
  }

  return input;
}

const rawData = async () => {
  const resp = await fetch("https://b100nomk08.execute-api.eu-north-1.amazonaws.com/prod/data");
  const jsonString = await resp.json();
  return jsonString[1];
};

const processScraping = async (siteId) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const savename = 'TimHortons_phi_fo';
  console.log("processing scraping--> ", siteId);

  let jsonData = {
    siteId,
    chainName: "Tim Hortons",
    ISO: "PHL",
    SN: "100-1100-0010",
    category: "Coffee Shop",
    url: "http://timhortons.ph/",
    entities: [],
  };

  const jsonString = await rawData();
  let entities = [];

  jsonString.forEach((item) => {
    const hours = item.operatingHours;
    
    // Apply the time format conversion
    const newHours = convertTimeFormat(hours);

    entities.push({
      name: item.name,
      address: item.addr_full.replace(/\#/g, '').replace(/^ /g, '').replace(/ /g, ' '),
      phone: item.phones.replace(/\s*-\s*/g, ''),
      workHours: convertHours(newHours),
      latitude: item.coordinates.lat,
      longitude: item.coordinates.lng,
    });
  });

  console.log('res-> ', entities[0]);
  jsonData.entities = entities;
  return jsonData.entities;
  // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
  // fs.writeFileSync(`../2024-1-source/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

function convertHours(str){
  str = str.replace(/(Closed on Sat & Sun)/g, 'Sa-Su Closed');
  str = str.replace(/Store Hours: 7AM - 8PM/g, 'Store Hours: Mo-Su 7AM - 8PM');

  str = str.replace(/DAILY/g, 'Mo-Su');
  str = str.replace(/Mon/g, 'Mo');
  str = str.replace(/Thu/g, 'Th');
  str = str.replace(/Fri/g, 'Fr');
  str = str.replace(/Sat/g, 'Sa');
  str = str.replace(/Sun/g, 'Su');
  str = str.replace(/Moday/g, 'Mo');
  str = str.replace(/Suday/g, 'Su'); 

  str = str.replace(/Frday-/g, '');
  str = str.replace(/Saurday /g, '');
  str = str.replace(/Store Hours: /g, '');
  str = str.replace(/\(/g, '');
  str = str.replace(/\)/g, '');
  str = str.replace(/\,/g, '');

  str = str.replace(/7AM - 7PM Sa-Su Closed/g, 'Mo-Fr 7AM - 7PM Sa-Su Closed');

  str = str.replace(/(\d{1,2})(AM|PM)\s*-\s*(\d{1,2})(AM|PM)/g, '$1:00$2-$3:00$4');

  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*AM/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*PM/g, (match, p1, p2) => `${Number(p1) + 12}:${p2};`);

  str = str.replace(/;$/g, '');
  str = str.replace(/24 Hours/g, '00:00-24:00');

  return str;
}

const finalData = await processScraping();
const features = finalData.map( prop => {
  return {
          "addr:full":prop.address,
          "addr:street":prop.street,
          "addr:city":prop.city,
          "addr:state":prop.state,
          "addr:country":"Philippines",
          "addr:postcode":prop.postCode,
          "name":prop.name,
          "Id":prop.id || uuidv4(),
          "phones":{
              "store":prop.phone},
          "fax":{"store":null},
          "store_url":prop.url,
          "website":start_urls,
          "operatingHours":{"store": prop.workHours},
          "services": prop.services || null,
          "chain_id": chain_id,
          "chain_name": chain_name,
          "brand": brand_name,
          "categories":categories,
          "foodtypes":foodtypes,
          "lat":prop.latitude,
          "lng":prop.longitude,
        }
  
});
console.log ("{ item_scraped_count:" , features.length,"}")
const logfile = `{ "item_scraped_count": ` +features.length + " }"
const outputGeojson = GeoJSON.parse(features,{Point:['lat','lng'],removeInvalidGeometries:true});
    
const geoExp = JSON.stringify(outputGeojson);
fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}.geojson`,geoExp);
fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}_log.json`,logfile);




