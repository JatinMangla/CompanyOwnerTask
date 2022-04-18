const hubspot = require('@hubspot/api-client')
 
 module.exports = getCompanies = async (aaccessToken) =>{

    const hubspotClient = new hubspot.Client({"accessToken": aaccessToken});
  
      const limit = 5;
  const after = undefined;
  const properties = [
            " hubspot_owner_id",
            "name"
     ];
  
  
  try {
    const apiResponse = await hubspotClient.crm.companies.basicApi.getPage(limit, after, properties);
    
    return JSON.parse(JSON.stringify(apiResponse,null,2));
 } 
    catch (e) {
    e.message === 'HTTP request failed'
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e)
        }
  }
