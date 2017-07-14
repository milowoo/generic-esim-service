import * as _request from 'request';
import * as fs from 'fs';
import { applog, config } from '@common';
import { DownloadOrderError } from './errormap';

const logger = applog.logger('DownloadOrder');
const configFile: string = 'esimService/smdpServerProfile.json';

interface DownloadOrderReq {
  eid?: string;
  iccid?: string;
  profileType?: string;
}

interface DownloadOrderRsp {
  iccid: string;
  eesExtension?: EesExtension;
}

interface EesExtension {
  imsi: string;
  pin: string;
  puk: string;
  subscriberKey: string;
  subscriberAMF?: string;
}

function validateRsp(rspObj: any): boolean {
  return !('iccid' in rspObj) ||
    ('eesExtension' in rspObj && !('imsi' in rspObj.eesExtension)
      && !('pin' in rspObj.eesExtension)
      && !('puk' in rspObj.eesExtension)
      && !('subscriberKey' in rspObj.eesExtension));
}

async function downloadOrder(reqObj: DownloadOrderReq): Promise<DownloadOrderRsp> {
  const smdpServers = config.get(configFile, 'smdp-servers');

  let smdpServer = smdpServers[0];
  let downloadOrderPath = smdpServer.es2PlusPlusInfo.paths.downloadOrderPath;
  let es2Fqdn = smdpServer.es2PlusPlusInfo.es2FQDN;
  let url = es2Fqdn + downloadOrderPath;
  let clientKeyFile = smdpServer.es2PlusPlusInfo.certificateKeyForSMDPServer;
  let clientCrtFile = smdpServer.es2PlusPlusInfo.clientCertificateForSMDPServer;
  let caFile = config.get('palSslCaFile', { default: '' });

  logger.debug('DownloadOrderReq = \n', reqObj);
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

  logger.info('Download Order rquest:\n', options);

  return new Promise<DownloadOrderRsp>((resolve, reject) => {
    _request(options, (err, response, body) => {
      if (err) {
        logger.error('Failed in DownloadOrder request.', err);
        reject(err);
      } else {
        let rspBody: any = undefined;
        logger.debug('response: ' + body);

        if (body) {
          try {
            rspBody = JSON.parse(body);
          } catch (err) {
            const error: DownloadOrderError = new DownloadOrderError('INVALID_RESPONSE');
            logger.error(err, error.errorCode, error.message);
            reject(error);
          }
        }

        switch (response.statusCode) {
          case 200: {
            if (validateRsp(rspBody)) {
              const error: DownloadOrderError = new DownloadOrderError('INVALID_RESPONSE');
              logger.error(response.statusCode, error.errorCode, error.message);
              reject(error);
            } else {
              logger.info('DowloadOrder success');
              logger.debug('response:\n', rspBody);
              resolve(rspBody);
            }
          }
            break;
          case 400: {
            const error: DownloadOrderError = new DownloadOrderError('INVALID_REQUEST');
            logger.error(response.statusCode, error.errorCode, error.message);
            reject(error);
          }
            break;
          case 502: {
            const error: DownloadOrderError = new DownloadOrderError('UNREACHABLE');
            logger.error(response.statusCode, error.errorCode, error.message);
            reject(error);
          }
            break;
          case 503: {
            const error: DownloadOrderError = new DownloadOrderError('TIMEOUT');
            logger.error(response.statusCode, error.errorCode, error.message);
            reject(error);
          }
            break;
          default: {
            const error: DownloadOrderError = new DownloadOrderError('UNKNOWN');
            logger.error(response.statusCode ? response.statusCode : 'undefined statusCode',
              error.errorCode, error.message);
            reject(error);
          }
        }
      }
    });
  });
}

export { DownloadOrderReq, EesExtension, DownloadOrderRsp, downloadOrder };
