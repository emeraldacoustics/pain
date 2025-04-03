#!/usr/bin/python

import os
import sys
import base64
import time
import json
import pandas as pd
import googlemaps
from datetime import datetime

sys.path.append(os.getcwd())  # noqa: E402

from common import settings
from util import encryption,calcdate,getIDs,Mail
import argparse
import requests
from util.DBOps import Query
from util.Mail import Mail


config = settings.config()
config.read("settings.cfg")

parser = argparse.ArgumentParser()
parser.add_argument('--dryrun', dest="dryrun", action="store_true")
parser.add_argument('--force', dest="force", action="store_true")
parser.add_argument('--id', dest="id", action="store")
args = parser.parse_args()

db = Query()

REF = getIDs.getReferrerUserStatus()

q = """
    select
        id,email,name,phone,office_id,office_addresses_id,
        zipcode,error_mail_sent,accept_mail_sent,
        referrer_id,user_id,zipcode,lat,lon
    from
        referrer_users r
    where
        referrer_users_status_id < %s
    """
    
if args.id is not None:
    q+= "and r.id = %s" % args.id
elif not args.force:
    q+= "and (r.nextcheck is null or r.nextcheck < now())"

o = db.query(q,(REF['ACCEPTED'],))

m = Mail()
for x in o:
    lat = x['lat']
    lon = x['lon']
    print(x)
    provtype = 1
    if x['zipcode'] is None and x['office_addresses_id'] is not None:
        v = db.query("""
            select lat,lon,office_id from office_addresses where
            id = %s
            """,(x['office_addresses_id'],)
        )
        if len(v) < 1:
            raise Exception("WARNING: Couldnt find oa (%s) in db" % x['office_addresses_id'])
        v = v[0]
        lat = v['lat']
        lon = v['lon']
    limit = 10
    q = """
        select
            oa.id,o.id as office_id,
            oa.name as office_name,oa.phone,o.email,
            JSON_OBJECT(
                'id',oa.id,'addr1',concat(oa.addr1,' ',ifnull(oa.addr2,'')),'phone',oa.phone,
                'lat',oa.lat,'lon',oa.lon, 'city',oa.city,'state',
                oa.state,'zipcode',oa.zipcode
            ) as addr,
            round(st_distance_sphere(point(%s,%s),point(oa.lon,oa.lat))*.000621371192,2) as miles
        from
            office_addresses oa,
            office o,
            provider_queue pq
        where
            st_distance_sphere(point(%s,%s),point(oa.lon,oa.lat))*.000621371192 < 10 and
            pq.office_id = o.id and
            oa.office_id = o.id and
            o.active = 1 and
            oa.lat <> 0 and
            o.office_type_id = %s
    """
    if x['office_addresses_id'] is not None:
        q += " and oa.id = %s " % x['office_addresses_id']
    q += """
        order by
            pq.provider_queue_status_id, 
            round(st_distance_sphere(point(%s,%s),point(oa.lon,oa.lat))*.000621371192,2) 
        limit %s
    """
    print(q % (lon,lat,lon,lat,provtype,lon,lat,limit))
    off = db.query(q,(lon,lat,lon,lat,provtype,lon,lat,limit))
    print("off=%s" % off)
    #if config.getKey("appt_email_override") is not None:
    #    email = config.getKey("appt_email_override")
    if len(off) < 1:
        if not x['error_mail_sent']:
            sysemail = config.getKey("support_email")
            url = config.getKey("host_url")
            data = { 
                '__LINK__':"%s/app/main/admin/customers/%s" % (url,x['id']),
                '__BASE__':url
            } 
            data['__USER_NAME__'] = x['name']
            data['__ZIPCODE__'] = x['zipcode']
            data['__OFFICE_URL__'] = "%s/app/main/admin/customers/%s" % (url,x['id'])
            if x['office_id'] is not None:
                m.send(sysemail,"Office Assigned but not found for customer referral","templates/mail/no-locations-referrer.html",data)
            else:
                m.send(sysemail,"No locations found for customer referral","templates/mail/no-locations-referrer.html",data)
            db.update("""
                update referrer_users set error_mail_sent = 1 where id = %s
                """,(x['id'],)
            )
    DIDSEND = False
    for j in off:
        g = db.query("""
            select id from referrer_users_queue 
            where 
                office_id=%s and
                referrer_users_id=%s
            """,(j['office_id'],x['id'])
        )
        if len(g) > 0 and not args.force:
            print("Already sent accept email to %s" % j['office_name'])
            continue

        url = config.getKey("host_url")
        val = encryption.encrypt(
            json.dumps({'oa':j['id'],'i':x['id'],'o':j['office_id']}),
            config.getKey("encryption_key")
        )
        val = base64.b64encode(val.encode('utf-8'))
        data = { 
            '__LINK__':"%s/app/main/office/customers/%s" % (url,x['id']),
            '__ACCEPT__':"%s/accept/%s" % (url,val.decode('utf-8')), 
            '__REJECT__':"%s/reject/%s" % (url,val.decode('utf-8')), 
            '__OFFICE__':j['office_name'],
            '__BASE__':url
        } 
        
        # TODO: Send this to the office, atm its turned off
        sysemail = config.getKey("support_email")
        m.send(sysemail,"New client from POUNDPAIN","templates/mail/invitation-email.html",data)
        db.update("""
            insert into referrer_users_queue (
                referrer_users_id,office_id,accept_mail_sent,referrer_users_status_id)
                values (%s,%s,%s,%s)
            """,(x['id'],j['office_id'],1,REF['QUEUED'])
        )


    db.update("""
        update referrer_users set nextcheck=date_add(now(),INTERVAL 5 MINUTE) where id = %s
        """,(x['id'],)
    )
    db.commit()
