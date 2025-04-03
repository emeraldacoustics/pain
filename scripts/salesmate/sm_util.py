#!/usr/bin/python

import os
import random
import sys
from datetime import datetime, timedelta
import time
import json
import requests

sys.path.append(os.getcwd())  # noqa: E402

from util.DBOps import Query
from common import settings
from util import encryption,calcdate
from util import getIDs

config = settings.config()
config.read("settings.cfg")

CONTACT_MAPPING = {
    'Email':'email',
    'Salutation':'title',
    'FirstName':'firstName',
    'Phone':'phone',
    'PainID__c':'textCustomField1',
    'Id':'textCustomField2',
}

CONTACT_MAPPING_REV = { 
    'lastName':'LastName',
    'firstName':'FirstName',
    'phone':'Phone',
    'email':'Email',
    'textCustomField1':'PainID__c',
    'id':'Id'
}

DEAL_MAPPING = {
    'OwnerId':'ownerid',
    'Lead_Source__c': 'source',
    'Is_PI_Provider__c': 'checkboxCustomField3',
    'Payment_Amount__c':'decimalCustomField1',
    "Ready_To_Buy__c": 'checkboxCustomField1',
    "Invoice_Paid__c": 'checkboxCustomField2',
    "Subscription_Plan__c": 'textCustomField5',
    "Status":'status',
    "Stage":'stage',
    "Id": 'id',
    'Title':'title',
    'PainID__c':'textCustomField1',
    'PainURL__c':'textCustomField3',
    'Sales_Link__c':'textCustomField2',
}

DEAL_MAPPING_REV = { 
    # Reverse mapping
    'owner.id':'OwnerId',
    'source':'Lead_Source__c',
    'checkboxCustomField3':'Is_PI_Provider__c',
    'decimalCustomField1':'Payment_Amount__c',
    'checkboxCustomField1':"Ready_To_Buy__c",
    'checkboxCustomField2':"Invoice_Paid__c",
    'textCustomField5':"Subscription_Plan__c",
    "stage":'Stage',
    'id':"Id",
    'title':'Title',
    "status":'Status',
    'textCustomField1':'PainID__c',
    'textCustomField3':'PainURL__c',
    'textCustomField2':'Sales_Link__c'
    #'primaryContact.id': 'primaryContact',
    #'primaryCompany.id': 'primaryCompany',
    #'stage': 'stage'
}
COMPANY_MAPPING = {
    'PainID__c':'textCustomField1',
    'PainURL__c':'textCustomField2',
    'Addresses_ID__c':'textCustomField4',
    'Company':'name',
    'OwnerId':'owner',
    'Street': 'billingAddressLine1',
    'Website':'website',
    'PostalCode':'zip',
    'Phone':'phone',
    'City':'billingCity',
    'State':'billingState',
    'Id': 'textCustomField5',
}
COMPANY_MAPPING_REV = { 
    'textCustomField1':'PainID__c',
    'textCustomField2':'PainURL__c',
    'textCustomField4':'Addresses_ID__c',
    'name':'Company',
    'owner':'OwnerId',
    'billingAddressLine1':'Street',
    'website':'Website',
    'zip':'PostalCode',
    'phone':'Phone',
    'billingCity':'City',
    'billingState':'State',
    'textCustomField5':'Id',
}

class SM_Base:

    __call__ = None
    __BASE__ = 'https://poundpain1.salesmate.io'
    __DEBUG__ = False
    __TYPE__ = 'GET'
    __ISUPDATE__ = False
    __PAGESIZE__ = 250
    def __init__(self):
        pass

    def getSession(self):
        return config.getKey("salesmate_session_key")

    def requestType(self):
        return self.__TYPE__

    def setType(self,c):
        self.__TYPE__ = c

    def setIsUpdate(self,c):
        self.__ISUPDATE__ = c

    def setCall(self,c):
        self.__call__ = c

    def getPayload(self,painid):
        return {}

    def setDebug(self,c):
        self.__DEBUG__ = c

    def post(self):
        pass
    
    def getCall(self):
        return self.__call__

    def setData(self,*args,**kwargs):
        pass

    def getData(self,payload={},page=0):
        call = self.getCall()
        if call is None:
            raise Exception("Call required")
        if '?rows=' in call and page == 0:
            call = call.split('?')
            call = "%s?rows=%s&from=%s" % (
                call[0],self.__PAGESIZE__,page*self.__PAGESIZE__
            )
        if '?rows=' in call and page > 0:
            call = call.split('?')
            call = "%s?rows=%s&from=%s" % (
                call[0],self.__PAGESIZE__,page*self.__PAGESIZE__
            )
        if self.requestType() == 'GET':
            u = "%s%s" % (self.__BASE__,call) 
            if self.__DEBUG__:
                print("DEBUG: u=%s" % u)
            headers = {
              'Content-Type': 'application/json',
              'accessToken': self.getSession(),
              'x-linkname': 'poundpain1.salesmate.io'
            }
            r = requests.request('GET',u,headers=headers,data=payload)
            if self.__DEBUG__:
                print("%s: get: status: %s" % (self.__class__.__name__,r.status_code))
            if r.status_code != 200:
                raise Exception("%s: %s" % (r.status_code,r.text))
            js = json.loads(r.text)
            if self.__DEBUG__:
                print("response: %s" % js)
            pages = 0
            if 'Data' in js and 'totalRows' in js['Data']:
                # Paging goes here
                if self.__DEBUG__:
                    print("get: call=%s" % call)
                    print("%s: rows=%s" % (self.__class__.__name__,js['Data']['totalRows']))
                rows = js['Data']['totalRows']
                pages = int(rows/self.__PAGESIZE__)+1
            if self.__DEBUG__:
                print("%s: response: %s" % (self.__class__.__name__,js))
            if self.__DEBUG__:
                print("%s: tpages/page/pagesize: %s/%s/%s" % (self.__class__.__name__,pages,page,self.__PAGESIZE__))
            ret = js['Data']
            if page <= pages:
                ret += self.getData(payload,page+1)
            return ret

        if self.requestType() == 'PUT':
            u = "%s%s" % (self.__BASE__,call) 
            if self.__DEBUG__:
                print("DEBUG: u=%s" % u)
            headers = {
              'Content-Type': 'application/json',
              'accessToken': self.getSession(),
              'x-linkname': 'poundpain1.salesmate.io'
            }
            if self.__DEBUG__:
                print("DEBUG: payload=%s" % payload)
            r = requests.request('PUT',u,headers=headers,data=payload)
            if self.__DEBUG__:
                print("status: %s" % r.status_code)
            if r.status_code != 200:
                print(json.dumps(json.loads(payload),indent=4,sort_keys=True))
                raise Exception("%s: %s" % (r.status_code,r.text))
            js = json.loads(r.text)
            if self.__DEBUG__:
                print("response: %s" % js)
            ### data
            ### fromDate
            ### toDate
            ### totalRows
            pages = 0
            if 'Data' in js and 'totalRows' in js['Data']:
                # Paging goes here
                if self.__DEBUG__:
                    print("post: call=%s" % call)
                rows = js['Data']['totalRows']
                pages = int(rows/self.__PAGESIZE__)+1
                if self.__DEBUG__:
                    print("%s: rows=%s" % (self.__class__.__name__,js['Data']['totalRows']))
            ret = {}
            if self.__DEBUG__:
                print("%s: response: %s" % (self.__class__.__name__,js))
            if self.__DEBUG__:
                print("%s: tpages/page/pagesize: %s/%s/%s" % (self.__class__.__name__,pages,page,self.__PAGESIZE__))
            if 'Data' in js:
                ret = js['Data']
            if 'Data' in js and 'data' in js['Data']:
                ret = js['Data']['data']
            if self.__DEBUG__:
                print("slen=%s" % len(ret))
            if self.__DEBUG__:
                print("ret=%s" % ret)
            if page <= pages and not self.__ISUPDATE__:
                ret += self.getData(payload,page+1)
            if self.__DEBUG__:
                print("len=%s" % len(ret))
            return ret

        if self.requestType() == 'POST':
            u = "%s%s" % (self.__BASE__,call) 
            if self.__DEBUG__:
                print("DEBUG: u=%s" % u)
            headers = {
              'Content-Type': 'application/json',
              'accessToken': self.getSession(),
              'x-linkname': 'poundpain1.salesmate.io'
            }
            if self.__DEBUG__:
                print("DEBUG: payload=%s" % payload)
            r = requests.request('POST',u,headers=headers,data=payload)
            if self.__DEBUG__:
                print("status: %s" % r.status_code)
            if r.status_code != 200:
                print(json.dumps(json.loads(payload),indent=4,sort_keys=True))
                raise Exception("%s: %s" % (r.status_code,r.text))
            js = json.loads(r.text)
            if self.__DEBUG__:
                print("response: %s" % js)
            ### data
            ### fromDate
            ### toDate
            ### totalRows
            pages = 0
            if 'Data' in js and 'totalRows' in js['Data']:
                # Paging goes here
                if self.__DEBUG__:
                    print("post: call=%s" % call)
                rows = js['Data']['totalRows']
                pages = int(rows/self.__PAGESIZE__)+1
                if self.__DEBUG__:
                    print("%s: rows=%s" % (self.__class__.__name__,js['Data']['totalRows']))
            ret = {}
            if self.__DEBUG__:
                print("%s: response: %s" % (self.__class__.__name__,js))
            if self.__DEBUG__:
                print("%s: tpages/page/pagesize: %s/%s/%s" % (self.__class__.__name__,pages,page,self.__PAGESIZE__))
            if 'Data' in js:
                ret = js['Data']
            if 'Data' in js and 'data' in js['Data']:
                ret = js['Data']['data']
            if self.__DEBUG__:
                print("slen=%s" % len(ret))
            if self.__DEBUG__:
                print("ret=%s" % ret)
            if page <= pages and not self.__ISUPDATE__:
                if not isinstance(ret,dict):
                    ret += self.getData(payload,page+1)
            if self.__DEBUG__:
                print("len=%s" % len(ret))
            return ret
            

class SM_User(SM_Base):

    def __init__(self):
        super().__init__()

    def get(self,*args,**kwargs):
        self.setCall('/apis/core/v4/users?status=active')
        return self.getData(*args,**kwargs)

class SM_Contacts(SM_Base):

    def __init__(self):
        super().__init__()

    def getPayload(self):
        j = {
          "displayingFields": [
            "contact.textCustomField1",
            "contact.textCustomField2",
            "contact.textCustomField3",
            "contact.textCustomField4",
            "contact.textCustomField5",
            "contact.textCustomField6",
            "contact.company.name",
            "contact.company.id",
            "contact.company.photo",
            "contact.designation",
            "contact.type",
            "contact.email",
            "contact.mobile",
            "contact.phone",
            "contact.billingCity",
            "contact.billingCountry",
            "contact.tags",
            "contact.name",
            "contact.lastNoteAddedBy.name",
            "contact.lastNoteAddedBy.photo",
            "contact.lastNoteAddedBy.id",
            "contact.lastNoteAddedAt",
            "contact.lastNote",
            "contact.lastCommunicationMode",
            "contact.lastCommunicationBy",
            "contact.lastCommunicationAt",
            "contact.lastModifiedBy.name",
            "contact.lastModifiedBy.photo",
            "contact.lastModifiedBy.id",
            "contact.website",
            "contact.createdBy.name",
            "contact.createdBy.photo",
            "contact.createdBy.id",
            "contact.lastModifiedAt",
            "contact.openDealCount",
            "contact.utmSource",
            "contact.utmCampaign",
            "contact.utmTerm",
            "contact.utmMedium",
            "contact.utmContent",
            "contact.notes",
            "contact.library",
            "contact.emailMessageCount",
            "contact.description",
            "contact.photo",
            "contact.emailOptOut",
            "contact.firstName",
            "contact.lastName",
            "contact.id"
          ],
          "filterQuery": {
            "group": {
              "operator": "AND",
              "rules": [
                {
                  "condition": "IS_AFTER",
                  "moduleName": "Contact",
                  "field": {
                    "fieldName": "contact.createdAt",
                    "displayName": "Created At",
                    "type": "DateTime"
                  },
                  "data": "Jan 01, 1970 05:30 AM",
                  "eventType": "DateTime"
                }
              ]
            }
          },
          "sort": {
            "fieldName": "contact.createdAt",
            "order": "desc"
          },
          "moduleId": 1,
          "getRecordsCount": True
        }
        return json.dumps(j)

    def get(self,*args,**kwargs):
        self.setCall('/apis/contact/v4/search?rows=1000&from=0')
        self.setType('POST')
        toget = self.getPayload()
        return self.getData(payload=toget)

    def update(self,args,dryrun=False,raw=False):
        self.setCall('/apis/contact/v4')
        self.setType('POST')
        upd = args
        toset = {}
        additional = []
        if raw:
            toset = args
        else:
            for x in upd:
                if x in CONTACT_MAPPING:
                    v = CONTACT_MAPPING[x] 
                    toset[v] = upd[x]
            for x in additional:
                toset[x] = upd[x]
        if 'id' in toset:
            if self.__DEBUG__:
                print("setting to PUT")
            self.setType('PUT')
        if dryrun:
            print("CONTACTSET:%s" % json.dumps(toset,indent=4))
            return {'id':None}
        else:
            return self.getData(payload=json.dumps(toset))
    
class SM_Companies(SM_Base):
    def __init__(self):
        super().__init__()

    def getPayload(self):
        j = {
          "displayingFields": [
            "company.type",
            "company.painid",
            "company.website",
            "company.painurl",
            "company.saleslink",
            "company.addressesid",
            "company.address",
            "company.phone",
            "company.billingAddressLine1",
            "company.textCustomField3",
            "company.tags",
            "company.annualRevenue",
            "company.billingCity",
            "company.owner.name",
            "company.owner.email",
            "company.owner.id",
            "company.name",
            "company.billingState",
            "company.billingCountry",
            "company.totalAmountOfOpenDeal",
            "company.lastCommunicationAt",
            "company.lastCommunicationMode",
            "company.openActivities",
            "company.totalAmountOfWonDeal",
            "company.textCustomField1",
            "company.textCustomField2",
            "company.textCustomField3",
            "company.textCustomField4",
            "company.textCustomField5",
            "company.textCustomField6",
            "company.wonDealCount",
            "company.lostDealCount",
            "company.openDealCount",
            "company.phone",
            "company.photo",
            "company.createdAt",
            "company.id"
          ],
          "filterQuery": {
            "group": {
              "operator": "AND",
              "rules": [
                {
                  "condition": "IS_AFTER",
                  "moduleName": "Company",
                  "field": {
                    "fieldName": "company.createdAt",
                    "displayName": "Created At",
                    "type": "DateTime"
                  },
                  "data": "Jan 01, 1970 05:30 AM",
                  "eventType": "DateTime"
                }
              ]
            }
          },
          "sort": {
            "fieldName": "company.createdAt",
            "order": "desc"
          },
          "moduleId": 5,
          "getRecordsCount": True
        }
        return json.dumps(j)

    def get(self,*args,**kwargs):
        self.setType('POST')
        self.setCall('/apis/company/v4/search?rows=1000&from=0')
        toget = self.getPayload()
        return self.getData(payload=toget)

    def update(self,args,dryrun=False,raw=False):
        self.setType('POST')
        self.setCall('/apis/company/v4')
        upd = args
        toset = {}
        additional = []
        if raw:
            toset = args
        else:
            for x in upd:
                if x in COMPANY_MAPPING:
                    v = COMPANY_MAPPING[x] 
                    toset[v] = upd[x]
            for x in additional:
                toset[x] = upd[x]
        if 'id' in toset:
            print("foundid")
            if self.__DEBUG__:
                print("setting to PUT")
            self.setCall('/apis/company/v4/%s' % toset['id'])
            self.setType('PUT')
            self.setIsUpdate(True)
        if dryrun:
            print("COMPANYSET:%s" % json.dumps(toset,indent=4))
            return {'id':None}
        else:
            ret = self.getData(payload=json.dumps(toset))
            if self.__DEBUG__:
                print(ret)
            return ret

class SM_Deals(SM_Base):
    def __init__(self):
        super().__init__()

    def getPayload(self):
        j = {
          "displayingFields": [
            "deal.checkboxCustomField1",
            "deal.checkboxCustomField2",
            "deal.checkboxCustomField3",
            "deal.decimalCustomField1",
            "deal.textCustomField1",
            "deal.textCustomField2",
            "deal.textCustomField3",
            "deal.textCustomField4",
            "deal.textCustomField5",
            "deal.textCustomField6",
            "deal.textCustomField7",
            "deal.textCustomField8",
            "deal.textCustomField9",
            "deal.textCustomField10",
            "deal.id",
            "deal.title",
            "deal.primaryContact.totalActivities",
            "deal.primaryContact.id",
            "deal.primaryContact.phone",
            "deal.primaryContact.photo",
            "deal.primaryContact.closedActivities",
            "deal.primaryContact.openActivities",
            "deal.lastModifiedAt",
            "deal.pipeline",
            "deal.stage",
            "deal.owner.name",
            "deal.owner.photo",
            "deal.owner.id",
            "deal.lastCommunicationBy",
            "deal.source",
            "deal.dealValue",
            "deal.status",
            "deal.estimatedCloseDate",
            "deal.lastNote",
            "deal.lastActivityAt",
            "deal.primaryCompany.name",
            "deal.primaryCompany.id",
            "deal.primaryCompany.phone",
            "deal.primaryCompany.photo",
            "deal.lostReason",
            "deal.currency",
            "deal.priority",
            "deal.tags",
            "deal.description",
            "deal.closedDate",
            "deal.primaryContact.name",
            "deal.lastCommunicationAt",
            "deal.primaryContact.firstName",
                "deal.primaryContact.lastName"
              ],
              "filterQuery": {
                "group": {
                  "operator": "AND",
                  "rules": [
                    {
                      "condition": "IS_AFTER",
                      "moduleName": "Deal",
                      "field": {
                        "fieldName": "deal.createdAt",
                        "displayName": "Created At",
                        "type": "DateTime"
                      },
                      "data": "Jan 01, 1970 05:30 AM",
                      "eventType": "DateTime"
                    }
                  ]
                }
              },
              "sort": {
                "fieldName": "deal.createdAt",
                "order": "desc"
              },
              "moduleId": 4,
              "getRecordsCount": True
            }
        return json.dumps(j)

    def get(self,*args,**kwargs):
        self.setType('POST')
        self.setCall('/apis/deal/v4/search?rows=1000&from=0')
        toget = self.getPayload()
        j = self.getData(payload=toget)
        return j

    def update(self,args,dryrun=False,raw=False):
        self.setCall('/apis/deal/v4')
        self.setType('POST')
        upd = args
        if 'Id' in upd and upd['Id'] is not None and len(str(upd['Id'])) > 0:
            self.setCall('/apis/deal/v4/%s' % upd['Id'])
            self.setType('PUT')
            self.setIsUpdate(True)
        toset = {}
        if raw:
            toset = args
        else:
            additional = [
                'primaryContact',
                'primaryCompany',
                'owner',
                'tags',
                'stage',
                'title'
            ]
            for x in upd:
                if x in DEAL_MAPPING:
                    v = DEAL_MAPPING[x] 
                    toset[v] = upd[x]
                    if 'checkbox' in v:
                        if toset[v]:
                            toset[v] = True
                        else:
                            toset[v] = False
            for x in additional:
                if x in upd:
                    toset[x] = upd[x]
        if 'id' in toset:
            if self.__DEBUG__:
                print("setting to PUT")
            self.setType('PUT')
        if dryrun:
            print("DEALSET:%s" % json.dumps(toset,indent=4))
            return {'id':None}
        else:
            print("sending: %s" % toset)
            return self.getData(payload=json.dumps(toset))

def getContacts(debug=False):
    CONTACTS = {}
    contact = SM_Contacts()
    contact.setDebug(debug)
    F = "sm_contacts.json"
    if os.path.exists(F):
        print("using cached file: %s" % F)
        H=open(F,"r")
        js = json.loads(H.read())
        H.close()
        return js
    for x in contact.get():
        # print("contact=%s" % json.dumps(x,sort_keys=True))
        v = str(x['id'])
        CONTACTS[v] = x
    H=open(F,"w")
    H.write(json.dumps(CONTACTS,indent=4,sort_keys=True))
    H.close()
    return CONTACTS

def getDeals(debug=False):
    deals = SM_Deals()
    DEALS = {}
    deals.setDebug(debug)
    F = "sm_deals.json"
    if os.path.exists(F):
        print("using cached file: %s" % F)
        H=open(F,"r")
        js = json.loads(H.read())
        H.close()
        return js
    for x in deals.get():
        # print("deal=%s" % json.dumps(x,sort_keys=True))
        v = str(x['id'])
        DEALS[v] = x
    H=open(F,"w")
    H.write(json.dumps(DEALS,indent=4,sort_keys=True))
    H.close()
    return DEALS

def getActivity(debug=False):
    USERS = {}
    users = SM_Activity()
    users.setDebug(debug)
    F = "sm_activity.json"
    if os.path.exists(F):
        print("using cached file: %s" % F)
        H=open(F,"r")
        js = json.loads(H.read())
        H.close()
        return js
    for x in users.get():
        # print("user=%s" % json.dumps(x,sort_keys=True))
        v = str(x['id'])
        USERS[v] = x
    H=open(F,"w")
    H.write(json.dumps(USERS,indent=4,sort_keys=True))
    H.close()
    return USERS

def getUsers(debug=False):
    USERS = {}
    users = SM_User()
    users.setDebug(debug)
    F = "sm_users.json"
    if os.path.exists(F):
        print("using cached file: %s" % F)
        H=open(F,"r")
        js = json.loads(H.read())
        H.close()
        return js
    for x in users.get():
        # print("user=%s" % json.dumps(x,sort_keys=True))
        v = str(x['id'])
        USERS[v] = x
    H=open(F,"w")
    H.write(json.dumps(USERS,indent=4,sort_keys=True))
    H.close()
    return USERS


def getCompanies(debug=False):
    COMPANIES = {}
    company = SM_Companies()
    F = "sm_companies.json"
    if os.path.exists(F):
        print("using cached file: %s" % F)
        H=open(F,"r")
        js = json.loads(H.read())
        H.close()
        return js
    company.setDebug(debug)
    for x in company.get():
        # print("company=%s" % json.dumps(x,sort_keys=True))
        v = str(x['id'])
        COMPANIES[v] = x
    H=open(F,"w")
    H.write(json.dumps(COMPANIES,indent=4,sort_keys=True))
    H.close()
    return COMPANIES

def flattenDict(d,v=None):
    newdict = {}
    #print("v=%s" % v)
    #print("d=%s" % d)
    for x in d:
        #print("x=%s,t=%s" % (x,type(d[x])))
        if isinstance(d[x],dict):
            g = flattenDict(d[x],v=x)
            for b in g:
                newdict[b] = g[b]
        elif v is not None:
            newdict["%s.%s" % (v,x)] = d[x]
        else:
            newdict[x] = d[x]
    #print("retdict=%s" % newdict)
    return newdict

def normalizeDictionary(values,src,debug=False):
    ret = {}
    values = flattenDict(values)
    if debug:
        print("values=%s" % values)
    for x in src:
        v = src[x]
        #if debug:
        #    print("x=%s,v=%s" % (x,v))
        if x in values:
            ret[v] = values[x]
        else:
            ret[v] = None
    if debug:
        print("normalize=%s" % ret)
    return ret

def normalizeSMContact(j,debug=False):
    if debug:
        print("normalize contact")
    return normalizeDictionary(j,CONTACT_MAPPING_REV,debug)

def normalizeSMCompany(j,debug=False):
    if debug:
        print("normalize company")
    return normalizeDictionary(j,COMPANY_MAPPING_REV,debug)
        
def normalizeSMDeal(j,debug=False):
    if debug:
        print("normalize deal")
    return normalizeDictionary(j,DEAL_MAPPING_REV,debug)

class SM_Activity(SM_Base):

    def __init__(self):
        super().__init__()

    def getPayload(self):
        j = {
          "displayingFields": [
            "activity.isCompleted",
            "activity.title",
            "activity.primaryCompany.name",
            "activity.primaryCompany.id",
            "activity.primaryCompany.photo",
            "activity.type",
            "activity.tags",
            "activity.note",
            "activity.duration",
            "activity.primaryContact.name",
            "activity.primaryContact.id",
            "activity.primaryContact.photo",
            "activity.owner.name",
            "activity.owner.photo",
            "activity.owner.id",
            "activity.createdAt",
            "activity.dueDate",
            "activity.lastModifiedAt",
            "activity.outcome",
            "activity.completedAt",
            "activity.lastNoteAddedAt",
            "activity.lastNoteAddedBy.name",
            "activity.lastNoteAddedBy.photo",
            "activity.lastNoteAddedBy.id",
            "activity.lastNote",
            "activity.relatedTo.title",
            "activity.relatedTo.id",
            "activity.endDate",
            "activity.primaryContact.firstName",
            "activity.primaryContact.lastName",
            "activity.id"
          ],
          "filterQuery": {
            "group": {
              "operator": "AND",
              "rules": [
                {
                  "condition": "IS_AFTER",
                  "moduleName": "Contact",
                  "field": {
                    "fieldName": "activity.createdAt",
                    "displayName": "Created At",
                    "type": "DateTime"
                  },
                  "data": "Jan 01, 1970 05:30 AM",
                  "eventType": "DateTime"
                }
              ]
            }
          },
          "sort": {
            "fieldName": "activity.createdAt",
            "order": "desc"
          },
          "moduleId": 1,
          "getRecordsCount": True
        }
        return json.dumps(j)

    def get(self,*args,**kwargs):
        self.setCall('/apis/activity/v4/search?rows=1000&from=0')
        self.setType('POST')
        toget = self.getPayload()
        return self.getData(payload=toget)

    def update(self,args,dryrun=False,raw=False):
        self.setCall('/apis/activity/v4')
        self.setType('POST')
        upd = args
        toset = {}
        additional = []
        if raw:
            toset = args
        else:
            for x in upd:
                if x in CONTACT_MAPPING:
                    v = CONTACT_MAPPING[x] 
                    toset[v] = upd[x]
            for x in additional:
                toset[x] = upd[x]
        if 'id' in toset:
            if self.__DEBUG__:
                print("setting to PUT")
            self.setType('PUT')
        if dryrun:
            print("CONTACTSET:%s" % json.dumps(toset,indent=4))
            return {'id':None}
        else:
            return self.getData(payload=json.dumps(toset))
