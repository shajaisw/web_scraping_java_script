import fs from "fs";
import axios from "axios";
import { type } from "os";

const processScraping = async () => {
  // Configure axios to ignore SSL certificate validation errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const savename = "americanexpress_aus";
  console.log('start fetching')
  let jsonData = {
    siteId: '323',
    chainName: 'American Express',
    ISO: 'AUS',
    SN: '25694',
    category: 'Bank,ATM',
    url: 'https://network.americanexpress.com/globalnetwork/atm_locator/en/#search/-37.8136276/144.9630576',
    entities: []
  }

  let jsonString = ``
  let url = `https://apigateway.americanexpress.com/digitalnetwork/v1/atms?callback=jQuery18000072548682262840725_1712299220741&appKey=AF8DE528A59B33FBAD6C137A666E0786&applicationId=AXPDNGLOCP001&srvcAccKey=%40ys6n4NfNY5%23fA2Z&requestId=1&clientId=atoaDnCmsATMPoi&radius=50&radiusUnit=MI&resPageSize=100&poiType=ATM&pageNo=1&formatType=JSONP&latitude=-37.8136276&longitude=144.9630576&_=1712299222292`

      const res = await axios.get(url)
      jsonString = res.data;

    //   const dataString = JSON.stringify(jsonString).replace('jQuery18000072548682262840725_1712299220741(', '').replace(')', '').trim();
    //   const jsonStringData =dataString.replace(/\\/g, '').replace(/\n\s+/g, '').replace(/n\s+/g, '')
    // console.log('jsonStringData-> ', jsonStringData);
const dataString = jsonString.replace(/^[^(]*\((.*)\)[^)]*$/, '$1');
const cleanedDataString = dataString.replace(/\\/g, '').replace(/\n\s+/g, '').replace(/n\s+/g, '');
let data = JSON.parse(cleanedDataString).GeoPOISearchResponse.poiDetails.poiDetail;

console.log('arrayData-> ', data);
  
    let entities = []
    let count = 0

    for (const item of data) {
      let latitude = ``;
      let longitude = ``;
      let address = ``;
      let postal_code = ``;
      if (item.poiAddressDetails) {
        const address = item.poiAddressDetails.address;
        const city = item.poiAddressDetails.city;
        const postal_code = item.poiAddressDetails.postalCode;
        const latitude = item.poiAddressDetails.geoLocationDetails.latitude;
        const longitude = item.poiAddressDetails.geoLocationDetails.longitude;

        entities.push({
          id: item.poiUniqueId,
          name: item.poiName,
          postal_code: postal_code,
          type: item.poiType,
          city: city,
          address: address,
          latitude: latitude,
          longitude: longitude,
        });
      }
    }
    console.log('res-> ', entities[0])

    jsonData.entities = entities
 fs.writeFileSync(`../2024-1-done/${savename}.json`, JSON.stringify(jsonData, null, 2))
};

processScraping()
