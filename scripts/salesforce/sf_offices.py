#!/usr/bin/python

import os
import random
import sys
from datetime import datetime, timedelta
import time
import json

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
parser.add_argument('--sfonly', dest="sfonly", action="store_true")
parser.add_argument('--sf_id', dest="sf_id", action="store")
parser.add_argument('--limit', dest="limit", action="store")
args = parser.parse_args()

OT = getIDs.getOfficeTypes()

sf = None
if config.getKey("sf_test"):
    sf = Salesforce(security_token=token, password=passw, username=user, instance=inst,domain='test')
else:
    sf = Salesforce(security_token=token, password=passw, username=user, instance=inst)

TYPE='Account'
PSCHEMA = sf_util.getPainSchema(TYPE)

db = Query()

q = """
    select 
        o.id as office_id,oa.id as oa_id,concat(oa.addr1, ' ',oa.addr2) as addr1,
        oa.city,oa.zipcode,oa.state,oa.sf_id,o.id,o.sf_id as sf_parent_id,
        op.id as office_plans_id,pd.id as pricing_data_id,o.name as office_name,
        com.id as commission_user_id,com.sf_id as user_sf_id,oa.updated as updated01,
        u.id as user_id, o.sf_updated as updated02,
        oa.sf_updated as updated03
    from 
        office o
        left outer join office_addresses oa on oa.office_id = o.id
        left outer join office_plans op on  op.office_id = o.id
        left outer join users u on u.id = o.user_id 
        left outer join users com on o.commission_user_id = u.id
        left outer join pricing_data pd on pd.id = op.pricing_data_id
    where 
        o.active = 1 
        and o.office_type_id in (%s,%s)
"""
if args.sf_id is not None:
    q += " and oa.sf_id = '%s'" % args.sf_id

PAIN = db.query(q,(OT['Chiropractor'],OT['Urgent Care']))

PARENTS = {}

o = db.query("""select id,sf_id from office where sf_id is not null""")
for x in o:
    PARENTS[x['id']] = x['sf_id']

print(PAIN)

SCHEMA = {}
schema_f = 'sf_account_schema.json'
data_f = 'sf_account_data.json'
res = sf_util.cacheOrLoad(schema_f,sf.Account.describe)
SFSCHEMA = {}
FIELDS = []
for x in res['fields']:
#    # print(x['label'])
#    FIELDS.append(x['name'])
    lab = x['label']
    SFSCHEMA[lab] = x
#    # print(json.dumps(x,indent=4))
#    # print("----")

for x in PSCHEMA:
    FIELDS.append(SFSCHEMA[x]['name'])

SFQUERY = "select  "
SFQUERY += ','.join(FIELDS)
SFQUERY += " from Account "

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

SF_DATA = {}
for x in res['records']:
    SF_ID = x['Id']
    if 'attributes' in x:
        del x['attributes']
    SF_DATA[SF_ID] = x

if args.sfonly:
    PAIN = []

CNTR = 0
random.shuffle(PAIN)

for x in PAIN:
    print(x)
    SF_ID = x['sf_id']
    SF_ROW = None
    LAST_MOD = None
    if SF_ID in SF_DATA:
        SF_ROW = SF_DATA[SF_ID]
        print(json.dumps(SF_ROW))
        LAST_MOD = SF_ROW['LastModifiedDate']
        LAST_MOD = calcdate.parseDate(LAST_MOD).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        print("LAST_MOD:%s" % LAST_MOD)

    try:
        x['LastModifiedDate'] = max(x['updated01'],x['updated02'])
    except:
        x['LastModifiedDate'] = x['updated01']

    if x['updated03'] is not None and x['updated03'] > x['LastModifiedDate']:
        x['LastModifiedDate'] = x['updated03']

    if SF_ID is not None and SF_ROW is None:
        print("ERROR: Cached results found, skipping %s" % x['sf_id'])
        continue

    if x['office_id'] in PARENTS:
        x['sf_parent_id'] = PARENTS[x['office_id']]

    SF_PARENT = x['sf_parent_id']
    if SF_PARENT is None:
        r = sf.Account.create({
            SFSCHEMA['PainID']['name']: x['office_id'],
            SFSCHEMA['IsParent']['name']: True,
            SFSCHEMA['IsActive']['name']: True,
            SFSCHEMA['Account Name']['name']:x['office_name']
            })
        db.update("""
            update office set sf_id = %s where id = %s
            """,(r['id'],x['office_id'])
        )
        PARENTS[x['office_id']] = r['id']
        x['sf_parent_id'] = r['id']
    if x['oa_id'] is None:
        print("Not creating empty records for address")
        continue
    try:
        (update,newdata) = sf_util.getPAINData(x,SF_ROW,SFSCHEMA,PSCHEMA,db)
    except Exception as e:
        print("%s : ERROR : %s" % (x['office_id'],str(e)))
        print("x=%s" % x)
        print("SF_ROW=%s" % SF_ROW)
        exc_type, exc_value, exc_traceback = sys.exc_info()
        traceback.print_tb(exc_traceback, limit=100, file=sys.stdout)
        continue
    
    #print("----")
    #print(json.dumps(newdata,indent=4))
    #print("----")
    if 'LastModifiedDate' in newdata:
        del newdata['LastModifiedDate']
    if newdata['Name'] is None or len(newdata['Name']) < 1 or newdata['Name'] == "None":
        newdata['Name'] = x['office_name']
    
    print("upd=%s" % update)
    SAME = sf_util.compareDicts(newdata,SF_ROW)

    if 'OwnerId' in newdata:
        if newdata['OwnerId'] is None or len(newdata['OwnerId']) < 5:
            del newdata['OwnerId']
    
    if update == sf_util.updateSF() and not SAME: # Update SF
        if 'Id' in newdata and newdata['Id'] is not None:
            print("updating SF record: %s" % newdata['Id'])
            print(json.dumps(newdata,indent=4))
            db.update("""
                update office_addresses set sf_updated=now() where id = %s
                """,(x['oa_id'],)
            )
            sfid = newdata['Id']
            del newdata['Id']
            r = sf.Account.update(sfid,data=newdata)
        else:
            del newdata['Id']
            print("creating SF record:%s " % x['office_name'])
            try:
                print(json.dumps(newdata,indent=4))
                r = sf.Account.create(newdata,headers={'Sforce-Duplicate-Rule-Header': 'allowSave=true'})
                db.update("""
                    update office_addresses set sf_id = %s,sf_updated=now() where id = %s
                    """,(r['id'],x['oa_id'])
                )
            except Exception as e:
                print(str(e))
                print(json.dumps(newdata,indent=4))
                raise e
    elif update == sf_util.updatePAIN() and not SAME:
        print("Updating PAIN")
        try:
            db.update("""
                insert into office_history(office_id,user_id,text) values (
                    %s,1,'Updated data from SF'
                )
            """,(x['office_id'],))
            sf_util.updatePAINDB(x,SF_ROW,SFSCHEMA,PSCHEMA,db)
            #db.update("""
            #    update office_addresses set sf_updated=%s where id = %s
            #    """,(LAST_MOD,x['oa_id'],)
            #)
        except Exception as e:
            print(str(e))
            print(json.dumps(newdata,indent=4))
            raise e
    else:
        print("No changes required")
        if x['updated03'] is None:
            db.update("""
                update office_addresses set sf_updated=%s where id = %s
                """,(LAST_MOD,x['oa_id'],)
            )
    db.commit()
    CNTR += 1
    if args.limit is not None:
        if CNTR > int(args.limit):
            break

schema_f = 'sf_leads_schema.json'
leads = sf_util.cacheOrLoad(schema_f,sf.Lead.describe)
COLS = {}
for x in leads['fields']:
    COLS[x['name']] = 1

LIST=['LastModifiedDate', 'Address', 'LastReferencedDate', 'Name', 
    'CreatedById', 'PhotoUrl', 'MasterRecordId', 'IsDeleted', 
    'LastViewedDate', 'SystemModstamp', 'CreatedDate', 
    'LastActivityDate', 'LastModifiedById']

CNTR = 0
# print(json.dumps(SF_DATA,indent=4))
for x in SF_DATA:
    j = SF_DATA[x]
    act = SFSCHEMA['IsActive']['name']
    if not j[act]:
        print("Moving %s to leads" % j['Id'])
        n = {}
        for x in j:
            if 'Billing' in x:
                v = x.replace("Billing",'')
                n[v] = j[x]
            elif x == 'Name':
                n['Company'] = j[x]
            elif x not in COLS:
                pass
            elif x in LIST:
                pass
            else:
                n[x] = j[x]
        if 'Address' in n:
            del n['Address']
        n['LastName'] = 'Unknown'
        # print(json.dumps(n,indent=4))
        del n['Id']
        r = sf.Lead.create(n,headers={'Sforce-Duplicate-Rule-Header': 'allowSave=true'})
        sf.Account.delete(j['Id'])
    CNTR += 1
    if args.limit is not None:
        if CNTR > int(args.limit):
            break

