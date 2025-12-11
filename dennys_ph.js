//import necessary modules and libraries
import axios from "axios";
import * as cheerio from 'cheerio'
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

//update the following variables
const spider_name = "dennys_ph"
const start_urls = "https://dennys.ph/"
const brand_name = "Denny's"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "1521"
const chain_name = "Denny's"
const categories = "100-1000-0001";
const foodtypes = "101-000";

//////////////////////////////////////////////////////////////////////////////////////
const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const savename = "dennys_ph"
  console.log('start fetching')
  let jsonData = {
    siteId: '167',
    chainName: 'Denny\'s',
    ISO: 'PHL',
    SN: '1521',
    category: 'Casual Dining',
    url: 'https://dennys.ph/location',
    entities: []
  }

  let htmlString = ``

      const res = await axios.get(jsonData.url)
      htmlString = res.data


    const $ = cheerio.load(htmlString);
    let entities = []
    let count = 0

    $('.locationInfo').each((index, ele) => {
      const name = $(ele).find('h3').text()
      const addressString = $(ele).find('p').find('span').text()
      const phone = $(ele).find('ul').find('li').eq(0).text()
      const mail = $(ele).find('ul').find('li').eq(1).text()

      //extracting hours from website
      const hour1 = $(ele).find('p.bold').contents().eq(4).text().trim(); 
      const hour2 = $(ele).find('p.bold').contents().eq(6).text().trim();
      const hour3 = $(ele).find('p.bold').contents().eq(8).text().trim();
      const hour4 = $(ele).find('p.bold').contents().eq(10).text().trim();

      const tatalhours = hour1 + "; " + hour2 + "; " + hour3 + "; " + hour4

      // const operatingHours = tatalhours.replace(/(\d{1,2})(AM|PM) - (\d{1,2})(AM|PM)/, '$1:00$2 - $3:00$4');

      let latitude = ''
      let longitude = ''
      const url = $(ele).find('a').eq(2).attr('href')
      const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        latitude = parseFloat(match[1]);
        longitude = parseFloat(match[2]);
      }
      entities.push({
        name: name.trim(),
        phone: phone.trim(),
        email: mail.trim(),
        address: addressString.trim(),
        latitude: latitude,
        longitude: longitude,
        workHours : convertHours(tatalhours) 
      })
    })

    console.log('res-> ', entities[0])

    jsonData.entities = entities;

    return jsonData.entities;
// fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//function to convert hours 
function convertHours(str){
  //special charectors
  str = str.replace(/ ; ; /g, '');
  str = str.replace(/ ; /g, '');
  str = str.replace(/ - /g, '-');
  str = str.replace(/ to /g, '-');

  str = str.replace(/Open /, '');

  //days format
  str = str.replace(/Monday :/g, "Mo");
  str = str.replace(/Monday/g, "Mo");
  str = str.replace(/Tuesday/g, "Tu");
  str = str.replace(/Wednesday/g, "We");
  str = str.replace(/Thursday :/g, "Th");
  str = str.replace(/Friday/g, "Fr");
  str = str.replace(/Saturday :/g, "Sa");
  str = str.replace(/Saturday/g, "Sa");
  str = str.replace(/Sunday :/g, "Su");
  str = str.replace(/Sunday:/g, "Su");
  str = str.replace(/Sunday/g, "Su");

  //convert hours to 9am - 10pm o 9:00am - 10:00pm
  str = str.replace(/(\d{1,2})\s*(am|pm)-(\d{1,2})\s*(am|pm)/g, '$1:00$2-$3:00$4');

  //convert hours
  str = str.replace(/(\d+):(\d+)\s*am/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
  str = str.replace(/(\d+):(\d+)\s*pm/g, (match, p1, p2) => `${Number(p1) + 12}:${p2}`);

  str = str.replace(/;$/g, '');


  return str;
}

/////////////////////////////////////////////////////////////////////////////////////////////////

//call function processScraping
const finalData = await processScraping('dennys_ph');

//process json data into geojson format for spider platform
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


