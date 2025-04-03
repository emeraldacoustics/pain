#!/usr/bin/python

import os
import sys
import time
import json
import pandas as pd
import googlemaps
from datetime import datetime

sys.path.append(os.getcwd())  # noqa: E402

from common import settings
from util import encryption,calcdate,getIDs
import argparse
import requests
from util.DBOps import Query
from util.Mail import Mail
from bs4 import BeautifulSoup
from selenium import webdriver 
from selenium.webdriver import Chrome 
from selenium.webdriver.chrome.service import Service 
from selenium.webdriver.common.by import By 
from webdriver_manager.chrome import ChromeDriverManager


config = settings.config()
config.read("settings.cfg")

parser = argparse.ArgumentParser()
parser.add_argument('--dryrun', dest="dryrun", action="store_true")
parser.add_argument('--force', dest="force", action="store_true")
args = parser.parse_args()

api_key=config.getKey("google_api_key")
gmaps = googlemaps.Client(key=api_key)

OT = getIDs.getOfficeTypes()

db = Query()

q = """
    select 
        oa.id,oa.zipcode,oa.state,
        oa.city,addr1,o.office_type_id,
        oa.lat,oa.lon,o.id as office_id
    from 
        user_addresses oa
    where
        oa.addr1 is not null and
        oa.lat_attempt_count < 5 and
        lat = 0
    """

if not args.force:
    q+= " and (oa.nextcheck is null or oa.nextcheck < now()) "

o = db.query(q)

CNT = 0
for x in o:
    lat = 0
    lon = 0
    places_id = None
    zipcode = None
    # print(x)
    if len(x['addr1']) < 5:
        continue
    res = gmaps.geocode('%s, %s, %s' % (x['addr1'],x['city'],x['state']))
    if len(res) < 1:
        print(x)
        print("Unable to find coordinates for %s" % x['id'])
    else:
        res = res[0]
        # print(json.dumps(res,indent=4))
        #print(json.dumps(res,indent=4))
        #print("=----")
        #print(json.dumps(res['geometry'],indent=4))
        lat = res['geometry']['location']['lat']
        lon = res['geometry']['location']['lng']
        places_id = res['place_id']
        for y in res['address_components']:
            # print(y)
            if 'postal_code' in y['types']:
                zipcode = y['long_name']
    CNT += 1
    # print(zipcode,places_id)
    db.update("""
        update user_addresses set lat=%s,lon=%s,
            lat_attempt_count=lat_attempt_count+1,places_id=%s,
            zipcode = %s, 
            nextcheck=date_add(now(),INTERVAL 1 day)
        where id=%s
        """,(lat,lon,places_id,zipcode,x['id'])
    )
    db.commit()

print("Updated %s records" % CNT)
