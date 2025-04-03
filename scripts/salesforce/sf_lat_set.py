#!/usr/bin/python

import os
import random
import sys
from datetime import datetime, timedelta
import time
import json
from nameparser import HumanName

sys.path.append(os.getcwd())  # noqa: E402

from util.DBOps import Query
from common import settings
from util import encryption,calcdate
from util import getIDs
from salesforce import sf_util

import argparse
from simple_salesforce import Salesforce

config = settings.config()
config.read("settings.cfg")

user = config.getKey("sf_user")
passw = config.getKey("sf_pass")
token = config.getKey("sf_token")
inst = config.getKey("sf_instance")
parser = argparse.ArgumentParser()
parser.add_argument('--dryrun', dest="dryrun", action="store_true")
parser.add_argument('--limit', dest="limit", action="store")
parser.add_argument('--sf_id', dest="sf_id", action="store")
parser.add_argument('--painid', dest="painid", action="store")
args = parser.parse_args()
db = Query()

TYPE='Lead'
sf = None
if config.getKey("sf_test"):
    sf = Salesforce(security_token=token, password=passw, username=user, instance=inst,domain='test')
else:
    sf = Salesforce(security_token=token, password=passw, username=user, instance=inst)

SCHEMA = {}
schema_f = 'sf_leads_schema.json'
data_f = 'sf_leads_data.json'
res = sf_util.cacheOrLoad(schema_f,sf.Lead.describe)
SFSCHEMA = {}
for x in res['fields']:
    # print(x['name'])
    lab = x['label']
    SFSCHEMA[lab] = x
    # print(json.dumps(x,indent=4))
    # print("----")

PSCHEMA = sf_util.getPainSchema(TYPE)
SFQUERY = "select  "
HAVE={}
ARR = []
for x in PSCHEMA:
    sc = PSCHEMA[x]
    col = sc['sf_field_name']
    # print(col)
    if col not in SFSCHEMA:
        print("WARNING: %s is missing" % col)
        continue
    if col in HAVE:
        print("WARNING: duplicate column %s" % col)
        continue
    HAVE[col] = 1
    sfcol = SFSCHEMA[col]
    # print(sfcol)
    ARR.append(sfcol['name'])

SF_IDS = {}
o = db.query("""
    select email,sf_id from users where sf_id is not null
    """)
for x in o:
    SF_IDS[x['sf_id']] = x['email']

ARR.append('Addresses_ID__c')
SFQUERY += ','.join(ARR)
SFQUERY += " from Lead where IsConverted = False"

SF_DATA = {}
res = []
if os.path.exists(data_f):
    print("Loading %s from disk" % data_f)
    H=open(data_f,"r")
    res = json.loads(H.read())
    H.close()
else:
    res = sf.query_all(SFQUERY)
    H=open(data_f,"w")
    H.write(json.dumps(res,indent=4))
    H.close()

for x in res['records']:
    # print(json.dumps(x,indent=4))
    SF_ID = x['Id']
    SF_DATA[SF_ID] = x
#---- MAIN

#print(res)
#print(type(res))
CNTR = 0

for x in SF_DATA:
    j = SF_DATA[x]
    # print(j)
    t = {}
    if j['Latitude'] != None and j['Longitude'] != None:
        continue
    if j['PainID__c'] is None:
        continue
    if j['Addresses_ID__c'] is None:
        g = db.query("""
            select oa.id from office_addresses oa,provider_queue pq 
            where 
                pq.office_id = oa.office_id and 
                pq.id=%s
            order by oa.created limit 1
            """,(j['PainID__c'],)
        )
        if len(g) < 1:
            print("No addresses for %s" % j['PainID__c'])
            continue
        j['Addresses_ID__c'] = t['Addresses_ID__c'] = g[0]['id']
    if j['Addresses_ID__c'] is None:
        continue
    o = db.query("""
        select lat,lon from office_addresses where id=%s
        """,(j['Addresses_ID__c'],)
    )
    if len(o) < 1:
        # This can happen when new addresses are being updated on a regular
        # basis since mechanics remove and reload. Reset for next pass
        print("ERROR: Couldnt find addresses for %s, resetting" % j['Addresses_ID__c'])
        t['Addresses_ID__c'] = None
        t['Latitude'] = None
        t['Longitude'] = None
    else:
        t['Latitude'] = o[0]['lat']
        t['Longitude'] = o[0]['lon']
    # print(t)
    try:
        sf.Lead.update(j['Id'],t)
    except Exception as e:
        print("ERROR: %s: %s" % (j['Id'],str(e)))
        # raise e



