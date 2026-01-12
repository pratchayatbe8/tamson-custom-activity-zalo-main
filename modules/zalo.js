const axios = require('axios');
const config = require('../config');
const FormData = require('form-data');
const { application } = require('express');
//Blake addition the https lib.
const https = require('https');
const { error } = require('console');
const { v4: uuidv4 } = require('uuid');

const zalo = {};

/**
 * ============================================================================
 * get ZALO ZNS Template Detail
 * 
 * ============================================================================
 */
zalo.getZNSTemplateDetail = (token, templateId) => {
  let endpoint = `${config.zalo.znsEndpoint}/template/info/v2?template_id=${templateId}`;

  const options = {
    method: 'get',
    url: endpoint,
    responseType: 'json',
    //Blake addition the prameter to keep alive.
    httpsAgent: new https.Agent({ keepAlive: true }),
    headers: {
      'access_token': token
    },
    timeout: 120000
  }

  return axios(options);
}

/**
 * ============================================================================
 * GET ALL ZNS Templates name/id
 * 
 * ============================================================================
 */
zalo.getZNSTemplates = async (
  token,
  offset = 0,
  limit = 100,
  collected = [],
  total = null
) => {
  const endpoint =
    `${config.zalo.znsEndpoint}/template/all?offset=${offset}&limit=${limit}&status=1`;

  const options = {
    method: 'get',
    url: endpoint,
    httpsAgent: new https.Agent({ keepAlive: true }),
    headers: {
      'access_token': token,
      'Content-Type': 'application/json'
    },
    timeout: 240000
  };

  const response = await axios(options);

  const { error, message, data = [], metadata = {} } = response.data || {};

  if (error !== 0) {
    return {
      ...response,
      data: {
        error,
        message,
        data: [],
        metadata: { total: 0 }
      }
    };
  }

  const overallTotal =
    total !== null ? total : metadata.total || data.length;

  const allData = collected.concat(data);
  const nextOffset = offset + limit;

  if (data.length === 0 || nextOffset >= overallTotal) {
    return {
      ...response,
      data: {
        error,
        message,
        data: allData,
        metadata: { total: overallTotal }
      }
    };
  }

  return zalo.getZNSTemplates(
    token,
    nextOffset,
    limit,
    allData,
    overallTotal
  );
};

/**
 * ============================================================================
 * Send Message ZaloOA/ZNS
 * 
 * ============================================================================
 */
zalo.sendMessage = (token, payload, messageType, zaloMessageType) => {


  let type = 'cs';

  if (zaloMessageType === 'CONSULTING')
    type = 'cs';
  else if (zaloMessageType === 'TRADING')
    type = 'transaction'
  else if (zaloMessageType === 'MEDIA')
    type = 'promotion';

  const options = {
    method: 'post',
    url: (messageType === 'ZaloOA') ? `${config.zalo.oaEndpoint}/${type}` : `${config.zalo.znsEndpoint}/message/template`,
    responseType: 'json',
    data: payload,
    //Blake addition the prameter to keep alive.
    httpsAgent: new https.Agent({ keepAlive: true }),
    headers: {
      'Content-Type': 'application/json',
      'access_token': token,
    },
    timeout: 120000
  }

  return axios(options);

}

/**
 * ============================================================================
 * Currently not in use in this project
 * 
 * ============================================================================
 */
// zalo.uploadFile = (token, fileContent, fileName) => {
//   const data = new FormData();
//   data.append('file', fileContent, fileName);

//   const options = {
//     method: 'post',
//     url: config.zalo.uploadFileEndpoint,
//     responseType: 'json',
//     //Blake addition the prameter to keep alive.
//     httpsAgent: new https.Agent({ keepAlive: true }),
//     headers: {
//       'access_token': token,
//       ...data.getHeaders()
//     },
//     data: data,
//     timeout: 120000
//   }

//   return axios(options);
// }

module.exports = zalo;