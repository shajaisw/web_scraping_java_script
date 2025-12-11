import fetch from "node-fetch";
import * as cheerio from "cheerio";
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid";
import { dateformat } from '../../scripts/date.js';

const spider_name = "littlecaesars_ph"
const start_urls = "https://philippines.littlecaesars.com/en-ph/"
const brand_name = "Little Caesars"
const spider_type = "chain"
const source = "DPA_SPIDER_SEA"
const chain_id = "1561"
const chain_name = "Little Caesars"
const categories = "100-1000-0009";
const foodtypes = "800-057";

const processScraping = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const savename = "littlecaesars_ph";
  console.log("start fetching");
  let jsonData = {
    siteId: "45",
    chainName: "Little Caesars",
    ISO: "PHL",
    SN: "100-1000-0009",
    category: "Fast Food",
    url: "https://philippines.littlecaesars.com/en-ph/contact-us/",
    entities: [],
  };

  const res = await fetch(
    "https://philippines.littlecaesars.com/en-ph/contact-us/",
    {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "if-modified-since": "Mon, 11 Sep 2023 19:14:06 GMT",
        "sec-ch-ua":
          '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie:
          "__td_signed=false; _ga=GA1.2.316139124.1710939017; ARRAffinity=a374f049af0321e021a66f6ba57004d2e31d3140f1d09889270a08e39d2850a6; ARRAffinitySameSite=a374f049af0321e021a66f6ba57004d2e31d3140f1d09889270a08e39d2850a6; __cf_bm=PvZm0L.ZsUWuCSxPoxGmckaN8HCdgHTWVquplEEjoTs-1712379070-1.0.1.1-mg43SyA.kfihY1nod.q6kWkQ5iBiBH_WzspuQaXw._qcErP_C.sQmRzudBmun.Vqt_3d5MXFuB7cES52FYv0kQ; _gid=GA1.2.756280926.1712379071; cf_clearance=9YZT3sgD6MXMP0DNJ5tpwn4KDPNaO_v8DKcHsFOS.fA-1712379111-1.0.1.1-_nWnJ_X9.7t38jQyeX6R8ek7Hk.UgazZGIylu.RxAPekqJoNVx7zNz.rZcBa45YZKPZYyeodcns_tedCs0w6eA; _ga_WMKS108JCK=GS1.2.1712379073.2.1.1712379111.0.0.0",
        Referer: "https://philippines.littlecaesars.com/",
        "Referrer-Policy": "strict-origin",
      },
      body: null,
      method: "GET",
    }
  );
  const htmlString = await res.text();
  const includeSearch = htmlString.includes("METROSQUARE BUILDING");
  console.log("htmlString-> ", includeSearch);

  const $ = cheerio.load(htmlString);
  //const entities = [];
  // $(".css-14l2yhb").each((_, ele) => {
  //   const name = $(ele).find("h2").text();
  //   const city = $(ele).find(".css-eo6yyt").eq(2).text();
  let workHours = "";
  $('div.css-7wdes6').each((index, ele) => {
    const name = $(ele).find("h2").text();
    const workHoursMon = $(ele).find(".css-1hnncz2").eq(1).text();
    const workHoursFri = $(ele).find(".css-1hnncz2").eq(2).text();
    const workHoursSun = $(ele).find(".css-1hnncz2").eq(3).text();
  
    workHours = `${workHoursMon}; ${workHoursFri}; ${workHoursSun}`;
  });
  
  
  const entities =[ {
      name: "METROSQUARE BUILDING",
      address:
        "Unit 4 Ground Floor UN Ave Corner of Alhambra St, Ermita Manila, Philippines 1000",
      // workHours: {
      //   hour1: "Mon - Thu: 10:00AM - 10:00PM",
      //   hour2: "Fri: 10:00AM - 11:00PM",
      //   hour3: "Sat - Sun: 10:00AM - 9:00PM",
      // },
      workHours: convertHours(workHours),
      lantitude: 14.579126,
      longitude: 120.978524,
    }
  ]
  console.log("res-> ", entities[0]);
  jsonData.entities = entities;
  return jsonData.entities;
  // fs.writeFileSync(`../2024-1-done/${savename}.json`,JSON.stringify(jsonData, null, 2)
};

function convertHours(str){
  str = str.replace(/Monday/g, 'Mo');
  str = str.replace(/Tuesday/g, 'Tu');
  str = str.replace(/Wednesday/g, 'We');
  str = str.replace(/Thursday:/g, 'Th');
  str = str.replace(/Friday:/g, 'Fr');
  str = str.replace(/Saturday/g, 'Sa');
  str = str.replace(/Sunday:/g, 'Su');

  str = str.replace(/ - /g, '-');

  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*AM/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*PM/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

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
