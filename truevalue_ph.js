//import necessary modules and libraries
import axios from "axios";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

//update the following variables
const spider_name = "truevalue_ph"
const start_urls = "https://truevalue.com.ph/"
const brand_name = "True Value"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "6107"
const chain_name = "True Value"
const categories = "600-6600-0077";
const foodtypes = null;

//////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const savename = "truevalue_ph"
  console.log('start fetching')
  let jsonData = {
    siteId: '297',
    chainName: 'True Value',
    ISO: 'PHL',
    SN: '6107',
    category: 'Home Improvement-Hardware Store',
    url: 'https://truevalue.com.ph/storenumbers',
    entities: []
  }

  let htmlString = ``

      const res = await axios.get(jsonData.url)
      htmlString = res.data


    const $ = cheerio.load(htmlString);

    let entities = []
    let count = 0

    $('figure').each((index, ele) => {
      const name = $(ele).find('.location-item-header').find('h5').text()
      const url = $(ele).find('.location-item-header').find('a').attr('href')
      const address = $(ele).find('.location-item-body').find('.location-item-content').eq(0).find('p').text()

      //fetching Phone data 
      const phone1 = $(ele).find('.location-item-body').find('.location-item-content').eq(1).find('p').text()
      const phone2 = $(ele).find('.location-item-body').find('.location-item-content').eq(2).find('p').text()
      const phone3 = $(ele).find('.location-item-body').find('.location-item-content').eq(3).find('p').text()

      // console.log("p1 =",phone1,"p2 =", phone2, "p3 =",phone3)

      const phones = phone1 + "," + phone2 + "," + phone3
      
      //Fetching hours all data 
      const workHours1 = $(ele).find('.location-item-body').find('.location-item-content').eq(3).find('p').text()
      // const workHours1 = hours.replace(phone, '');
      const workHours2 = $(ele).find('.location-item-body').find('.location-item-content').eq(4).find('p').text()
      const workHours3 = $(ele).find('.location-item-body').find('.location-item-content').eq(5).find('p').text()
      const workHours4 = $(ele).find('.location-item-body').find('.location-item-content').eq(6).find('p').text()
      const workHours5 = $(ele).find('.location-item-body').find('.location-item-content').eq(7).find('p').text()
      const workHours6 = $(ele).find('.location-item-body').find('.location-item-content').eq(8).find('p').text()

      const workHour7 = workHours1 + "," + workHours2 + "," + workHours3 + "," + workHours4 + "," + workHours5 + "," + workHours6
      // const hoursRegex = /(Monday - Sunday|Monday - Thursday|Friday - Sunday|Monday - Friday|Saturday - Sunday|Friday|Saturday|Sunday|Daily)\s*: (\d{1,2}\s*AM\s*\d{1,2}\s*(PM|AM))/g;
      const hoursRegex = /(Monday - Sunday|Monday - Thursday|Friday - Sunday|Monday - Friday|Saturday - Sunday|Friday|Saturday|Sunday|Daily)\s*:\s*(\d{1,2}\s*:\s*\d{2}\s*(AM|PM))/g;

      // console.log("hours = ",workHour7)

      const workHours = workHour7.match(hoursRegex);

      const regex = /@([-\d\.]+),([-\d\.]+)/;
      const match = url.match(regex);
      const latitude = match[1];
      const longitude = match[2];

      const cleanedPhone = (phones.split(',')[0]+","+phones.split(',')[1]+","+phones.split(',')[2]).replace("Store Hours",'');
      
      const cleanedHours = workHour7.split(',').filter(hour => hour.trim() !== "" && hour.trim() !== "Store Hours" && !hour.trim().match(/^\d/));

      // console.log(url)
        entities.push({
          name: name,
          workHours: convertHours(cleanedHours.join('; ')),
          phone: phoneClean(cleanedPhone),
          address: address,
          latitude : latitude,
          longitude : longitude
        })
    })

 //   console.log('res-> ', entities[0])
    jsonData.entities = entities;

    return jsonData.entities;
// fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

///////////////////////////////////////////////////////////////////////////////////////////////////////
function phoneClean(str) {
  str = str.replace(/,Monday - Sunday : 11:00 AM - 8:00 PM/g, '');
  str = str.replace(/,Daily : 11:00 AM - 10:00 PM/g, '');
  str = str.replace(/,Daily : 10:00 AM - 9:00 PM/g, '');

  return str;
}

//function to convert hours 
function convertHours(str){
  str = str.replace(/ - /g, "-");

  //format days of weeks 
  str = str.replace("Monday", 'Mo');
  str = str.replace("Tuesday", 'Tu');
  str = str.replace("Wednesday", 'We');
  str = str.replace("Thursday :", 'Th');
  str = str.replace("Thursday", 'Th');
  str = str.replace("Friday :", 'Fr');
  str = str.replace("Friday", 'Fr');
  str = str.replace("Saturday :", 'Sa');
  str = str.replace("Saturday", 'Sa');
  str = str.replace("Sunday :", 'Su');
  str = str.replace("Sunday", 'Su');
  str = str.replace("Daily :", "Mo-Su")

  //Convert Hours 
  str = str.replace(/(\d+):(\d+)\s*AM/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*PM/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

  str = str.replace(/;$/g, '');

  return str;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('truevalue_ph');

//process json data into geojson format for spider platform
const features = finalData.map( prop => {
    return {
            "addr:full":prop.address,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"Philippines",
            "addr:postcode":prop.postal_code,
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


