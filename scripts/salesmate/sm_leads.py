#!/usr/bin/python

import os
import random
import traceback
import sys
import traceback
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
from salesmate import sm_util
from salesmate.sm_util import SM_Contacts,SM_Companies,SM_Deals

config = settings.config()
config.read("settings.cfg")

user = config.getKey("sf_user")
passw = config.getKey("sf_pass")
token = config.getKey("sf_token")
inst = config.getKey("sf_instance")
parser = argparse.ArgumentParser()
parser.add_argument('--dryrun', dest="dryrun", action="store_true")
parser.add_argument('--sm_id', dest="sm_id", action="store")
parser.add_argument('--id', dest="pain_id", action="store")
parser.add_argument('--limit', dest="limit", action="store")
parser.add_argument('--force_sf', dest="force_sf", action="store_true")
parser.add_argument("--sm_only", dest="sm_only", action="store_true")
parser.add_argument('--no_commit', dest="no_commit", action="store_true")
parser.add_argument('--excp_pass', dest="excp_pass", action="store_true")
parser.add_argument('--force_pain', dest="force_pain", action="store_true")
parser.add_argument('--del_dups', dest="del_dups", action="store_true")
parser.add_argument('--doall', dest="do_all", action="store_true")
parser.add_argument('--only_fields', dest="only_fields", action="store")
parser.add_argument('--debug', dest="debug", action="store_true")
parser.add_argument('--no_new', dest="no_new", action="store_true")
args = parser.parse_args()

TYPE='Lead'
CONTACT_OBJ = SM_Contacts()
COMPANY_OBJ = SM_Companies()
DEALS_OBJ = SM_Deals()

DEALS_OBJ.setDebug(True)

PQ = getIDs.getProviderQueueStatus()
ST = getIDs.getLeadStrength()
OT = getIDs.getOfficeTypes()

debug = args.debug

db = Query()
PAINHASH = {}

PAIN = []

q = """
    select 
        o.id as office_id,u.id as user_id,pq.sm_id,
        pq.id as pq_id,o.active,
        op.id as office_plans_id,pd.id as pricing_data_id,
        o.updated as office_updated,u.updated as users_updated,
        o.name as office_name,pq.sf_id,
        pq.updated as updated01,pq.updated as updated02,
        pqsm.modified as updated03,
        com.id as commission_user_id,com.sm_id as user_sf_id
    from 
        provider_queue pq
        left outer join office o on pq.office_id = o.id
        left outer join provider_queue_sf_updated pqsm on pq.id=pqsm.provider_queue_id
        left outer join office_plans op on  op.office_id = o.id
        left outer join pricing_data pd on pd.id = op.pricing_data_id
        left outer join users u on u.id = o.user_id
        left outer join users com on com.id = o.commission_user_id
    where 
        1 = 1
    """

schema_f = './tests/sf_leads_schema.json'
res = sf_util.cacheOrLoad(schema_f,{})
SFSCHEMA = {}
for x in res['fields']:
    # print(x['name'])
    lab = x['label']
    SFSCHEMA[lab] = x
    # print(json.dumps(x,indent=4))
    # print("----")

BS = getIDs.getBillingSystem()

if args.sm_id is not None:
    q += " and pq.sm_id = '%s'" % args.sm_id
    if args.debug:
        print(q)
    PAIN = db.query(q)
elif args.pain_id is not None:
    q += " and o.id = '%s'" % args.pain_id
    if args.debug:
        print(q)
    PAIN = db.query(q)
else:
    q += " and o.import_sm = 1  "
    PAIN = db.query(q)

if args.debug:
    print("len=%s" % len(PAIN))

for x in PAIN:
    if x['sm_id'] is not None:
        PAINHASH[str(x['sm_id'])] = x


PSCHEMA = sf_util.getPainSchema(TYPE)
CONTACTS = sm_util.getContacts(debug=args.debug)
DEALS = sm_util.getDeals(debug=args.debug)
COMPANIES = sm_util.getCompanies(debug=args.debug)
USERS = sm_util.getUsers(debug=args.debug)

ALL_FIELDS = []
SCHEMA = {}
SF_DATA = {}
IDS = {}

if args.debug:
    print("companies=%s" % COMPANIES)

PHONES = {}
for x in DEALS:
    j = DEALS[x]
    print("j=%s" % json.dumps(j,sort_keys=True,indent=4))
    myid = j['id']
    SF_DATA[myid] = {}
    v = None
    pcomp = str(j['primaryCompany']['id'])
    pcont = str(j['primaryContact']['id'])
    puser = str(j['owner']['id'])
    comp = cont = user = {}
    if j['primaryContact']['phone'] not in PHONES:
        PHONES[j['primaryContact']['phone']] = []
    PHONES[j['primaryContact']['phone']].append(j['id'])
    print("pcomp/pcont/puser=%s/%s/%s" % (pcomp,pcont,puser))
    if pcomp not in COMPANIES:
        print("ERROR: comp (%s) not found" % pcomp)
    else:
        comp = COMPANIES[pcomp]
    if pcont not in CONTACTS:
        print("ERROR: contact (%s) not found" % pcont)
    else:
        cont = CONTACTS[pcont]
    if puser not in USERS:
        print("ERROR: user (%s) not found" % puser)
    else:
        user = USERS[puser]
    SF_DATA[myid]['src'] = {}
    SF_DATA[myid]['src']['contact'] = sm_util.normalizeSMContact(cont,debug=args.debug)
    SF_DATA[myid]['src']['company'] = sm_util.normalizeSMCompany(comp,debug=args.debug)
    SF_DATA[myid]['src']['deal'] = sm_util.normalizeSMDeal(j,debug=args.debug)
    SF_DATA[myid].update(sm_util.flattenDict(SF_DATA[myid]['src']['contact']))
    SF_DATA[myid].update(sm_util.flattenDict(SF_DATA[myid]['src']['company']))
    SF_DATA[myid].update(sm_util.flattenDict(SF_DATA[myid]['src']['deal']))
    k = SF_DATA[myid]
    if k['PainID__c'] in k and k['PainID__c'] is not None and len(k['PainID__c']) > 0:
        v = k['PainID__c']
        IDS[v] = []
    if v is not None:
        IDS[v].append(k['Id'])

for x in PHONES:
    j = PHONES[x]
    if len(j) > 1:
        print("DUP %s" % (j,))

# print("FINAL")
# print(json.dumps(SF_DATA,indent=4,sort_keys=True))

#---- MAIN

CNTR = 0
random.shuffle(PAIN)
for x in PAIN:
    if args.sm_only:
        continue
    if debug:
        print("x=%s" % x)
    if x['sm_id'] is not None:
        print("only creating new records")
        continue
    o = db.query("""
        select count(id) as a from office_addresses where office_id = %s
        """,(x['office_id'],)
    )
    oa_id = 0
    if o[0]['a'] == 0:
        db.update("""
            insert into office_addresses (office_id) value (%s)
            """,(x['office_id'],)
        )
        oa_id = db.query("select LAST_INSERT_ID()")
        oa_id = oa_id[0]['LAST_INSERT_ID()']
    if oa_id == 0:
        g = db.query("""
            select id from office_addresses where office_id=%s
            order by created limit 1
            """,(x['office_id'],)
        )
        x['oa_id'] = g[0]['id']
    db.update("""
        update office set import_sm=1 where id=%s
        """,(x['office_id'],)
    )
    SF_ID = x['sm_id']
    SF_ROW = None
    LAST_MOD = None
    if SF_ID is not None and SF_ID not in DEALS:
        print("SF_ID (%s) not found, probably deleted" % SF_ID)
        continue
    if SF_ID in DEALS:
        SF_ROW = DEALS[SF_ID]
        if debug:
            print("SF_ROW=%s" % json.dumps(SF_ROW))
        LAST_MOD = SF_ROW['LastModifiedDate']
        LAST_MOD = calcdate.parseDate(LAST_MOD).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        if debug:
            print("LAST_MOD:%s" % LAST_MOD)
        SF_DATA[SF_ID]['Addresses_ID__c'] = oa_id
    try:
        x['LastModifiedDate'] = max(x['updated01'],x['updated02'])
    except:
        x['LastModifiedDate'] = x['updated01']

    if x['updated03'] is not None and x['updated03'] > x['LastModifiedDate']:
        x['LastModifiedDate'] = x['updated03']

    if SF_ID is not None and SF_ROW is None:
        print("ERROR: Cached results found, skipping %s" % x['sm_id'])
        continue

    update = 0
    newdata = {}
    try:
        (update,newdata) = sf_util.getPAINData(x,SF_ROW,SFSCHEMA,PSCHEMA,db,debug=args.debug)
    except Exception as e:
        print("%s : ERROR : %s" % (x['office_id'],str(e)))
        print("x=%s" % x)
        print("SF_ROW=%s" % SF_ROW)
        exc_type, exc_value, exc_traceback = sys.exc_info()
        traceback.print_tb(exc_traceback, limit=100, file=sys.stdout)
        db.update("""
            insert into provider_queue_history(provider_queue_id,user_id,text) values (
                %s,1,concat('Error: ',%s)
            )
        """,(x['pq_id'],str(e)))
        continue

    if SF_ID is not None:
        if SF_ID not in PAINHASH:
            PAINHASH[SF_ID] = {}
        PAINHASH[SF_ID]['nd'] = newdata

    if 'LastModifiedDate' in newdata:
        del newdata['LastModifiedDate']
    if newdata['Company'] is None or len(newdata['Company']) < 1 or newdata['Company'] == "None":
        newdata['Company'] = x['office_name']
    if 'Phone' in newdata and newdata['Phone'] is not None:
        p = newdata['Phone']
        p = p.replace(")",'').replace("(",'').replace("-",'').replace(" ",'').replace('.','')
        if p.startswith("+1"):
            p = p.replace("+1","")
        if p.startswith("1") and len(p) == 11:
            p = p[1:]
        newdata['Phone'] = p
    
    newdata['PainURL__c'] = '%s/app/main/admin/registrations/%s' % (config.getKey("host_url"),x['pq_id'])

    if 'Invoice_Paid__c' in newdata:
        if newdata['Invoice_Paid__c'] == None:
            newdata['Invoice_Paid__c'] = False

    if 'Addresses_ID__c' not in newdata:
            newdata['Addresses_ID__c'] = oa_id

    if "Ready_To_Buy__c" in newdata:
        if newdata['Ready_To_Buy__c'] == None:
            newdata['Ready_To_Buy__c'] = False

    newdata['Sales_Link__c'] = '%s/register-provider/%s' % (config.getKey("host_url"),x['pq_id'])

    if 'LastName' not in newdata or newdata['LastName'] is None or len(newdata['LastName']) < 2 or newdata['LastName'] == 'Unknown':
        if 'Dr' in newdata['Company'] or 'd.c.' in newdata['Company'].lower() or 'dc' in newdata['Company'].lower():
            t1 = HumanName(newdata['Company'])
            newdata['FirstName'] = "%s %s" % (t1.title,t1.first)
            newdata['LastName'] = "%s %s" % (t1.last,t1.suffix)
        else:
            newdata['LastName'] = 'Unknown'
    if 'FirstName' not in newdata or newdata['FirstName'] is None or len(newdata['FirstName']) < 2:
        newdata['FirstName'] = 'Unknown'
    if 'LastName' not in newdata or newdata['LastName'] is None or len(newdata['LastName']) < 2:
        newdata['LastName'] = 'Unknown'
    if newdata['Email'] is None:
        newdata['Email'] = "unknown-%s@poundpain.com" % encryption.getSHA256()[:6]
    newdata['Email'] = newdata['Email'].replace(" ",",")
    if newdata['OwnerId'] is None:
        del newdata['OwnerId']

    if debug:
        print("upd=%s" % update)
    SAME = sf_util.compareDicts(newdata,SF_ROW,debug=args.debug)

    print("%s=%s" % (x['sf_id'],newdata['Id']))
    if 'Id' in newdata and newdata['Id'] == x['sf_id']: # Disable this, need to move to SM
        print("delete")
        del newdata['Id']

    if debug:
        print("---- NEWDATA")
        print(json.dumps(newdata,indent=4))
        print("----")


    if args.force_sf:
        update = sf_util.updateSF()
    if args.force_pain:
        update = sf_util.updatePAIN()
    
    if update == sf_util.updateSF() and not SAME: # Update SF
        if 'Id' in newdata and newdata['Id'] is not None:
            print("Disabled updates")
            continue # Turn this off for now
            PAINHASH[newdata['Id']]['newdata'] = newdata
            print("updating SF record: %s" % newdata['Id'])
            db.update("""
                replace into provider_queue_sf_updated(provider_queue_id,modified) 
                    values (%s,now())
                """,(x['pq_id'],)
            )
            db.update("""
                insert into provider_queue_history(provider_queue_id,user_id,text) values (
                    %s,1,'Updated SF Date Stamp'
                )
            """,(x['pq_id'],))
            sfid = newdata['Id']
            del newdata['Id']
            if args.only_fields is not None:
                fie = args.only_fields.split(",")
                nd2 = {}
                for f in newdata:
                    if f in fie:
                        nd2[f] = newdata[f]
                newdata = nd2
            if debug:
                print("--- UPDATING TO SM")
                print(json.dumps(newdata,indent=4))
            if not args.dryrun:
                r = DEALS_OBJ.update(newdata)
        else:
            if 'Id' in newdata:
                del newdata['Id']
            print("creating SM record:%s " % x['office_name'])
            try:
                if debug:
                    print("---- CREATING TO SM") 
                    print(json.dumps(newdata,indent=4))
                if 'Phone' in newdata and newdata['Phone'] is not None and newdata['Phone'] != str("0"):
                    o = []
                    for b in CONTACTS:
                        p = CONTACTS[b]['phone']
                        p = p.replace(")",'').replace("(",'').replace("-",'').replace(" ",'').replace('.','')
                        if p.startswith("+1"):
                            p = p.replace("+1","")
                        if p.startswith("1") and len(p) == 11:
                            p = p[1:]
                        if newdata['Phone'] == p:
                            o.append(CONTACTS[b]['id'])
                        p = CONTACTS[b]['mobile']
                        p = p.replace(")",'').replace("(",'').replace("-",'').replace(" ",'').replace('.','')
                        if p.startswith("+1"):
                            p = p.replace("+1","")
                        if p.startswith("1") and len(p) == 11:
                            p = p[1:]
                        if newdata['Phone'] == CONTACTS[b]['mobile']:
                            o.append(CONTACTS[b]['id'])
                        if debug:
                            print("nd=%s,b=%s" % (newdata['Phone'],p))
                    if len(o) > 0:
                        print("ERROR: Creating new record but phone found: %s (%s)" % (newdata['Phone'],o))
                        continue
                owner_id = 4 # Paul
                # if 'OwnerId' not in newdata or newdata['OwnerId'] is None:
                newdata['OwnerId'] = owner_id
                if not args.dryrun and not args.no_new:
                    r = COMPANY_OBJ.update(newdata,dryrun=args.no_commit)
                    company_sm_id = r['id']
                    db.update("""
                        update office set sm_id = %s 
                            where id=%s""",(company_sm_id,x['office_id'],)
                    )
                    newdata['primaryCompany'] = company_sm_id
                    newdata['tags'] = 'Import Platform'
                    r = CONTACT_OBJ.update(newdata,dryrun=args.no_commit)
                    user_sm_id = r['id']
                    if x['user_id'] is not None:
                        db.update("""
                            update users set sm_id = %s 
                                where id=%s""",(user_sm_id,x['user_id'],)
                        )
                    newdata['primaryContact'] = user_sm_id
                    newdata['owner'] = owner_id
                    newdata['tags'] = 'Import Platform'
                    newdata['title'] = "Lead for %s" % x['office_name']
                    sfl = x['sf_id']
                    newdata['textCustomField4'] = sfl
                    newdata['stage'] = "New (Untouched)"
                    r = DEALS_OBJ.update(newdata,dryrun=args.no_commit)
                    deal_sm_id = r['id']
                    db.update("""
                        update provider_queue set sm_id = %s 
                            where id=%s""",(deal_sm_id,x['pq_id'],)
                    )
                    # print("set3: %s" % j['Id'])
                    db.update("""
                        update provider_queue set sm_id = %s where id = %s
                        """,(r['id'],x['pq_id'])
                    )
                    db.update("""
                    replace into provider_queue_sf_updated(provider_queue_id,modified) 
                        values (%s,now())
                        """,(x['pq_id'],)
                    )
                    db.update("""
                        insert into provider_queue_history(provider_queue_id,user_id,text) values (
                            %s,1,'Created SM Lead'
                        )
                    """,(x['pq_id'],))
                #if r['Id'] not in PAINHASH:
                #    PAINHASH[r['Id']] = {}
                PAINHASH[r['Id']]['newdata'] = newdata
            except Exception as e:
                print(str(e))
                print(json.dumps(newdata,indent=4))
                exc_type, exc_value, exc_traceback = sys.exc_info()
                traceback.print_tb(exc_traceback, limit=100, file=sys.stdout)
                continue
                # raise e
    elif update == sf_util.updatePAIN() and not SAME:
        print("Disabled update pain")
        continue # Turn this off for now
        try:
            if not args.dryrun:
                cmod = sf_util.updatePAINDB(x,SF_ROW,SFSCHEMA,PSCHEMA,db,debug=args.debug)
                if len(cmod) > 0:
                    print("%s: Updating PAIN" % SF_ROW['Id'])
                    for tt in cmod:
                        db.update("""
                            insert into provider_queue_history(provider_queue_id,user_id,text) values (
                                %s,1,%s
                            )
                        """,(x['pq_id'],'SF: Updated field: %s' % tt))
            #db.update("""
            #    update office_addresses set sf_updated=%s where id = %s
            #    """,(LAST_MOD,x['pq_id'],)
            #)
        except Exception as e:
            print("%s : ERROR : %s" % (x['office_id'],str(e)))
            print("newdata=%s" % json.dumps(newdata,indent=4))
            exc_type, exc_value, exc_traceback = sys.exc_info()
            traceback.print_tb(exc_traceback, limit=100, file=sys.stdout)
            continue
    else:
        print("No changes required")
        if x['updated03'] is None:
            if not args.dryrun:
                db.update("""
                replace into provider_queue_sf_updated(provider_queue_id,modified) 
                    values (%s,%s)
                    """,(x['pq_id'],LAST_MOD)
                )
    if not args.dryrun:
        db.commit()

    CNTR += 1
    if args.limit is not None and CNTR > int(args.limit):
        break
    time.sleep(2)

print("Processing SM Records")

CNTR = 0
for x in SF_DATA:
    j = SF_DATA[x]
    if args.sm_id is not None:
        # print("%s=%s" % (j['Id'],args.sm_id))
        if str(j['Id']) != str(args.sm_id):
            continue
    if args.debug:
        print(json.dumps(j,indent=4,sort_keys=True))
    FIELDS = 'PainID__c,PainURL__c,Sales_Link__c,Invoice_Paid__c'
    if j['Email'] is None:
        j['Email'] = "unknown-%s@poundpain.com" % encryption.getSHA256()[:6]
        FIELDS += ",Email"
    off_id = 0
    user_id = 0
    pq_id = 0
    if j['Phone'] is not None:
        p = j['Phone'].replace(")",'').replace("(",'').replace("-",'').replace(" ",'').replace('.','')
        j['Phone'] = p
    if 'attributes' in j:
        del j['attributes']
    sub = None
    if debug:
        print("START---")
        print(json.dumps(j))
    if j['PainID__c'] is None or len(j['PainID__c']) < 1:
        o = db.query("""
            select pq.id as t1 from office_addresses oa,office o,provider_queue pq  
                where oa.office_id = o.id and pq.office_id=o.id and oa.phone = %s
            UNION ALL
            select pq.id as t1 from office_user ou,users u,provider_queue pq 
                where ou.user_id = u.id and u.email = %s and pq.office_id=ou.office_id
            UNION ALL
            select pq.id as t1 from office o,provider_queue pq 
                where o.email = %s and o.id=pq.office_id
            UNION ALL
            select id as t1 from provider_queue where sm_id = %s
            """,(j['Phone'],j['Email'],j['Email'],j['Id'])
        )
        if len(o) < 1:
            print("Need to create office for %s" % j['Id'])
            db.update("""
                insert into office 
                    (name,office_type_id,email,billing_system_id,active,import_sf)
                    values
                    (%s,%s,%s,%s,0,1)
                """,(j['Company'],OT['Chiropractor'],j['Email'].lower(),BS)
            )
            off_id = db.query("select LAST_INSERT_ID()")
            off_id = off_id[0]['LAST_INSERT_ID()']
            db.update("""
                insert into office_addresses
                    (office_id,addr1,phone,city,state,zipcode,name) 
                    values 
                    (%s,%s,%s,%s,%s,%s,%s)
                """,(
                    off_id,
                    j['Street'] if 'Street' in j else '',
                    j['Phone'] if 'Phone' in j else '',
                    j['City'] if 'City' in j else '',
                    j['State'] if 'State' in j else '',
                    j['PostalCode'] if 'PostalCode' in j else '',
                    j['Company'] 
                    )
            )
            db.update("""
            insert into provider_queue(
                    office_id,provider_queue_status_id,provider_queue_lead_strength_id,
                    website
                ) 
                values (%s,%s,%s,%s)
            """,(
                off_id,PQ['QUEUED'],ST['Potential Provider'],
                j['Website']
                )
            )
            pq_id = db.query("select LAST_INSERT_ID()")
            pq_id = pq_id[0]['LAST_INSERT_ID()']
            db.update("""
                insert into provider_queue_history(provider_queue_id,user_id,text) values (
                    %s,1,'Imported from SF'
                )
            """,(pq_id,))
            j['PainID__c'] = pq_id
            db.update("""
                insert into users(email,first_name,last_name,phone,active) 
                    values (lower(%s),%s,%s,%s,0)
            """,(
                j['Email'].lower(),j['FirstName'],j['LastName'],
                j['Phone']
                )
            )
            user_id = db.query("select LAST_INSERT_ID()")
            user_id = user_id[0]['LAST_INSERT_ID()']
            db.update("""
                insert into office_user(user_id,office_id) 
                    values (%s,%s)
            """,(
                user_id,off_id
                )
            )
            db.update("""
                insert into user_entitlements(user_id,entitlements_id) values 
                (%s,3),
                (%s,7)
                """,(user_id,user_id)
            )
            db.update("""
                insert into user_permissions(user_id,permissions_id) values 
                (%s,1)
                """,(user_id,)
            )
            j['PainID__c'] = pq_id
            j['PainURL__c'] = '%s/app/main/admin/registrations/%s' % (config.getKey("host_url"),pq_id)
            j['Sales_Link__c'] = '%s/register-provider/%s' % (config.getKey("host_url"),pq_id)
            n = {}
            n['Id'] = j['Id']
            n['PainID__c'] = j['PainID__c']
            n['PainURL__c'] = j['PainURL__c'] 
            n['Sales_Link__c'] = '%s/register-provider/o/%s' % (config.getKey("host_url"),pq_id)
            try:
                DEALS_OBJ.update(n,dryrun=args.dryrun)
            except Exception as e:
                print(json.dumps(j))
                print("%s: ERROR: %s" % (j['Id'],str(e)))
                exc_type, exc_value, exc_traceback = sys.exc_info()
                traceback.print_tb(exc_traceback, limit=100, file=sys.stdout)
            print("Created office: %s = %s" % (j['Id'],pq_id))
        elif len(o) > 1:
            l = {}
            print(o)
            for gg in o:
                v = gg['t1']
                l[v] = 1
            if len(l) > 1:
                print("Need to review record for %s" % j['Id'])
                continue
            pq_id = o[0]['t1']
            off_id = db.query("""
                select office_id from provider_queue where id = %s
                """,(pq_id,)
            )
            if len(off_id) < 1:
                print("%s: PQ given (%s), office not found" % (pq_id,j['Id']))
                continue
            off_id = off_id[0]['office_id']
            j['PainID__c'] = pq_id
            j['PainURL__c'] = '%s/app/main/admin/registrations/%s' % (config.getKey("host_url"),pq_id)
            n = {}
            n['Id'] = j['Id']
            n['PainID__c'] = pq_id
            n['PainURL__c'] = '%s/app/main/admin/registrations/%s' % (config.getKey("host_url"),pq_id)
            n['Sales_Link__c'] = '%s/register-provider/o/%s' % (config.getKey("host_url"),pq_id)
            print("Found %s (%s)" % (j['Id'],pq_id))
            try:
                DEALS_OBJ.update(n,dryrun=args.dryrun)
            except Exception as e:
                print(json.dumps(j))
                print("%s: ERROR: %s" % (j['Id'],str(e)))
                exc_type, exc_value, exc_traceback = sys.exc_info()
                traceback.print_tb(exc_traceback, limit=100, file=sys.stdout)
        else:
            pq_id = o[0]['t1']
            print("Found pq %s" % pq_id)
            off_id = db.query("""
                select office_id from provider_queue where id = %s
                """,(pq_id,)
            )
            if len(off_id) < 1:
                raise Exception("PQ given, office not found")
            off_id = off_id[0]['office_id']
            update = False
            t = pq_id
            u = '%s/app/main/admin/registrations/%s' % (config.getKey("host_url"),pq_id)
            s = '%s/register-provider/o/%s' % (config.getKey("host_url"),pq_id)
            if t != j['PainID__c']:
                update = True
            if u != j['PainURL__c']:
                update = True
            if s != j['Sales_Link__c']:
                update = True
            if not update:
                continue
            j['PainID__c'] = t
            j['PainURL__c'] = u
            j['Sales_Link__c'] = s
            n = {}
            n['Id'] = j['Id']
            n['PainID__c'] = t
            n['PainURL__c'] = u
            n['Sales_Link__c'] = s
            
            o = db.query("""
                select id from provider_queue where office_id = %s
                """,(off_id,)
            )
            if len(o) < 1:
                raise Exception("ERROR: Established off but not in provider queue")
            print("Updating PainID: %s" % j['PainID__c'])
            try:
                DEALS_OBJ.update(n,dryrun=args.dryrun)
            except Exception as e:
                print(json.dumps(j))
                print("%s: ERROR: %s" % (j['Id'],str(e)))
                exc_type, exc_value, exc_traceback = sys.exc_info()
                traceback.print_tb(exc_traceback, limit=100, file=sys.stdout)
            # print("set2: %s" % j['Id'])
            db.update("""
                update provider_queue set sm_id = %s where id = %s
                """,(j['Id'],int(pq_id))
            )
    else:
        pq_id = int(j['PainID__c'])
        off_id = db.query("""
            select office_id from provider_queue where id = %s
            """,(pq_id,)
        )
        off_id2 = db.query("""
            select id from office where id = %s
            """,(pq_id,)
        )
        if len(off_id) < 1 and len(off_id2) < 1:
            print("%s: PQ given, office not found: %s" % (j['Id'],pq_id))
            continue
        elif len(off_id) < 1 and len(off_id2) > 0:
            print("%s: PQ given, office not found: %s" % (j['Id'],pq_id))
            continue
        else:
            off_id = off_id[0]['office_id']
        # Looks silly, but its great for testing
        # print("set1: %s" % j['Id'])
        db.update("""
            update provider_queue set sm_id = %s where id = %s
            """,(j['Id'],int(pq_id))
        )
        if j['Sales_Link__c'] is None:
            u = '%s/app/main/admin/registrations/%s' % (config.getKey("host_url"),pq_id)
            j['Sales_Link__c'] = '%s/register-provider/o/%s' % (config.getKey("host_url"),pq_id)
            j['PainID__c'] = pq_id
            j['PainURL__c'] = u
            n = {}
            n['Id'] = j['Id']
            n['PainID__c'] = j['PainID__c'] 
            n['PainURL__c'] = j['PainURL__c'] 
            n['Sales_Link__c'] = '%s/register-provider/o/%s' % (config.getKey("host_url"),pq_id)
            try:
                DEALS_OBJ.update(n,dryrun=args.dryrun)
            except Exception as e:
                print(json.dumps(j))
                print("%s: ERROR: %s" % (j['Id'],str(e)))
                exc_type, exc_value, exc_traceback = sys.exc_info()
                traceback.print_tb(exc_traceback, limit=100, file=sys.stdout)
    if debug:
        print("off_id=%s" % off_id)
    if False and 'Subscription_Plan__c' in j and j['Subscription_Plan__c'] is not None \
            and len(j['Subscription_Plan__c']) > 0 and j['Subscription_Plan__c'] != "N/A":
        p1 = j['PainID__c']
        if p1 in IDS and len(IDS[p1]) > 1:
            print("%s: Not continuing: duplicates found in leads for PainID" % j['Id'])
            db.update("""
                insert into provider_queue_history(provider_queue_id,user_id,text) values (
                    %s,1,%s
                )
            """,(pq_id,'Not progressing because multiple SF accounts were found with this ID: %s' % IDS[p1])
            )
            continue
        if j['Stage'] != 'In Negotiation':
            print("%s: Cant update Converted status" % j['Id'])
            db.update("""
                insert into provider_queue_history(provider_queue_id,user_id,text) values (
                    %s,1,%s
                )
            """,(pq_id,'Not progressing subscription plan: Status is %s' % j['Stage']))
            continue
        o = db.query("""
            select id,description,duration,price from pricing_data where description = %s
            """,(j['Subscription_Plan__c'],)
        )
        if len(o) < 1:
            db.update("""
                insert into provider_queue_history(provider_queue_id,user_id,text) values (
                    %s,1,'Plan wasnt found'
                )
            """,(pq_id,))
            raise Exception("PLAN_NOT_FOUND")
        sub = o[0]
        if debug:
            print("sub=%s" % sub)
        price = sub['price']
        initial_payment = None
        if 'Payment_Amount__c' in j and j['Payment_Amount__c'] is not None and j['Payment_Amount__c'] > 0:
            price = initial_payment = j['Payment_Amount__c']
            db.update("""
                insert into provider_queue_history(provider_queue_id,user_id,text) values (
                    %s,1,'Override price from SF'
                )
            """,(pq_id,))
        cur = db.query("""
            select id,pricing_data_id from office_plans where
                office_id = %s
            """,(off_id,)
        )
        if len(cur) > 0:
            i = cur[0]['id']
            cur = cur[0]
            oc = db.query("""
                select pd.description,pq.initial_payment,i.id as invoices_id from
                    office_plans op
                    left join pricing_data pd on op.pricing_data_id=pd.id
                    left join provider_queue pq on pq.office_id = op.office_id
                    left outer join invoices i on i.office_id = op.office_id
                where
                    pq.office_id = op.office_id and
                    op.office_id = %s and 
                    op.pricing_data_id=pd.id
                """,(off_id,)
            )
            UPDATE = True
            if len(oc) > 0:
                u = oc[0]
                if u['description'] == j['Subscription_Plan__c'] and u['initial_payment'] == j['Payment_Amount__c']:
                    UPDATE = False
                    print("%s: Not updating plan as it hasnt changed" % j['Id'])
                if u['invoices_id'] is not None:
                    UPDATE = False
                    print("%s: Not updating plan as its already submitted" % j['Id'])
            if UPDATE:
                print("Replacing office plan")
                db.update("""
                    insert into provider_queue_history(provider_queue_id,user_id,text) values (
                        %s,1,'Replacing plan with update'
                    )
                """,(pq_id,))
                db.update("""
                    delete from office_plan_items where office_plans_id=%s
                    """,(i,)
                )
                db.update("""
                    update office_plans set 
                        pricing_data_id = %s,
                        start_date = now(),
                        end_date = date_add(now(),INTERVAL %s MONTH)
                    where
                        id = %s
                    """,(sub['id'],sub['duration'],cur['id'])
                )
                db.update("""
                    insert into office_plan_items 
                        (office_plans_id,price,description,quantity)
                    values
                        (%s,%s,%s,%s)
                    """,(i,price,sub['description'],1)
                )
                if initial_payment is not None:
                    db.update("""
                        update provider_queue set initial_payment = %s
                            where office_id = %s
                        """,(initial_payment,off_id)
                    )
        else:
            print("Creating new office plan")
            db.update("""
                insert into provider_queue_history(provider_queue_id,user_id,text) values (
                    %s,1,'Creating new plan from SF'
                )
            """,(pq_id,))
            db.update("""
                insert into office_plans
                    (office_id,start_date,end_date,pricing_data_id)
                values
                    (%s,now(),date_add(now(), INTERVAL %s MONTH),%s)
                """,(off_id,sub['duration'],sub['id'])
            )
            newpid = db.query("select LAST_INSERT_ID()")
            newpid = newpid[0]['LAST_INSERT_ID()']
            db.update("""
                insert into office_plan_items 
                    (office_plans_id,price,description,quantity)
                values
                    (%s,%s,%s,%s)
                """,(newpid,price,sub['description'],1)
            )
        if initial_payment is not None:
            if debug:
                print("Updating initial_payment")
            db.update("""
                update provider_queue set initial_payment = %s
                    where office_id = %s
                """,(initial_payment,off_id)
            )
            db.update("""
                insert into provider_queue_history(provider_queue_id,user_id,text) values (
                    %s,1,'Override payment amount from SF'
                )
            """,(pq_id,))
        j['Sales_Link__c'] = '%s/register-provider/o/%s' % (config.getKey("host_url"),pq_id)
        j['PainURL__c'] = '%s/app/main/admin/registrations/%s' % (config.getKey("host_url"),pq_id)
        t = {}
        fie = FIELDS.split(",")
        nd2 = {}
        for f in j:
            if f in fie:
                nd2[f] = j[f]
        t = nd2
        if debug:
            print("t=%s" % t)
        if pq_id == 0:
            raise Exception("PQ_ID = 0")
        if j['Ready_To_Buy__c']:
            b = db.query("""
                select sf_lead_executed from provider_queue where id=%s
                """,(int(pq_id),)
            )
            if not b[0]['sf_lead_executed']:
                print("%s: Customer ready to buy, updating" % j['Id'])
                db.update("""
                    update provider_queue set 
                        sf_lead_executed=1, sm_id = %s,
                        provider_queue_lead_strength_id = %s,
                        provider_queue_status_id = %s
                    where id = %s
                    """,(j['Id'],ST['Preferred Provider'],PQ['IN_NETWORK'],int(pq_id))
                )
                db.update("""
                    insert into provider_queue_history(provider_queue_id,user_id,text) values (
                        %s,1,'Sending to invoicing (SF Lead)'
                    )
                """,(pq_id,))
                db.update("""
                    insert into provider_queue_history(provider_queue_id,user_id,text) values (
                        %s,1,'Set to Preferred Provider (SF Lead)'
                    )
                """,(pq_id,))
                db.update("""
                    insert into provider_queue_history(provider_queue_id,user_id,text) values (
                        %s,1,'Set to IN_NETWORK (SF Lead)'
                    )
                """,(pq_id,))
                db.update("""
                    update office set 
                        active=1
                    where id = %s
                    """,(off_id,)
                )
                db.update("""
                    insert into office_history(office_id,user_id,text) values (
                        %s,1,'Set to ACTIVE (SF LEAD)'
                    )
                """,(off_id,))
        else:
            db.update("""
                insert into provider_queue_history(provider_queue_id,user_id,text) values (
                    %s,1,'Not sending to invoices, as customer isnt Ready to Buy'
                )
            """,(pq_id,))
        if debug:
            print("---- UPDATE SUBS")
            print(json.dumps(t,indent=4))
        if j['Status'] == 'Converted':
            continue
        if not args.dryrun:
            try:
                DEALS_OBJ.update(n,dryrun=args.dryrun)
            except Exception as e:
                print("%s : ERROR : %s" % (x,str(e)))
                exc_type, exc_value, exc_traceback = sys.exc_info()
                traceback.print_tb(exc_traceback, limit=100, file=sys.stdout)
    else:
        # print("SF Leads Subscription unnecessary")
        # Looks silly, but when we change environments this really helps
        # print("set4: %s" % j['Id'])
        db.update("""
            update provider_queue set sm_id = %s where id = %s
            """,(j['Id'],int(pq_id))
        )
    db.commit()
    CNTR += 1
    if args.limit is not None and CNTR > int(args.limit):
        break
    

sf_util.setLastUpdate(TYPE)

