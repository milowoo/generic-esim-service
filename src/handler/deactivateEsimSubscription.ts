
import * as express from 'express';

import { applog } from '@common';
import { reqType } from '../models';
import { db } from '../db';
import { cancelOrder } from '../smdplib';


const log = applog.logger('deactivateEsimscrb');
const requestType = reqType.activate;

function validateReq(req: express.Request, res: express.Response, next: express.NextFunction): void {
  log.info('income req validateReq:', req.method, req.url, req.body);
  // first check header
  if (req.get('Content-type') !== 'application/json') {
    return next({ reqType: requestType, errcode: '91301', message: 'Invalid value of parameter:{Content-type}' });
  }

  // second check param
  if (!req.query.action || req.query.action !== 'deactivate') {
    log.debug(' esimsubscr validateReq action');
    return next({
      reqType: requestType, errcode: '91301',
      message: 'Invalid value of parameter'
    });
  }

  // second check param
  if (!req.query.eid && !req.query.primaryImsi && !req.query.secondaryImsi &&
    !req.query.secondaryMsisdn && !req.query.iccid) {
    log.debug(' esimsubscr validateReq 3333');
    return next({
      reqType: requestType, errcode: '91301',
      message: 'Invalid value of parameter'
    });
  }


  return next();
}

async function esimsubscr(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    log.info('deactivateEsimscrb esimsubscr begin');
    let inputnum = 0;
    let queryArray: Array<any> = new Array<any>();
    let querystring = 'SELECT eid, iccid, iccid_status, activation_status  FROM generic_esim_subscription_info ' +
      'WHERE 1 = 1 ';

    if (req.query.eid) {
      inputnum = inputnum + 1;
      queryArray.push(req.query.eid);
      querystring += ' and eid = ${' + (inputnum) + '} ';
    }

    if (req.query.primaryImsi) {
      inputnum = inputnum + 1;
      queryArray.push(req.query.primaryImsi);
      querystring += ' and primary_imsi = ${' + (inputnum) + '} ';
    }

    if (req.query.secondaryImsi) {
      inputnum = inputnum + 1;
      queryArray.push(req.query.secondaryImsi);
      querystring += ' and imsi = ${' + (inputnum) + '} ';
    }

    if (req.query.secondaryMsisdn) {
      inputnum = inputnum + 1;
      queryArray.push(req.query.secondaryMsisdn);
      querystring += ' and msisdn = ${' + (inputnum) + '} ';
    }

    if (req.query.iccid) {
      inputnum = inputnum + 1;
      queryArray.push(req.query.iccid);
      querystring += ' and iccid = ${' + (inputnum) + '} ';
    }

    if (inputnum === 0) {
      return next({
        reqType: requestType, errcode: '91301',
        message: 'Invalid value of parameter'
      });
    }

    log.info('querystring:' + querystring);
    log.info('queryArray:' + queryArray);

    const dbquery = await db.queryEsimSubcriptionByDeactiva(querystring, queryArray);

    if (dbquery.rows.length > 0) {
      for (let item of dbquery.rows) {
        const iccid_status = item.iccid_status;
        const activation_status = item.activation_status;
        const iccid = item.iccid;
        const eid = item.eid;
        if (iccid_status === 'Released' && activation_status === 'Active') {
          await db.updateEsimSubscrActStaByiccid(iccid, 'Inactive');
          let cancelreq = {
            iccid: iccid,
            eid: eid,
            finalProfileStatusIndicator: 'Available'
          };

          await cancelOrder(cancelreq);
        }
      }
    } else {
      const addictionalLog = 'db record not found! request';
      return next({ reqType: requestType, errcode: '91305', addictional: addictionalLog });
    }

    log.info('esimsubscr success response 200');
    res.status(200).end();
  } catch (err) {
    log.error(err, 'esimsubscr catch err :{eid:' + req.query.eid + '}');
    return next({ reqType: requestType, errcode: '91302', addictional: err.toString() });
  }
}

export {
  validateReq,
  esimsubscr
}
