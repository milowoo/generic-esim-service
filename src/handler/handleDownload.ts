// This module handledownload

import * as express from 'express';

import { applog } from '@common';
import { db } from '../db';
import { reqType } from '../models';

const log = applog.logger('handledownload');
const requestType = reqType.download;


export type Request = express.Request;
export type Response = express.Response;
export type NextFunction = express.NextFunction;

function validateReq(req: Request, res: Response, next: NextFunction): void {
  // first check header
  log.debug('income req handledownload: ', req.method, req.url, req.body);
  if (req.get('Content-type') !== 'application/json') {
    return next({ reqType: requestType, errcode: '91301', message: 'Invalid value of parameter:{Content-type}' });
  }

  // second check param, iccid is a required parameter
  if (!req.body.iccid || !req.body.notificationPointId || !req.body.notificationPointStatus) {
    return next({
      reqType: requestType, errcode: '91301',
      message: 'Invalid value of parameter:{iccid}'
    });
  }
  return next();
}

async function handledownload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await db.queryEsimSubscriptionByIccId(req.body.iccid);
    log.debug(' income req for handledownload-queryEsimSubscriptionByIccId:%s %s', req.body.iccid, result.rows.length);
    if (result.rows.length > 0) {
      const iccid_status: string = result.rows[0].iccid_status;
      log.debug('income req handledownload-queryEsimSubscriptionByIccId iccid_status:%s', iccid_status);
      if (iccid_status !== 'Released' && iccid_status !== 'Downloaded') {
        const addictionalLog = 'handledownload error with parameter:{iccid:' + req.body.iccid + '}';
        log.error('not allow download iccid_status:%s ', iccid_status);
        return next({ reqType: requestType, errcode: '91303', addictional: addictionalLog });
      }

      if (req.body.notificationPointId === '3') {
        await db.updateEsimSubscriptionByiccid(req.body.iccid, 'Downloaded');
      } else if (req.body.notificationPointId === '4') {
        await db.updateEsimSubscriptionByiccid(req.body.iccid, 'Installed');
      }

      res.status(204).end();
    } else {
      const addictionalLog = 'queryEsimSubscriptionByIccId is not found! :{iccid:' + req.body.iccid + '}';
      return next({ reqType: requestType, errcode: '91302', addictional: addictionalLog });
    }
  } catch (err) {
    log.error('income req handledownload database expception:%s', err);
    return next({ reqType: requestType, errcode: '91302', addictional: err.toString() });
  }
}

export {
  validateReq,
  handledownload
}
