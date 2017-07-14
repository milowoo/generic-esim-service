// This module handle activateEsimscrb

import * as express from 'express';

import { applog, config } from '@common';
import { reqType } from '../models';
import { db } from '../db';
import { downloadOrder, confirmOrder } from '../smdplib';
import { allocMsisdnByImsi, createEsimSubscription, queryImsiByIccid } from '../carryitlib';
import { createEsimProfile } from '../cpslib';

const configFile: string = 'esimService/smdpServerProfile.json';

const log = applog.logger('activateEsimscrb');
const requestType = reqType.activate;

function validateReq(req: express.Request, res: express.Response, next: express.NextFunction): void {
  log.info('income req validateReq:', req.method, req.url, req.body);
  // first check header
  if (req.get('Content-type') !== 'application/json') {
    return next({ reqType: requestType, errcode: '91301', message: 'Invalid value of parameter:{Content-type}' });
  }

  // second check param, eid and iccid is a required parameter
  if (!req.body.eid || !req.body['selected-msisdn']) {
    log.debug(' esimsubscr invalidateReq');
    return next({
      reqType: requestType, errcode: '91301',
      message: 'Invalid value of parameter:{eid, msisdn}'
    });
  }

  return next();
}

async function esimsubscr(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    const cpsServers = config.get(configFile, 'smdp-servers');
    let cpsServer = cpsServers[0];
    const maxActSubscrPerEid = cpsServer.sesMaxActiveSubsPerEid * 1;

    const eid = req.body.eid;
    const msisdn = req.body['selected-msisdn'];

    if (maxActSubscrPerEid > 0) {
      const subsnum = await db.countEsimSubscriptionByEid(eid);
      if (maxActSubscrPerEid < subsnum) {
        log.error('esimsubscr per eid max limit :{eid:' + req.body.eid + '}');
        return next({ reqType: requestType, errcode: '91304', addictional: 'per eid max limit' });
      }
    }

    let downreq = {
      eid: eid,
      profileType: req.body['profile-type']
    };

    const downresp = await downloadOrder(downreq);

    const iccid = downresp.iccid;
    await db.insertEsimSubscription(iccid, eid, downresp.eesExtension.imsi);

    let confirreq = {
      iccid: iccid,
      eid: eid,
      releaseFlag: true
    };

    const confirmresp = await confirmOrder(confirreq);

    await db.updateEsimSubscription(iccid);

    let queryImsiByIccidReq = {
      iccid: iccid,
      accessToken: 'test_token'
    };

    const queryImsiByIccidresp = await queryImsiByIccid(queryImsiByIccidReq);

    let allocMsisdnByImsiReq = {
      imsi: queryImsiByIccidresp.imsi,
      transactionIdKey: iccid
    };

    const allocMsisdnByImsiresp = await allocMsisdnByImsi(allocMsisdnByImsiReq);

    let createEsimSubsreq = {
      iccid: iccid,
      accessToken: 'test_token',
      primaryMsisdn: msisdn,
      primaryImsi: queryImsiByIccidresp.imsi,
      msisdn: allocMsisdnByImsiresp.msisdn,
      imsi: queryImsiByIccidresp.imsi,
      selectPlanId: 'test_selectPlantid'
    };

    await createEsimSubscription(createEsimSubsreq);

    let createreq = {
      transactionId: '0111tranid',
      imsi: downresp.eesExtension.imsi,
      msisdn: msisdn,
      AuthSub: {
        EncryptedK: '24AAAFFF8787695BCCF4376BBFFC4000',
        A4KeyInd: 11,
        FSetInd: 11,
        Amf: '1111',
        EncryptedOPc: '18AAAFFF8787695BCCF4376BBFFC4ABC'
      },
      EPSSub: {
        epsProfileId: '4',
        epsOdb: 'ODB-HPLMN-APN',
        epsRoamingAllowed: true,
        epsIndividualDefaultContextId: 2,
        epsIndividualContextId: 2,
        epsIndividualSubscribedChargingCharacteristic: 3,
        epsIndividualAmbrMaximalUplinkIpFlow: 4,
        epsIndividualAmbrMaximalDownlinkIpFlow: 5,
        epsIndividualRatFrequencyPriorityId: 6,
        epsSessionTransferNumber: '77777',
        epsCommonMsisdn: '88888'
      }
    };

    const restnum = await createEsimProfile(createreq);
    if (restnum !== 200) {
      log.error('esimsubscr ema err');
      return next({ reqType: requestType, errcode: '91306', addictional: 'ema err' });
    }

    let respinf = {
      'eid': eid, 'iccid': iccid, 'imsi': downresp.eesExtension.imsi,
      'msisdn': msisdn, 'pin': downresp.eesExtension.pin, 'puk': downresp.eesExtension.puk,
      'smdp-fqdn': confirmresp.smdpAddress, 'matching-id': confirmresp.matchingId
    };

    res.json(respinf);

  } catch (err) {
    log.error(err, 'esimsubscr catch err :{eid:' + req.body.eid + '}');
    return next({ reqType: requestType, errcode: '91302', addictional: err.toString() });
  }
}

export {
  validateReq,
  esimsubscr
}
