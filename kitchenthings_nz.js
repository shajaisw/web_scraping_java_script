//import necessary modules and libraries
import axios from 'axios';
import fetch from 'node-fetch';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../scripts/date.js';

//update the following variables
const spider_name = "kitchenthings_nz"
const start_urls = "https://www.kitchenthings.co.nz/"
const brand_name = "Kitchen Things"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "28548"
const chain_name = "Kitchen Things"
const categories = "600-6500-0072";
const foodtypes = null;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = "kitchenthings_nz"
  console.log('start fetching')
  let jsonData = {
    siteId: '350',
    chainName: 'Kitchen Things',
    ISO: 'NZL',
    SN: '28548',
    category: 'Consumer Electronics Store',
    url: 'https://www.kitchenthings.co.nz/store-locator/',
    entities: []
  }

  let jsonString = ``
    const res = await fetch("https://www.kitchenthings.co.nz/store-locator/kapiti/" );
    jsonString = await res.text()
    const nostring = jsonString.includes('9:00AM - 5:30PM');
    console.log(nostring);
    const $ = cheerio.load(jsonString);
    //console.log(jsonString )
    const data3 = $('#html-body > script').text()
    const data4 = data3.split('markerJson:')[1].split('markerIcon:')[0].replace(/,\n\s+/g, '');
    const data = JSON.parse(data4)

    let entities = []
    let count = 0
    for (const item of data) {
      const htmlString = item.infoWindow
      const $ = cheerio.load(htmlString)
      let phone = ''
      //let address = ''
      let storeHours = [];
      // console.log(storeHours);
    //  $('.odinfowindow-content').each((index, ele) => {
  //phone = $(ele).find('p').eq(3).text()
      //})

      // $('div.odlocator-stocks-view--description').each((index, ele) => {
      //   address = $(ele).find('p').eq(1).text()
      // })


       $('.odinfowindow-content').each((index, ele) => {
        phone = $(ele).find('p').eq(3).text();
         storeHours = $(ele).find('.store-hours li').map((index, ele) => {
         const day = $(ele).find('p').eq(0).text().trim();
          const hours = $(ele).find('p').eq(1).text().trim();
         return { day, hours };
         }).get();
        });

      // console.log(storeHours);

      //code for hours
      // Parse store hours
      // const storeHoursItem = $('ul.store-hours li', htmlString); 
      // let storeHours = [];
      // storeHoursItem.each((index, element) => {
      //   const day = $(element).find('p:first-child').text().trim();
      //   // const hours = $(element).find('p:last-child').text().trim();
      //   storeHours.push(`${day} ${hours}`);
      //);


    //   // Extract store hours
    //   $('ul.store-hours li').each((index, element) => {
    //     const day = $(element).find('p').eq(0).text().trim();
    //     const hours = $(element).find('p').eq(1).text().trim();
    //     storeHours.push({ day, hours });
    //   });

      entities.push({
        name: item.title,
        phone : phone,
        //address : address,
        latitude: item.lat,
        longitude: item.lng,
        workHours : storeHours,
      })
    }

    console.log('res-> ', entities[0])
    jsonData.entities = entities;

    return jsonData.entities;
    // fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

///////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('kitchenthings_nz');

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
            "operatingHours":{"store":prop.workHours},
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



