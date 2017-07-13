// 'trace' and 'clarify' help to print stack trace following async calls
import * as express from 'express';

import './loginit';
import { applog } from '@common';
import { globalSvrRef } from './server';
import { initSchema } from './db';
import { discovery } from '@distributed';

const log = applog.logger('main');

async function start(): Promise<void> {
  log.info('Service starting...');

  try {
    await initSchema();
    const port: number = 9220;
    const app: express.Express = await globalSvrRef.server();
    const node = await discovery.localNode();
    app.listen(port, node.AdvertiseAddr);

    log.info('Generic Esim Service started, listening on port:%d', port);
  } catch (err) {
    log.fatal(err, 'Failed to start up. Exit.');
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  log.info('Gracefully shutdown ...');
  globalSvrRef.shutdown();
  process.exit(0);
});

process.on('uncaughtException', function(err: any): void {
  log.error(err, 'exception occuried');
  process.exit(1);
});

start();
