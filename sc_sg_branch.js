//import necessary modules and libraries
import axios from 'axios';
import GeoJSON from 'geojson';
import fse from 'fs-extra';
import { v4 as uuidv4 } from "uuid"; // Import v4 function as uuidv4
import { dateformat } from '../../scripts/date.js';

//update the following variables
const spider_name = "sc_sg_branch"
const start_urls = "https://www.sc.com/sg"
const brand_name = "Standard Chartered"
const spider_type = "chain"
const source = "DPA_SPIDERS"
const chain_id = "2529"
const chain_name = "Standard Chartered"
const categories = "700-7010-0107";
const foodtypes = null;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

const processScraping = async () => {
  const savename = "sc_sg_branch"
  console.log('start fetching')
  let jsonData = {
    siteId: '183',
    chainName: 'Standard Chartered',
    ISO: 'SG',
    SN: '2529',
    category: 'BRANCH',
    url: 'https://www.sc.com/sg/atm-branch-locator/',
    entities: []
  }

  let jsonString = ``

    const res = await axios.get('https://www.sc.com/sg/data/atm-branch/all-atms-branches.json')
    jsonString = res.data
    const totalData = jsonString
    const data = totalData.locations
    let entities = []
    let count = 0

    for (const item of data) {
      entities.push({
        id : item.id ,
        name: item.name,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        types : item.types,
        phones : item.telephone,
        operatingHours : convertHours(item.hours),
      })
    }
    console.log('res-> ', entities[0])

    jsonData.entities = entities;
    
    return jsonData.entities;
// fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2));
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Function to convert hours 
function convertHours(str){
    str = str.replace(/<BR \/\>/g, ' ');
    str = str.replace(/\r\n/g, '');
    str = str.replace(/ to /g, '-');
    str = str.replace(/ - /g, "-");

    str = str.replace(/Over-the-counter Commercial, Corporate &amp; Institutional Clients banking services are not available./g, '');
    str = str.replace("  Peak Hours: Weekdays – 11am-12pm", '');
    str = str.replace("   Peak Hours: Weekdays – 11am-3pm  ", '');
    str = str.replace("  Peak Hours:  Saturdays – 12pm-1pm", '');
    str = str.replace("  Peak Hours:  Weekdays – 11am-2pm &amp; 4pm-7pm Weekends – 11am-3pm", '');
    str = str.replace("  Peak Hours: Weekdays – 3pm-4pm Saturdays – 10am-11am", '');
    str = str.replace("  Peak Hours: Saturdays – 10am-11am", '');
    str = str.replace("     Peak Hours:  Weekdays – 12pm-2pm", '');


    str = str.replace(/Closed on New Year, Chinese New Year and Christmas/g, 'New Year, Chinese New Year, Christmas off');
    str = str.replace(/Closed on Sun and public holidays/g, 'Su, PH off');
    str = str.replace(/Closed on Sat, Sun and public holidays/g, 'Sa, Su, PH off');

    
    str = str.replace("Mon", "Mo");
    str = str.replace("Tue", "Tu");
    str = str.replace("Wed", "We");
    str = str.replace("Thu", "Th");
    str = str.replace("Fri :", "Fr");
    str = str.replace("Fri:", "Fr");
    str = str.replace("Fri", "Fr");
    str = str.replace("Sat:", "Sa");
    str = str.replace("Sat", "Sa");
    str = str.replace("Sun:", "Su");
    str = str.replace("Sun", "Su");

    // convert Hours to 11am to 11:00am format
    str = str.replace(/(\d{1,2})(am|pm)-(\d{1,2})(am|pm)/g, '$1:00$2 - $3:00$4');

    //Convert Hours 
    str = str.replace(/(\d+):(\d+)\s*am/g, (match, p1, p2) => `${p1.padStart(2, '0')}:${p2}`);
    str = str.replace(/(\d+):(\d+)\s*pm/g, (match, p1, p2) => `${Number(p1) + 12}:${p2};`);

    return str;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//call function processScraping
const finalData = await processScraping('sc_sg_branch');

//using filter to fetch branch data 
const filterType = finalData.filter(prop => prop.types[0] === "branch");

//process json data into geojson format for spider platform
const features = filterType.map( prop => {
    return {
            "addr:full":prop.address,
            "addr:street":prop.street,
            "addr:city":prop.city,
            "addr:state":prop.state,
            "addr:country":"Singapore",
            "addr:postcode":prop.postal_code,
            "name":prop.name,
            "Id":prop.id || uuidv4(),
            "phones":{
                "store":[prop.phones]},
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


