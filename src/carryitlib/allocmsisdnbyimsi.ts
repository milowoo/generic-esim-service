import * as _request from 'request';
import { applog, config } from '@common';
import { AllocMsisdnByImsiError } from './errormap';

const logger = applog.logger('allocMsisdnByImsi');
const configFile: string = 'esimService/itSystemServerConf.json';

interface allocMsisdnByImsiReq {
  imsi: string;
  transactionIdKey?: string;
}

interface allocMsisdnByImsiRsp {
  msisdn: string;
}


function validateRsp(rspObj: any): boolean {
  return !('msisdn' in rspObj);
}

async function allocMsisdnByImsi(reqObj: allocMsisdnByImsiReq): Promise<allocMsisdnByImsiRsp> {
  const itsystemServers = config.get(configFile, 'itSystem-servers');

  let itsystemServer = itsystemServers[0];
  let allocImsiByImsiPath = itsystemServer.es2PlusPlusInfo.paths.allocMsisdnByImsiPath;
  let es2Fqdn = itsystemServer.es2PlusPlusInfo.es2FQDN;
  let url = es2Fqdn + allocImsiByImsiPath;

  let options = {
    url: url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'deviceType': 'Handheld with SIM',
      'x-nsds-version': '2.0'
    },
    body: JSON.stringify(reqObj)
  };

  if (reqObj.transactionIdKey) {
    options.headers['x-transaction-id'] = reqObj.transactionIdKey;
  }

  logger.info('allocMsisdnByImsi rquest:\n', options);

  return new Promise<allocMsisdnByImsiRsp>((resolve, reject) => {
    _request(options, (err, response, body) => {
      if (err) {
        logger.error('Failed in allocMsisdnByImsi request.', err);
        reject(err);
      } else {
        let rspBody: any = undefined;
        logger.debug('response: ' + body);

        if (body) {
          try {
            rspBody = JSON.parse(body);
          } catch (err) {
            const error: AllocMsisdnByImsiError = new AllocMsisdnByImsiError('INVALID_RESPONSE');
            logger.error(err, error.errorCode, error.message);
            reject(error);
          }
        }

        switch (response.statusCode) {
          case 200: {
            if (validateRsp(rspBody)) {
              const error: AllocMsisdnByImsiError = new AllocMsisdnByImsiError('INVALID_RESPONSE');
              logger.error(response.statusCode, error.errorCode, error.message);
              reject(error);
            } else {
              logger.info('allocMsisdnByImsi success');
              logger.debug('response:\n', rspBody);
              resolve(rspBody);
            }
          }
            break;
          case 400: {
            const error: AllocMsisdnByImsiError = new AllocMsisdnByImsiError('INVALID_REQUEST.');
            logger.error(response.statusCode, error.errorCode, error.message);
            reject(error);
          }
            break;
          default: {
            const error: AllocMsisdnByImsiError = new AllocMsisdnByImsiError('UNKNOWN');
            logger.error(response.statusCode ? response.statusCode : 'undefined statusCode',
              error.errorCode, error.message);
            reject(error);
          }
        }
      }
    });
  });
}

export { allocMsisdnByImsiReq, allocMsisdnByImsiRsp, allocMsisdnByImsi };
