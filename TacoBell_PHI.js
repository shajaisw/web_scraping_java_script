import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../scripts/date.js';

const spider_name = "TacoBell_PHI"
const start_urls = "https://tacobell.com.ph/"
const brand_name = "Taco Bell"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "1607"
const chain_name = "Taco Bell"
const categories = "100-1000-0009";
const foodtypes = "102-000";
///////////////////////////////////////////////////////////////////////////////
/* CONSTANTS */
const ID = null;
const CHAIN_ID = 1607;
const CHAIN_NAME = "Taco Bell";
const BRAND_NAME = "Taco Bell";
const TYPE = "Feature";
const GEOMETRY_TYPE = "POINT";
const LEVEL = "Tier 2";
const PDE_CATEGORY_ID = "100-1000-0009";
const PDE_CATEGORY = "Fast Food";
const URL = "https://tacobell.com.ph/";
const ISO = "PHI";

///////////////////////////////////////////////////////////////////////////////
/*  */
function createRecord(
  id,
  chain_id,
  chain_name,
  name,
  type,
  brand,
  services,
  categories,
  operatingHours,
  geometry_type,
  coordinates,
  addr_full,
  addr_street,
  addr_city,
  addr_state,
  addr_postcode,
  email,
  phones,
  fax,
  website,
  store_url
) {
  return {
    id: id,
    chain_id: chain_id,
    chain_name: chain_name,
    name: name,
    type: type,
    brand: brand,
    services: services,
    categories: categories,
    operatingHours: operatingHours,
    "geometry.type": geometry_type,
    coordinates: coordinates,
    "addr_full": addr_full,
    "addr_street": addr_street,
    "addr_city": addr_city,
    "addr_state": addr_state,
    "addr_postcode": addr_postcode,
    email: email,
    phones: phones,
    fax: fax,
    store_url: store_url,
    website: website,
  };
}

///////////////////////////////////////////////////////////////////////////////
/*  */
// function writeFileSync(records, debug = false) {
//   let tempTargetDir = "../2024-1-done";

//   if (!debug) {
//     const date = new Date();
//     const currentTimestamp =
//       date.getFullYear() +
//       ("0" + (date.getMonth() + 1)).slice(-2) +
//       ("0" + date.getDate()).slice(-2) +
//       "." +
//       ("0" + date.getHours()).slice(-2) +
//       ("0" + date.getMinutes()).slice(-2) +
//       ("0" + date.getSeconds()).slice(-2);
//     //  tempTargetDir = `${tempTargetDir}/${CHAIN_ID}_${BRAND_NAME}_${ISO}/${currentTimestamp}`;
//   }

//   const targetDir = `${tempTargetDir}`;
//   const targetFile = `${targetDir}/${BRAND_NAME}_${ISO}.json`;

//   if (!fs.existsSync(targetDir)) {
//     fs.mkdirSync(targetDir, { recursive: true });
//   }

//   fs.writeFileSync(targetFile, JSON.stringify(records, null, 2));

//   console.log("Data has been written to:", targetFile);
// }

///////////////////////////////////////////////////////////////////////////////
/* Main program */
const getLink = async (html, selectorPath) => {
  const $ = cheerio.load(html);
  const link = $(selectorPath).attr('href');
  return link ? link : null;
};

const getTextContent = async (html, selectorPath) => {
  const $ = cheerio.load(html);
  const data = $(selectorPath);
  if (data.length > 0) {
    return data.text();
  } else {
    throw new Error();
  }
};

/* Crawl Contact Info */
const crawlContactInfo = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // This line should be used with caution in production environments
  const listRecords = [];

  try {
    let response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${URL}: ${response.statusText}`);
    }

    let html = await response.text();
    let locationLink = await getLink(html, "#menu-item-305 > a");

    if (!locationLink) {
      throw new Error('Location link not found');
    }

    response = await fetch(locationLink);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${locationLink}: ${response.statusText}`);
    }

    html = await response.text();

    const $ = cheerio.load(html);
    const branchesData = $('div.row.storelocator.d-inlineblock > div > div.find-Us-Branches').map((i, el) => {
      const name = $(el).find("div > h5.storename").text().trim();
      const address = $(el).find("div > p.findus_addr").text().trim();
      const phones = $(el).find("div > p.store-mobile > a").text().trim();
      const operatingHours = convertHours($(el).find("div > p.opening_hours").text().trim());

      // Add logging for each element
      console.log(`Branch ${i + 1}: Name - ${name}, Address - ${address}, Phones - ${phones}, Operating Hours - ${operatingHours}`);

      return { name, address, phones, operatingHours };
    }).get();

    for (const data of branchesData) {
      const record = createRecord(
        ID,
        CHAIN_ID,
        CHAIN_NAME,
        data.name,
        TYPE,
        BRAND_NAME,
        "",
        PDE_CATEGORY,
        data.operatingHours,
        GEOMETRY_TYPE,
        "",
        data.address,
        "",
        "",
        "",
        "",
        "",
        "",
        data.phones,
        "",
        start_urls,
        URL
      );
      listRecords.push(record);
    }

    return listRecords;
  } catch (error) {
    console.error("Error occurred:", error);
    return [];
  }
};

function convertHours(str){
  str = str.replace(/ to /g, '-');
  str = str.replace(/ – /g, '-') ;
  str = str.replace(/ - /g, '-');
  
  str = str.replace(/Monday/g, 'Mo');  
  str = str.replace(/Tuesday/g, 'Tu');
  str = str.replace(/Wednesday -/g, 'We');
  str = str.replace(/Wednesday/g, 'We');
  str = str.replace(/Thursday:/g, 'Th');
  str = str.replace(/Thursday/g, 'Th');
  str = str.replace(/Friday:/g, 'Fr');
  str = str.replace(/Friday/g, 'Fr');
  str = str.replace(/Saturday/g, 'Sa');
  str = str.replace(/Sunday:/g, 'Su');
  str = str.replace(/Sunday -/g, 'Su');
  str = str.replace(/Sunday/g, 'Su');

  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*AM/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*PM/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

  return str;

}

/* Call main program */
(async () => {
  const finalData = await crawlContactInfo();

  //process json data into geojson format for spider platform
  const features = finalData.map( prop => {
    return {
            "addr:full":prop.addr_full,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"Philippines",
            "addr:postcode":prop.postCode,
            "name":prop.name,
            "Id":prop.id || uuidv4(),
            "phones":{
                "store":[prop.phones]},
            "fax":{"store":null},
            "store_url":prop.url,
            "website":start_urls,
            "operatingHours":{"store": prop.operatingHours},
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
      
  const geoExp = JSON.stringify(outputGeojson);
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}.geojson`,geoExp);
  fse.outputFileSync(`./output/${source}/${spider_name}/${dateformat}/${spider_name}_log.json`,logfile);
})();


//root = //div[@class="row storelocator d-inlineblock"]
// name = //div[@class="find-Us-Branches"]/div/h5
// address = //div[@class="find-Us-Branches"]/div/p[@class="findus_addr"]
//phone  = //div[@class="find-Us-Branches"]/div/p[@class="store-mobile"]/a
//hours  = //div[@class="find-Us-Branches"]/div/p[@class="opening_hours"]