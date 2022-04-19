const hubspot = require('@hubspot/api-client')
 
 module.exports = getCompanies = async (aaccessToken,next) =>{

    const hubspotClient = new hubspot.Client({"accessToken": aaccessToken});
  
      const limit = 5;
      const after = next;
  const properties = [
            " hubspot_owner_id",
            "name"
     ];
  
  
  try {
    const apiResponse = await hubspotClient.crm.companies.basicApi.getPage(limit,after, properties);
    //console.log(JSON.parse(JSON.stringify(apiResponse,null,2)))
    return JSON.parse(JSON.stringify(apiResponse,null,2));
 } 
    catch (e) {
    e.message === 'HTTP request failed'
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e)
        }
  }
