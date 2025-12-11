//import necessary modules and libraries
import axios from 'axios';
import fetch from 'node-fetch';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

//update the following variables
const spider_name = "HaagenDazs_th"
const start_urls = "https://www.haagendazs.co.th/"
const brand_name = "Haagen-Dazs"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "1544"
const chain_name = "Haagen-Dazs"
const categories = "100-1000-0000";
const foodtypes = "800-063";

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = "HaagenDazs_th";
  console.log("start fetching");
  let jsonData = {
    siteId: "237",
    chainName: "Haagen-Dazs",
    ISO: "THA",
    SN: "1544",
    category: "Restaurant",
    url: "https://www.haagendazs.co.th/cafes",
    entities: [],
  };

  const res = await fetch(jsonData.url);
  const htmlString = await res.text();

  const $ = cheerio.load(htmlString);

  let entities = [];
  let count = 0;

  $(".component-content > ul > li").each((index, ele) => {
    const name = $(ele).find(".field-locationname").text();
    const address1 = $(ele).find(".field-locationaddress1").text();
    const address2 = $(ele).find(".field-locationaddress2").text();
    const address3 = $(ele).find(".field-locationaddress3").text();
    const phone = $(ele).find(".field-locationphone").text();
    const url = $(ele).find("a").attr("href");
    console.log("url-> ", url);
    entities.push({
      name: name,
      address: address1 + " " + address2 + " " + address3,
      phone: phone,
      url: url,
    });
  });

  const dataAll = entities.filter(
    (item) => item !== undefined && item !== null && item.name !== ""
  );
  console.log("dataAll-> ", dataAll.length);

  const dataMap = dataAll.map((item) => {
    const cleanUrl = item.url;
    const params = cleanUrl.split("/@")[1].split(",");

    return {
      name: item.name,
      address: item.address,
      phone: item.phone,
      url: item.url,
      latitude: params[0],
      longitude: params[1],
    };
  });

  console.log("res-> ", dataMap[0]);

  jsonData.entities = dataMap.flat();

  return jsonData.entities;
  // fs.writeFileSync(
  //   `../2024-1-done/${savename}.json`,
  //   JSON.stringify(jsonData, null, 2)
  // );
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('HaagenDazs_th');

//process json data into geojson format for spider platform
const features = finalData.map( prop => {
    return {
            "addr:full":prop.address,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"Thailand",
            "addr:postcode":prop.postal_code,
            "name":prop.name,
            "Id":prop.id || uuidv4(),
            "phones":{
                "store":[prop.phone]},
            "fax":{"store":null},
            "store_url":prop.url,
            "website":start_urls,
            "operatingHours":{"store":prop.operatingHours},
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



