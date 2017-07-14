
// This module handle the health check request
import * as express from 'express';

import { applog } from '@ses/common';
const log = applog.logger('healcheck');

var pretime = 0;

// check db connection and holding buckets' size
async function healthCheck(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  let curtime = new Date().getTime();
  if (curtime - pretime >= 60 * 2) {
    log.warn('healthCheck recevied request');
    pretime = new Date().getTime();
  }

  res.sendStatus(200);
}

export { healthCheck }
