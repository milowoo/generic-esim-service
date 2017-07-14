// This Interface module handle the db query
import { applog, config } from '@common';
import { DbHandler } from './dbhandler';
import * as pgSchemaOptions from './postgresql';
import { check } from '@database/schema';

const databaseType: number = config.get('dmsDatabaseChoice', { default: 1 });
const dbUserId = config.get('dmsPgApplicationId');
const dbPasswd = config.get('dmsPgApplicationIdPassword');
const dbIPAddr = config.get('dmsPgApplicationDatabaseIpAddress');
const dbName = config.get('dmsPgApplicationDatabase');
const dbPort = config.get('dmsPgPort');

const log = applog.logger('db');

enum DBTYPE {
  oracle = 0,
  postgres = 1,
};

interface DbInterface {
  checkDBConn(): Promise<boolean>;
  queryEsimSubscription(eid: string): Promise<any>;
  insertEsimSubscription(iccid: string, eid: string, imsi: string): Promise<void>;
  updateEsimSubscription(iccid: string): Promise<number>;
  queryEsimSubscriptionByIccId(iccid: string): Promise<any>;
  updateEsimSubscriptionByiccid(iccid: string, status: string): Promise<number>;
  queryEsimSubcriptionByDeactiva(querystr: string, queryarr: Array<any>): Promise<any>;
  updateEsimSubscrActStaByiccid(iccid: string, status: string): Promise<number>;
  countEsimSubscriptionByEid(eid: string): Promise<any>;
}


function createDb(): DbInterface {
  return new DbHandler(databaseType, dbUserId, dbPasswd, dbIPAddr, dbPort, dbName);
}

async function initSchema(): Promise<void> {
  await check(pgSchemaOptions.schema, pgSchemaOptions.pool);
}

const db: DbInterface = createDb();
log.info('Start server with database\'s type:%d', databaseType);

export {
  DBTYPE,
  DbInterface,
  db,
  initSchema
}
