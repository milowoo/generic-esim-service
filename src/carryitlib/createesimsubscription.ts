import * as _request from 'request';
import { applog, config } from '@common';
import { createEsimSubscriptionError } from './errormap';

const logger = applog.logger('createesimsubscription');
const configFile: string = 'esimService/itSystemServerConf.json';

interface CreateEsimSubscriptionReq {
  iccid: string;
  accessToken?: string;
  primaryMsisdn: string;
  primaryImsi: string;
  msisdn: string;
  imsi: string;
  selectPlanId: string;
}

async function createEsimSubscription(reqObj: CreateEsimSubscriptionReq): Promise<number> {
  const itServers = config.get(configFile, 'itSystem-servers');

  let itServer = itServers[0];
  let createEsimSubscriptionPath = itServer.es2PlusPlusInfo.paths.createEsimSubscriptionPath;
  let es2Fqdn = itServer.es2PlusPlusInfo.es2FQDN;
  let url = es2Fqdn + createEsimSubscriptionPath;

  let currentTime = new Date().toISOString();
  let transid = '112' + currentTime;

  let reqbody = {
    'primary-msisdn': reqObj.primaryMsisdn,
    'primary-imsi': reqObj.primaryImsi,
    'secondary-msisdn': reqObj.msisdn,
    'secondary-imsi': reqObj.imsi,
    'iccid': reqObj.iccid,
  }

  if (reqObj.selectPlanId) {
    reqbody['selected-plan-id'] = reqObj.selectPlanId;
  }

  let options = {
    url: url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-transaction-id': transid,
      'deviceType': 'Handheld with SIM',
      'transactionIdKey': reqObj.iccid,
      //'Authorization': 'Bearer testAccessToken',
      'x-nsds-version': '2.0'
    },
    body: JSON.stringify(reqbody)
  };


  logger.info('createEsimSubscription request:\n', options);

  return new Promise<number>((resolve, reject) => {
    _request(options, (err, response, body) => {
      if (err) {
        reject(err);
        logger.error('Failed in createEsimSubscription request.', err);
      } else {
        logger.info('createEsimSubscription statusCode ', response.statusCode);
        resolve(response.statusCode);
        switch (response.statusCode) {
          case 200: {
            logger.info('createEsimSubscription success ');
            resolve(response.statusCode);
          }
            break;
          case 400: {
            const error: createEsimSubscriptionError = new createEsimSubscriptionError('INVALID_REQUEST');
            logger.error(response.statusCode, error.errorCode, error.message);
            reject(error);
          }
            break;
          case 500: {
            const error: createEsimSubscriptionError = new createEsimSubscriptionError('INVALID_RESPONSE');
            logger.error(response.statusCode, error.errorCode, error.message);
            reject(error);
          }
            break;
          default: {
            const error: createEsimSubscriptionError = new createEsimSubscriptionError('UNKNOWN');
            logger.error(response.statusCode, error.errorCode, error.message);
            reject(error);
          }
        }
      }
    });
  });
}

export { CreateEsimSubscriptionReq, createEsimSubscription };
