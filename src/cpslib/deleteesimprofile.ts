import { applog, config } from '@common';
import { invokeSoapMethod } from './soapservice';
import { init } from './soapservice';

const logger = applog.logger('deleteEsimProfile');
const configFile: string = 'esimService/cpsServerConf.json';


interface DeleteEsimProfileReq {
  transactionId: string;
  imsi: string;
  msisdn: string;
}


async function soapinterface_del(reqObj: DeleteEsimProfileReq): Promise<number> {
  const cpsServers = config.get(configFile, 'cps-servers');
  let cpsServer = cpsServers[0];
  const serviceName = cpsServer.soapServerName;
  const soapMethod = 'Delete';
  const soapHeaders = {
  };
  // const soapBodyObj = reqObj.body;
  const overrideEndpoints = undefined;
  const moType = cpsServer.MOType;
  const headers = {
    'x-transaction-id': reqObj.transactionId
  };


  let soapBodyObj = {
    MOType: moType,
    MOId: {
      imsi: reqObj.imsi,
      msisdn: reqObj.msisdn
    },
    MOAttributes: {
      DeleteESIMSubscription: {
        attributes: {
          imsi: reqObj.imsi,
          msisdn: reqObj.msisdn
        }
      }
    }
  };

  logger.info('soapinterface_del begin');
  try {
    await init();
  } catch (err) {
    logger.info(err, '[soap init err');
    return 404;
  }

  if (!serviceName) {
    logger.info('Missing parameter: serviceName:%s', serviceName);
    return 400;
  }

  if (!soapMethod) {
    logger.info('Missing parameter: operation:%s', soapMethod);
    return 400;
  }

  try {
    const resultData = await invokeSoapMethod(serviceName, soapMethod, soapBodyObj,
      { soapHeaders, overrideEndpoints, httpHeaders: headers });

    logger.info('response inf ', resultData);
    if (resultData.succeed === true) {
      logger.info('invokeSoapMethod success');
      return 200;
    } else {
      logger.info('invokeSoapMethod failed');
      return 404;
    }
  } catch (err) {
    logger.warn(err, '[' + serviceName + ':' + soapMethod + '] invoked error.');
    return 500;
  }
  return 200;
}

async function deleteEsimProfile(reqObj: DeleteEsimProfileReq): Promise<number> {
  logger.info('deleteEsimProfile begin');
  const status = await soapinterface_del(reqObj);
  return status;
}

export { DeleteEsimProfileReq, deleteEsimProfile };
