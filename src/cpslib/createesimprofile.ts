import { applog, config } from '@common';
import { invokeSoapMethod } from './soapservice';
import { init } from './soapservice';

const logger = applog.logger('createEsimProfile');
const configFile: string = 'esimService/cpsServerConf.json';

interface CreateEsimProfileReq {
  transactionId: string;
  imsi: string;
  msisdn: string;
  AuthSub: {
    EncryptedK: string;
    A4KeyInd: number;
    FSetInd: number;
    Amf?: string;
    EncryptedOPc?: string;
  };
  EPSSub?: {
    epsProfileId: string;
    epsOdb: string;
    epsRoamingAllowed: boolean;
    epsIndividualDefaultContextId: number;
    epsIndividualContextId?: number;
    epsIndividualSubscribedChargingCharacteristic?: number;
    epsIndividualAmbrMaximalUplinkIpFlow?: number;
    epsIndividualAmbrMaximalDownlinkIpFlow?: number;
    epsIndividualRatFrequencyPriorityId?: number;
    epsSessionTransferNumber?: string;
    epsCommonMsisdn?: string;
  };
}

async function soapinterface(reqObj: CreateEsimProfileReq): Promise<number> {
  const cpsServers = config.get(configFile, 'cps-servers');
  let cpsServer = cpsServers[0];
  const serviceName = cpsServer.soapServerName;
  const soapMethod = 'Create';
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
      CreateESIMSubscription: {
        imsi: reqObj.imsi,
        msisdn: reqObj.msisdn,
        AuthSub: reqObj.AuthSub,
        EPSSub: reqObj.EPSSub,
        attributes: {
          imsi: reqObj.imsi,
          msisdn: reqObj.msisdn
        }
      }
    }
  };


  logger.info('soapinterface begin');
  logger.info('imsi = %s ', reqObj.imsi);
  logger.info('msisdn = %s ', reqObj.msisdn);

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

async function createEsimProfile(reqObj: CreateEsimProfileReq): Promise<number> {
  logger.info('createEsimProfile begin');
  const status = await soapinterface(reqObj);
  return status;
}

export { CreateEsimProfileReq, createEsimProfile };
