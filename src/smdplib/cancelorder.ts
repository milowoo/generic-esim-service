import * as _request from 'request';
import * as fs from 'fs';
import { applog, config } from '@common';
import { CancelOrderError } from './errormap';

const logger = applog.logger('CancelOrder');
const configFile: string = 'esimService/smdpServerProfile.json';

interface CancelOrderReq {
  iccid: string;
  eid?: string;
  matchingId?: string;
  finalProfileStatusIndicator?: string;
}


interface CancelOrderRsp {
  status: string;
  reasonCode?: string;
  message?: string;
}



function validateRsp(rspObj: any): boolean {
  return false;
}

async function cancelOrder(reqObj: CancelOrderReq): Promise<CancelOrderRsp> {
  const smdpServers = config.get(configFile, 'smdp-servers');

  let smdpServer = smdpServers[0];
  let cancelOrderPath = smdpServer.es2PlusPlusInfo.paths.cancelOrderPath;
  let es2Fqdn = smdpServer.es2PlusPlusInfo.es2FQDN;
  let url = es2Fqdn + cancelOrderPath;
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
  }

  logger.info('Cancel Order request:\n', options);

  return new Promise<CancelOrderRsp>((resolve, reject) => {
    _request(options, (err, response, body) => {
      if (err) {
        reject(err);
        logger.error('Failed in cancelOrder request.', err);
      } else {
        let rspBody: any = undefined;
        logger.debug('response: ' + body);

        if (body) {
          try {
            rspBody = JSON.parse(body);
          } catch (err) {
            const error: CancelOrderError = new CancelOrderError('INVALID_RESPONSE');
            logger.error(err, error.errorCode, error.message);
            reject(error);
          }
        }

        switch (response.statusCode) {
          case 200: {
            if (validateRsp(rspBody)) {
              const error: CancelOrderError = new CancelOrderError('INVALID_RESPONSE');
              logger.error(response.statusCode, error.errorCode, error.message);
              reject(error);
            } else {
              logger.info('CancelOrder success');
              logger.debug('response:\n', rspBody);
              let resheader = rspBody.header;
              let functionExecutionStatus = resheader.functionExecutionStatus;
              if (functionExecutionStatus.status === 'Executed-Success') {
                let cancelrsp = {
                  status: 'Executed-Success'
                }
                resolve(cancelrsp);
              } else {
                let cancelrsp = {
                  status: 'Failed',
                  reasonCode: rspBody.reasonCode,
                  message: rspBody.message
                }
                resolve(cancelrsp);
              }
            }
          }
            break;
          case 400: {
            const error: CancelOrderError = new CancelOrderError('INVALID_REQUEST');
            logger.error(response.statusCode.toString(), error.errorCode, error.message);
            reject(error);
          }
            break;
          case 502: {
            const error: CancelOrderError = new CancelOrderError('UNREACHABLE');
            logger.error(response.statusCode.toString(), error.errorCode, error.message);
            reject(error);
          }
            break;
          case 503: {
            const error: CancelOrderError = new CancelOrderError('TIMEOUT');
            logger.error(response.statusCode.toString(), error.errorCode, error.message);
            reject(error);
          }
            break;
          default: {
            const error: CancelOrderError = new CancelOrderError('UNKNOWN');
            logger.error(response.statusCode ? response.statusCode.toString() : 'undefined statusCode',
              error.errorCode, error.message);
            reject(error);
          }
        }
      }
    });
  });
}

export { CancelOrderReq, CancelOrderRsp, cancelOrder };
