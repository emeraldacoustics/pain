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

SFQUERY += ','.join(ARR)
SFQUERY += " from Lead "

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

#---- MAIN

SF_DATA = {}
#print(res)
#print(type(res))
CNTR = 0
for x in res['records']:
    # print(json.dumps(x,indent=4))
    SF_ID = x['Id']
    if 'attributes' in x:
        del x['attributes']
    SF_DATA[SF_ID] = x

for x in SF_DATA:
    j = SF_DATA[x]
    # print(j)
    p = j['Phone']
    if p is None:
        continue
    if 'x' in p:
        p = p.split('x')[0]
    if ')' in p or '.' in p or ' ' in p or len(p) > 10:
        p = p.replace(")",'').replace("(",'').replace("-",'').replace(" ",'').replace('.','')
        if p.startswith("+1"):
            p = p.replace("+1","")
        if p.startswith("1") and len(p) == 11:
            p = p[1:]
        t = {}
        t['Phone'] = p
        try:
            sf.Lead.update(j['Id'],t)
            print("%s: Successfully migrated %s to %s" % (j['Id'],j['Phone'],p))
        except Exception as e:
            print("ERROR: %s: %s" % (j['Id'],str(e)))
            # raise e



