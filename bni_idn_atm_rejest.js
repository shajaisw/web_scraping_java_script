//import necessary modules and libraries
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

const chain_id = "3647";
const chain_name = "Bank Negara Indonesia";
const brand_name = "Bank Negara Indonesia";
const country = "Indonesia";
const categories = "700-7010-0108";
const foodtypes = null;
const start_urls = "https://www.bni.co.id/";
const supplierName = "WEB_SCRAPING_DPA_SPIDER_SEA"
const isoCountryCode = "IDN";
const LanguageCode = "en";

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  console.log("start fetching");
  // const savename = "bni_IDN_atm_rejest";
  let jsonData = {
    siteId: "3647",
    chainName: " ",
    ISO: " ",
    SN: " ",
    category: "ATM",
    url: "",
    entities: [],
  };

  const res = await fetch(
    "https://zbvnlp14l2.execute-api.us-east-1.amazonaws.com/dev/bniATMreinjestion"
  );

  const jsonString = await res.json();
  const data = JSON.parse(jsonString.body);
console.log(data)
  jsonData.entities = data;

  return jsonData.entities;
  // fs.writeFileSync(
  //   `../2024-1-done/${savename}.json`,JSON.stringify(jsonData, null, 2)
  // );
};

const finalData = await processScraping();
// console.log(finalData);
const features = finalData.map(prop => {
  return {
      "addr:full":prop["addr:full"],
      "addr:street":prop["addr:street"],
      "addr:city":prop["addr:city"],
      "addr:state":prop["addr:state"],
      "addr:country":country,
      "addr:postcode":prop["addr:postcode"],
      "name":brand_name+ "-"+prop.name.replace(/ATM/g, '').trim(),
      "Id": prop.id || uuidv4(),
      "phones":prop.phones.store,
      "fax":null,
      "store_url":prop.url,
      "website":start_urls,
      "operatingHours":prop.operatingHours.store,
      "services":prop.services,
      "chain_id": chain_id,
      "chain_name": chain_name,
      "brand": brand_name,
      "categories":categories,
      "foodtypes":foodtypes,
      "lat": prop.Latitude || null,
      "lng": prop.Longitude || null,
      "source": supplierName,
      "ISO": isoCountryCode,
      "LanguageCode": LanguageCode,

  }
});

const logfile = `{ "item_scraped_count": ` +features.length + " }"
const outputGeojson = GeoJSON.parse(features,{Point:['lat','lng'],removeInvalidGeometries:true});

const geoExp = JSON.stringify(outputGeojson)
fse.outputFileSync(`../output/${saveFile}_${dateformat}_3.geojson`,geoExp)
fse.outputFileSync(`../output/${saveFile}_${dateformat}_3_log.json`,logfile)






