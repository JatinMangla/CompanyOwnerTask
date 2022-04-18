require('dotenv').config();
const express = require('express');
const request = require('request-promise-native');
const session = require('express-session');
const NodeCache = require('node-cache');
const opn = require('open');
const app = express();
const bodyParser=require("body-parser");
const hubspot = require('@hubspot/api-client')
const axios = require('axios')
require('./modules/GetOwners')
require('./modules/Getcompanies')
require('./modules/Getcompaniesnext')

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const PORT = 3002;
var nextdata=""

const refreshTokenStore = {};
const accessTokenCache = new NodeCache({ deleteOnExpire: true });


// Client id and Client secret from .env
if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    throw new Error('Missing CLIENT_ID or CLIENT_SECRET environment variable.')
}

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const REDIRECT_URI = `https://migration.niswey.net/jatin/oauth-callback`;


//session 
app.use(session({
  secret: Math.random().toString(36).substring(2),
  resave: false,
  saveUninitialized: true
}));


// authorize URL
const authUrl =`https://app.hubspot.com/oauth/authorize?client_id=0f64724f-0a95-499b-910d-909096b149f2&redirect_uri=https://migration.niswey.net/jatin/oauth-callback&scope=crm.lists.read%20crm.objects.contacts.read%20crm.objects.contacts.write%20crm.objects.companies.write%20crm.lists.write%20crm.objects.companies.read%20crm.objects.deals.read%20crm.objects.deals.write%20crm.objects.owners.read`

// install app

app.get('/install', (req, res) => {
  console.log('');
  console.log(' Starting OAuth.... ');
  console.log('');
  console.log(" opening install URL");
  res.redirect(authUrl);
});

// sending request to the server
// receive authorize code
app.get('/oauth-callback', async (req, res) => {

  if (req.query.code) {
    console.log(' Received an authorization token');

    const authCodeProof = {
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code: req.query.code
    };


    console.log('Exchanging authorization code for an access token and refresh token');
    const token = await exchangeForTokens(req.sessionID, authCodeProof);
    if (token.message) {
      return res.redirect(`/error?msg=${token.message}`);
    }

    res.redirect(`/jatin`);
  }
});


//   exchanging Proof for an Access Token   

const exchangeForTokens = async (userId, exchangeProof) => {
  try {
    const responseBody = await request.post('https://api.hubapi.com/oauth/v1/token', {
      form: exchangeProof
      
    });
    

    const tokens = JSON.parse(responseBody);
    refreshTokenStore[userId] = tokens.refresh_token;
    accessTokenCache.set(userId, tokens.access_token, Math.round(tokens.expires_in * 0.75));

    console.log(' Received an access token and refresh token');
    return tokens.access_token;
  } catch (e) {
    console.error(` Error exchanging ${exchangeProof.grant_type} for access token`);
    return JSON.parse(e.response.body);
  }
};

const refreshAccessToken = async (userId) => {
  const refreshTokenProof = {
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    refresh_token: refreshTokenStore[userId]
  };
  return await exchangeForTokens(userId, refreshTokenProof);
};


// getting new access token with refresh token
const getAccessToken = async (userId) => {

  if (!accessTokenCache.get(userId)) {
    console.log('Refreshing expired access token');
    await refreshAccessToken(userId);
  }
  return accessTokenCache.get(userId);
};

const isAuthorized = (userId) => {
  return refreshTokenStore[userId] ? true : false;
};


//get companies name and owner name

  app.get('/',async(req,res)=>{
    res.setHeader('Content-Type', 'text/html');
    if (isAuthorized(req.sessionID)) {
  
      const aaccessToken = await getAccessToken(req.sessionID);

      const details = await axios.get(`https://api.hubapi.com/oauth/v1/access-tokens/${aaccessToken}`)
      const user_id = details.data.user
      const portal_id = details.data.hub_id

      const userdata = {user_id, portal_id}
      //res.render("Table",{user:userdata});

      const comnpanyDetail = []
      const companies = await getCompanies(aaccessToken);
      const check = companies.results
      nextdata = companies.paging.next.after
      
     var company ;
      for (company of check)
      {
        const companyowner = await getOwnerName(aaccessToken,company.properties.hubspot_owner_id) 
           
          const companyname = JSON.parse(JSON.stringify(company.properties.name))
          const ownername = JSON.parse(JSON.stringify(companyowner.firstName))
          
          if(ownername != null||undefined)
          {
            const singleCompany = {
              "companyname" :companyname,
              "ownername" : ownername
             }
             comnpanyDetail.push(singleCompany);

          }
          else
          {
            const singleCompany = {
              "companyname" :companyname,
              "ownername" : "NA"
             }
             comnpanyDetail.push(singleCompany);
          }
         
  
      }
        console.log(comnpanyDetail);
  
        res.render("Table",{companies:comnpanyDetail,user:userdata})
      
        }
        else {
            res.write(`<a href="/jatin/install"><h3>Install the app</h3></a>`);
          }
          res.end();
  })

  app.get('/next',async(req,res)=>{
    res.setHeader('Content-Type', 'text/html');
    if (isAuthorized(req.sessionID)) {
  
      const aaccessToken = await getAccessToken(req.sessionID);

      const details = await axios.get(`https://api.hubapi.com/oauth/v1/access-tokens/${aaccessToken}`)
      const user_id = details.data.user
      const portal_id = details.data.hub_id

      const userdata = {user_id :user_id, portal_id: portal_id}
      
      const comnpanyDetail = []
      const last = nextdata
      const companies = await getCompaniesnext(aaccessToken,nextdata);
      const check = companies.results
      // console.log(value)

      var company ;
      for (company of check)
      {
        const companyowner = await getOwnerName(aaccessToken,company.properties.hubspot_owner_id) 
           
          const companyname = JSON.parse(JSON.stringify(company.properties.name))
          //const ownername = JSON.parse(JSON.stringify(companyowner.firstName))
          
         
          if(typeof(companyowner) != "undefined")
          {
            const singleCompany = {
              "companyname" :companyname,
              "ownername" : JSON.parse(JSON.stringify(companyowner.firstName))
             }
             comnpanyDetail.push(singleCompany);

          }
          else
          {
            const singleCompany = {
              "companyname" :companyname,
              "ownername" : "NA"
             }
             comnpanyDetail.push(singleCompany);
          }
      }
        console.log(comnpanyDetail);
  
        res.render("Table",{companies:comnpanyDetail,user:userdata})

        //nextdata =  companies.paging.next.after
       
       
       if(typeof(companies.paging) != "undefined")
       {
            nextdata =  companies.paging.next.after
       }
       else{
         nextdata = last
       }
      
        }
        else {
            res.write(`<a href="/jatin/install"><h3>Install the app</h3></a>`);
          }
          res.end();
  })



  app.get("/logout", function(req, res) {
    req.session.destroy(() => {
      accessTokenCache.flushAll();
     res.redirect("/jatin"); 
   });
  })


  //error occur

  app.get('/error', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.write(`<h4>Error: ${req.query.msg}</h4>`);
    res.end();
    console.log(`error`)
  });
  
  app.listen(PORT, () => console.log(`=== Starting your app on http://localhost:${PORT} ===`));
  opn(`http://localhost:${PORT}`);