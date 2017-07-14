import * as _request from 'request';
import { applog, config } from '@common';
import { QueryImsiByIccidError } from './errormap';

const logger = applog.logger('queryImsiByIccid');
const configFile: string = 'esimService/itSystemServerConf.json';

interface QueryImsiByIccidReq {
  iccid: string;
  accessToken?: string;
}

interface QueryImsiByIccidRsp {
  iccid: string;
  imsi: string;
  msisdn?: string;
}

function validateRsp(rspObj: any): boolean {
  return !('imsi' in rspObj);
}

async function queryImsiByIccid(reqObj: QueryImsiByIccidReq): Promise<QueryImsiByIccidRsp> {
  const itServers = config.get(configFile, 'itSystem-servers');

  let itServer = itServers[0];
  let queryImsiByIccidPath = itServer.es2PlusPlusInfo.paths.queryImsiByIccidPath;
  let es2Fqdn = itServer.es2PlusPlusInfo.es2FQDN;
  let url = es2Fqdn + queryImsiByIccidPath + reqObj.iccid;

  let currentTime = new Date().toISOString();
  let transid = '112' + currentTime;

  let options = {
    url: url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-transaction-id': transid,
      'deviceType': 'Handheld with SIM',
      'x-nsds-version': '2.0'
    }
  };


  logger.info('queryImsiByIccid request:\n', options);

  return new Promise<QueryImsiByIccidRsp>((resolve, reject) => {
    _request(options, (err, response, body) => {
      if (err) {
        reject(err);
        logger.error('Failed in QueryImsiByIccid request.', err);
      } else {
        let rspBody: any = undefined;
        logger.debug('response: ' + body);

        if (body) {
          try {
            rspBody = JSON.parse(body);
          } catch (err) {
            const error: QueryImsiByIccidError = new QueryImsiByIccidError('INVALID_RESPONSE');
            logger.error(err, error.errorCode, error.message);
            reject(error);
          }
        }

        switch (response.statusCode) {
          case 200: {
            if (validateRsp(rspBody)) {
              const error: QueryImsiByIccidError = new QueryImsiByIccidError('INVALID_RESPONSE');
              logger.error(response.statusCode, error.errorCode, error.message);
              reject(error);
            } else {
              logger.info('QueryImsiByIccid success');
              logger.debug('response:\n', rspBody);
              resolve(rspBody);
            }
          }
            break;
          case 400: {
            const error: QueryImsiByIccidError = new QueryImsiByIccidError('INVALID_REQUEST');
            logger.error(response.statusCode.toString(), error.errorCode, error.message);
            reject(error);
          }
            break;
          case 404: {
            const error: QueryImsiByIccidError = new QueryImsiByIccidError('INVALID_RESPONSE');
            logger.error(response.statusCode.toString(), error.errorCode, error.message);
            reject(error);
          }
            break;
          case 500: {
            const error: QueryImsiByIccidError = new QueryImsiByIccidError('MSISDN_ACTIVATION_ERROR');
            logger.error(response.statusCode.toString(), error.errorCode, error.message);
            reject(error);
          }
            break;
          case 504: {
            const error: QueryImsiByIccidError = new QueryImsiByIccidError('IMSI_REPOSITORY_TIMEOUT');
            logger.error(response.statusCode.toString(), error.errorCode, error.message);
            reject(error);
          }
            break;
          default: {
            const error: QueryImsiByIccidError = new QueryImsiByIccidError('UNKNOWN');
            logger.error(response.statusCode ? response.statusCode.toString() : 'undefined statusCode',
              error.errorCode, error.message);
            reject(error);
          }
        }
      }
    });
  });
}

export { QueryImsiByIccidReq, QueryImsiByIccidRsp, queryImsiByIccid };
