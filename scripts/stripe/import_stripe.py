#!/usr/bin/python

import os
import random
import sys
from datetime import datetime, timedelta
import time
import json

sys.path.append(os.getcwd())  # noqa: E402

from util.DBOps import Query
import pandas as pd
from common import settings
from util import encryption,calcdate
from util import getIDs

import argparse
import stripe
config = settings.config()
config.read("settings.cfg")

# key = config.getKey("stripe_key")
key = "sk_live_"
stripe.api_key = key
parser = argparse.ArgumentParser()
parser.add_argument('--dryrun', dest="dryrun", action="store_true")
parser.add_argument('--subs_file', dest="subs_file", action="store")
parser.add_argument('--limit', dest="limit", action="store")
parser.add_argument('--stripeid', dest="stripeid", action="store")
args = parser.parse_args()

APT = getIDs.getAppointStatus()
INV = getIDs.getInvoiceIDs()
PQ = getIDs.getProviderQueueStatus()
ST = getIDs.getLeadStrength()
db = Query()
SUBS = {}

if args.subs_file is None:
    print("ERROR: Subs File required")
    sys.exit(1)

if not os.path.exists(args.subs_file):
    print("ERROR: Subs File missing")
    sys.exit(1)

df = pd.read_excel(args.subs_file)
df = df.fillna(0)
df = df.to_dict(orient='index')
for x in df:
    # print(df[x])
    #print("----")
    e = df[x]['Emails']
    SUBS[e] = df[x]

if not os.path.exists('stripe_customers.json'):
    r = stripe.Customer.list(limit=100)
    H=open('stripe_customers.json',"w")
    H.write(json.dumps(r['data']))
    H.close()

if not os.path.exists('stripe_subs.json'):
    r = stripe.Subscription.list(limit=500)
    H=open('stripe_subs.json',"w")
    H.write(json.dumps(r['data']))
    H.close()

if not os.path.exists('stripe_products.json'):
    r = stripe.Product.list(limit=500)
    H=open('stripe_products.json',"w")
    H.write(json.dumps(r['data']))
    H.close()

CUST={}
print("#### CUSTOMERS")
H=open('stripe_customers.json',"r")
r=json.loads(H.read())
H.close()
random.shuffle(r)
for cust in r:
    #print(json.dumps(cust,indent=4))
    cust_key = cust['id']
    if args.stripeid is not None:
        if cust_key != args.stripeid:
            continue
    if cust_key not in CUST:
        CUST[cust_key] = {
            'p':{},
            'i':[],
            's':[]
        }
    CUST[cust_key]['p'] = cust
    r = stripe.Invoice.list(customer=cust_key,limit=500)
    CUST[cust_key]['i'] = r.data

STRIPE_SUBS = {}
PROD={}
print("#### SUBS")
H=open('stripe_subs.json',"r")
r=json.loads(H.read())
H.close()
for subs in r:
    #print(json.dumps(subs,indent=4))
    cust_key = subs['customer']
    if cust_key not in CUST:
        print("WARNING: customer %s wasnt found" % cust_key)
        continue
    for y in subs['items']['data']:
        #print("#### Y")
        #print(json.dumps(y,indent=4))
        p = y['plan']['product']
        i = y['plan']['interval']
        c = y['plan']['interval_count']
        a = y['plan']['amount']/100
        d = y['plan']['nickname']
        PROD[p] = {
            'i':i,
            'c':c,
            'd':d,
            'a':a
        } 

H=open('stripe_products.json',"r")
r=json.loads(H.read())
H.close()

print("#### PRODUCTS")
for prod in r:
    print(json.dumps(prod,indent=4))
    p_stripe = prod['id']
    p_id = 0
    l = db.query("""
        select id from pricing_data where
            stripe_product_id = %s
        """,(p_stripe,)
    )
    for x in l: 
        p_id = x['id']
    if p_stripe not in PROD:
        print("WARNING: %s isnt in subscriptions" % p_stripe)
        PROD[p_stripe] = { 
            'i':'none',
            'c':0,
            'd':'',
            'a':0
        }
    print("#### PRODUCT")
    PROD[p_stripe]['description'] = prod['name']
    PROD[p_stripe]['tax_code'] = prod['tax_code']
    #print(json.dumps(PROD[p_stripe],indent=4))
    duration = 0
    slot = 1
    if PROD[p_stripe]['i'] == 'month':
        duration = 1
        slot = 3
    elif PROD[p_stripe]['i'] == 'none':
        duration = 0
        slot = 1
    elif PROD[p_stripe]['i'] == 'year':
        slot = 1
        duration = 12
    else:
        print("ERROR: Encountered unknown interval")
        sys.exit(1)
    if p_id == 0:
        desc = prod['name']
        db.update("""
            insert into pricing_data 
                (
                price,duration,slot,
                description,active,
                stripe_product_id,stripe_tax_code)
                values (
                    %s,%s,%s,%s,0,%s,%s
                )
            """,(
                PROD[p_stripe]['a'],
                duration,slot,
                PROD[p_stripe]['d'],
                p_stripe,
                PROD[p_stripe]['tax_code']
                )
        )
        p_id = db.query("select LAST_INSERT_ID()")
        p_id = p_id[0]['LAST_INSERT_ID()']
    db.commit()
    PROD[p_stripe]['id'] = p_id

def createOffice(db,c,email,user_id,off_name):
    db.update("""
        insert into office 
            (name,stripe_cust_id,office_type_id,email,user_id,billing_system_id)
            values
            (%s,%s,1,%s,%s)
        """,(off_name,c['p']['id'],email,user_id,1)
    )
    off_id = db.query("select LAST_INSERT_ID()")
    off_id = off_id[0]['LAST_INSERT_ID()']
    db.update("""
        insert into office_user (office_id,user_id) values (%s,%s)
        """,(off_id,user_id)
    )
    if c['p']['address'] is not None:
        db.update("""
            insert into office_addresses
                (office_id,addr1,addr2,phone,city,state,zipcode,name) 
                values 
                (%s,%s,%s,%s,%s,%s,%s,%s)
            """,(
                off_id,
                c['p']['address']['line1'],
                c['p']['address']['line2'],
                c['p']['phone'],
                c['p']['address']['city'],
                c['p']['address']['state'],
                c['p']['address']['postal_code'],
                off_name
                )
        )
    return off_id

def createProviderQueue(db,c,email,off_id):
    #print(c)
    db.update("""
    insert into provider_queue(office_id,provider_queue_status_id,provider_queue_lead_strength_id) 
        values (%s,%s,%s)
    """,(
        off_id,PQ['IN_NETWORK'],ST['Preferred Provider']
        )
    )
    pq_id = db.query("select LAST_INSERT_ID()")
    pq_id = pq_id[0]['LAST_INSERT_ID()']
    return pq_id
    
def createUser(db,c):
    phone = f_n = l_n = ''
    if c['p']['name'] is not None:
        n = c['p']['name'].split(' ')
        f_n = n[0]
        if len(n) > 1:
            l_n = c['p']['name'].split(' ')[1]
    if c['p']['phone'] is not None:
        phone = c['p']['phone']
        phone = phone.replace("+1","")
    db.update("""
    insert into users(email,first_name,last_name,phone,phone_prefix) 
        values (lower(%s),%s,%s,%s,+1)
    """,(
        email,f_n,l_n,phone
        )
    )
    user_id = db.query("select LAST_INSERT_ID()")
    user_id = user_id[0]['LAST_INSERT_ID()']
    db.update("""
        insert into user_entitlements(user_id,entitlements_id) values 
        (%s,3)
        """,(user_id,)
    )
    db.update("""
        insert into user_permissions(user_id,permissions_id) values 
        (%s,1),
        (%s,7)
        """,(user_id,user_id)
    )
    return user_id

print("### START_IMPORT")
CNT = 0
for c in CUST:
    print("### CUSTOMER: %s" % CUST[c]['p']['id'])
    #print(json.dumps(CUST[c],indent=4))
    email = CUST[c]['p']['email']
    email = email.lower()
    scust_id = CUST[c]['p']['id']
    user_id = 0
    off_id = 0
    l = db.query("""
        select id,first_name,last_name from users where email = %s
        """,(email,)
    )
    for x in l:
        if x['first_name'] is None or len(x['first_name']) < 1:
            if CUST[c]['p']['name'] != None:
                print("det empty name")
                print(json.dumps(CUST[c]['p']))
                # sys.exit(0)
        user_id = x['id']
    if user_id == 0:
        user_id = createUser(db,CUST[c])
    l = db.query("""
        select office_id from office_user
            where user_id = %s
        """,(user_id,)
    )
    for x in l:
        off_id = x['office_id']
    if off_id == 0:
        off_name = email
        if email in SUBS:
            off_name = SUBS[email]['Practice']
        off_id = createOffice(db,CUST[c],email,user_id,off_name)
        print("Created office for %s" % email)
    l = db.query("""
        select id from provider_queue where office_id=%s
        """,(off_id,)
    )
    PQ_ID = 0
    HAVE_PQ = False
    INITIAL_PAYMENT = 0
    for t in l:
        PQ_ID = t['id']
        HAVE_PQ = True
    if not HAVE_PQ:
        PQ_ID = createProviderQueue(db,CUST[c],email,off_id)
    START_DATE = 0
    MY_PROD = None
    for x in CUST[c]['i']:
        HAVE=False
        l = db.query("""
            select id from invoices where stripe_invoice_id = %s
            """,(x['id'],)
        )
        for t in l:
            print("Already have invoice id %s (%s)" % (x['id'],t['id']))
            HAVE=True
        if HAVE:
            continue
        total = x['amount_due']/100
        l = db.query("select from_unixtime(%s) as t",(x['created'],))
        if START_DATE == 0:
            START_DATE = x['created']
        if x['created'] < START_DATE:
            START_DATE = x['created']
        billing_period = l[0]['t']
        db.update("""
            insert into invoices (office_id,stripe_invoice_id,total,invoice_status_id,billing_period,billing_system_id) 
                values
            (%s,%s,%s,%s,%s,1)
            """,(off_id,x['id'],total,INV['SENT'],billing_period)
        )
        inv_id = db.query("select LAST_INSERT_ID()")
        inv_id = inv_id[0]['LAST_INSERT_ID()']
        db.update("insert into stripe_invoice_status (invoices_id) values (%s)",(inv_id,))
        for y in x['lines']['data']:
            if MY_PROD is None:
                MY_PROD = y['price']['product']
            db.update("""
                insert into invoice_items (invoices_id,description,price,quantity) 
                values (
                    %s,%s,%s,%s
                )
            """,(inv_id,y['description'],y['amount']/100,y['quantity'])
            )
        db.update("""
            insert into invoice_history (invoices_id,user_id,text) values 
                (%s,%s,%s)
            """,(inv_id,1,'IMPORTED_FROM_STRIPE' )
        )
        l = db.query("""
            select id from pricing_data where stripe_product_id = %s
            """,(MY_PROD,)
        )
        pd_id = 0
        for t in l:
            pd_id = t['id']
        if pd_id == 0:
            print("ERROR: Couldnt find pricing data for %s" % MY_PROD)
            sys.exit(0)
        l = db.query("""
            select id from office_plans 
            where 
                pricing_data_id = %s and 
                office_id = %s and 
                stripe_product_id = %s
            """,(pd_id,off_id,MY_PROD)
        )
        HAVE_OP = False
        op_id = 0
        for t in l:
            op_id = t['id']
            HAVE_OP = True
        print("op_id=%s" % op_id)
        if not HAVE_OP:
            db.update("""
                insert into office_plans 
                    (
                    office_id,pricing_data_id,stripe_product_id,stripe_tax_code,start_date,
                    end_date
                    )
                values
                    (%s,%s,%s,%s,from_unixtime(%s),date_add(from_unixtime(%s),interval %s month))
                """,(
                    off_id,pd_id,MY_PROD,PROD[MY_PROD]['tax_code'],START_DATE,START_DATE,duration
                    )
            )
            op_id = db.query("select LAST_INSERT_ID()")
            op_id = op_id[0]['LAST_INSERT_ID()']
            db.update("delete from office_plan_items where office_plans_id=%s",(op_id,))
            i = db.query("select description,price from pricing_data where id=%s",(pd_id,))
            if len(i) < 1:
                print("ERROR: Couldnt find pricing_data update for %s" % pd_id)
                sys.exit(1)
            db.update("""insert into office_plan_items 
                (office_plans_id,price,description,quantity) values
                (%s,%s,%s,1)
                """,(op_id,i[0]['price'],i[0]['description'])
            )
        db.commit()
    CF = "user_cards_%s.json" % scust_id
    if not os.path.exists(CF):
        pm = stripe.Customer.list_payment_methods(scust_id,limit=10)
        H=open(CF,"w")
        H.write(json.dumps(pm['data'],indent=4))
        H.close()
    H=open(CF,"r")
    CARDS = json.loads(H.read())
    H.close()
    for card in CARDS:
        # print(json.dumps(card,indent=4))
        l = db.query("""
            select id from office_cards where 
                payment_id=%s and office_id = %s
            """,(card['id'],off_id)
        )
        HAVE=False
        for c1 in l:
            # print("c1=%s" % c1)
            HAVE=True
        if HAVE:
            print("Already have card %s for %s" %(card['id'],off_id))
            continue
        if 'card' not in card:
            print("Customer %s has no card data" %(card['id'],))
            continue
        db.update("""
            insert into office_cards 
                (
                    office_id,payment_id,last4,exp_month,exp_year,
                    brand,address1,address2,state,city,zip,is_active,
                    is_default
                ) values
                (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,1,1)
            """,(
                off_id,card['id'],card['card']['exp_month'],
                card['card']['last4'],
                card['card']['exp_year'],card['card']['brand'],
                card['billing_details']['address']['line1'],
                card['billing_details']['address']['line2'],
                card['billing_details']['address']['state'],
                card['billing_details']['address']['city'],
                card['billing_details']['address']['postal_code']
                )
        )
    if MY_PROD is not None:
        l = db.query("""
            select total from invoices where office_id = %s
            """,(off_id,)
        )
        for t in l:
            a = PROD[MY_PROD]['a']
            if t['total'] > a:
                INITIAL_PAYMENT = t['total']
        if INITIAL_PAYMENT > 0:
            print("Initial Payment Modifier = %s" % INITIAL_PAYMENT)
            db.update("""
                update provider_queue set initial_payment = %s where office_id=%s
                """,(INITIAL_PAYMENT,off_id)
            )
    print("Successfully imported %s" % email)
    CNT += 1
    db.commit()
    if args.limit is not None and CNT > int(args.limit):
        print("Stopping after %s due to limit" % (int(CNT) - 1,))
        break

print("Successfully processed %s records" % (int(CNT)-1,))
