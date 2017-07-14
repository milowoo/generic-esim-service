import { types } from 'pg';
import { config } from '@common';
import * as pg from '@database/pg';
import { SchemaOptions } from '@database/schema';


types.setTypeParser(20, (val) => Number(val));                         // parse BIGINT

const dbName = config.get('dmsPgApplicationDatabase', { default: 'ses' });
const dbIP = config.get('dmsPgApplicationDatabaseIpAddress', { default: '127.0.0.1' });
const dbPort = config.get('dmsPgPort', { default: 5432 });
const dbUser = config.get('dmsPgApplicationId', { default: 'ses' });
const dbPasswd = config.get('dmsPgApplicationIdPassword', { default: 'ses' });

let poolConfig = {
  user: dbUser,
  database: dbName,
  password: dbPasswd,         // default: no password
  port: Number(dbPort),              // default: 5432
  host: dbIP
};
const pool: pg.Pool = new pg.Pool(poolConfig);

const schema: SchemaOptions = {
  tableName: 'generic_esim_subscription_info',
  rev: 1,
  createSql: `
create table generic_esim_subscription_info
(
iccid VARCHAR(25) not null,
user_id VARCHAR(50) not null,
is_pos NUMERIC(10) not null,
eid VARCHAR(40),
imei VARCHAR(25),
meid VARCHAR(25),
device_type VARCHAR(100),
primary_imsi VARCHAR(20),
primary_msisdn VARCHAR(20),
imsi VARCHAR(20),
msisdn VARCHAR(20),
iccid_profile_type VARCHAR(200),
subscription_profile_id VARCHAR(200),
activation_status VARCHAR(50),
provision_deactive_time NUMERIC(22) not null,
provision_start_time NUMERIC(22) not null,
lock_status NUMERIC(10),
iccid_status VARCHAR(20),
properties VARCHAR(256),
display_name VARCHAR(200),
selected_plan_id VARCHAR(200),
es2_fqdn VARCHAR(200),
es8_fqdn VARCHAR(200),
last_update_time NUMERIC(22) not null
);

alter table generic_esim_subscription_info add constraint pk_gen_esim_subscrp primary key(iccid);
`,
  upgradeSql: []
};


export { pool, schema }
