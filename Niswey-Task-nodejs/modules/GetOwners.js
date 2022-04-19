const hubspot = require('@hubspot/api-client')

module.exports = getOwnerName = async (access_token,id) =>{
  
    const hubspotClient = new hubspot.Client({"accessToken" : access_token});
  
    const ownerId = id;
    const idProperty = "userid";
    const archived = false;
  
  try {
    const apiResponse = await hubspotClient.crm.owners.ownersApi.getById(ownerId, idProperty, archived);
    //console.log(JSON.parse(JSON.stringify(apiResponse, null, 2)));
    return JSON.parse(JSON.stringify(apiResponse, null, 2))
    } 
    catch (e) {
    e.message === 'HTTP request failed'
      ? console.error(JSON.stringify(e.response, null, 2))
      : console.error(e)
        }
  }
