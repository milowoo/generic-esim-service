import * as _request from 'request';
import * as fs from 'fs';
import { applog, config } from '@common';
import { ConfirmOrderError } from './errormap';

const logger = applog.logger('ConfirmOrder');
const configFile: string = 'esimService/smdpServerProfile.json';

interface ConfirmOrderReq {
  iccid: string;
  eid?: string;
  releaseFlag: boolean;
}

interface ConfirmOrderRsp {
  matchingId: string;
  smdpAddress?: string;
}

function validateRsp(rspObj: any): boolean {
  return !('matchingId' in rspObj);
}

async function confirmOrder(reqObj: ConfirmOrderReq): Promise<ConfirmOrderRsp> {
  const smdpServers = config.get(configFile, 'smdp-servers');

  let smdpServer = smdpServers[0];
  let confirmOrderPath = smdpServer.es2PlusPlusInfo.paths.confirmOrderPath;
  let es2Fqdn = smdpServer.es2PlusPlusInfo.es2FQDN;
  let url = es2Fqdn + confirmOrderPath;
  let clientKeyFile = smdpServer.es2PlusPlusInfo.certificateKeyForSMDPServer;
  let clientCrtFile = smdpServer.es2PlusPlusInfo.clientCertificateForSMDPServer;
  let caFile = config.get('palSslCaFile', { default: undefined });
  logger.debug('ca:', caFile, '\nclient crt:', clientCrtFile, '\nclient key:', clientKeyFile);

  let options: any = {
    url: url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Admin-Protocol': 'gsma/rsp/v2.0.0'
    },
    body: JSON.stringify(reqObj),
    ca: fs.readFileSync(caFile)
  };
  if (clientKeyFile && clientCrtFile) {
    options.key = fs.readFileSync(clientKeyFile);
    options.cert = fs.readFileSync(clientCrtFile);
  };

  logger.info('Confirm Order request:\n', options);

  return new Promise<ConfirmOrderRsp>((resolve, reject) => {
    _request(options, (err, response, body) => {
      if (err) {
        reject(err);
        logger.error('Failed in DownloadOrder request.', err);
      } else {
        let rspBody: any = undefined;
        logger.debug('response: ' + body);

        if (body) {
          try {
            rspBody = JSON.parse(body);
          } catch (err) {
            const error: ConfirmOrderError = new ConfirmOrderError('INVALID_RESPONSE');
            logger.error(err, error.errorCode, error.message);
            reject(error);
          }
        }

        switch (response.statusCode) {
          case 200: {
            if (validateRsp(rspBody)) {
              const error: ConfirmOrderError = new ConfirmOrderError('INVALID_RESPONSE');
              logger.error(response.statusCode, error.errorCode, error.message);
              reject(error);
            } else {
              logger.info('ConfirmOrder success');
              logger.debug('response:\n', rspBody);
              resolve(rspBody);
            }
          }
            break;
          case 400: {
            const error: ConfirmOrderError = new ConfirmOrderError('INVALID_REQUEST');
            logger.error(response.statusCode.toString(), error.errorCode, error.message);
            reject(error);
          }
            break;
          case 502: {
            const error: ConfirmOrderError = new ConfirmOrderError('UNREACHABLE');
            logger.error(response.statusCode.toString(), error.errorCode, error.message);
            reject(error);
          }
            break;
          case 503: {
            const error: ConfirmOrderError = new ConfirmOrderError('TIMEOUT');
            logger.error(response.statusCode.toString(), error.errorCode, error.message);
            reject(error);
          }
            break;
          default: {
            const error: ConfirmOrderError = new ConfirmOrderError('UNKNOWN');
            logger.error(response.statusCode ? response.statusCode.toString() : 'undefined statusCode',
              error.errorCode, error.message);
            reject(error);
          }
        }
      }
    });
  });
}

export { ConfirmOrderReq, ConfirmOrderRsp, confirmOrder };
