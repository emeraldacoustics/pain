#!/usr/bin/python
import argparse
import os
import sys
from jira import JIRA

parser = argparse.ArgumentParser()
parser.add_argument('--tag', dest="tag", action="store")
args = parser.parse_args()

if args.tag is None:
    print("--tag <version> required")

options = {}
# replce server address with actual Jira host for your case
options = {'server': 'https://poundpain.atlassian.net'}
#login
# jira = JIRA(options, basic_auth=(os.environ['JIRA_USERNAME'], os.environ['JIRA_PASSWORD']))
jira = JIRA(options, 
    basic_auth=(
        "paul@poundpain.com",
        "ATATT3xFfGF0knQgSNgZIaQFXgkxcH5SiYImh8kSgDDn_b4hsYP6YNcTcrL52L8b3M9b3bYNH1izmB5MRsg_Qfbt1RED9xWnatx6eqp0WODOGCBcDzzOYWnh68Qr4ghXRBcKyAhcCjACOs_kk2-YLD0U8vBQnkuv0qZUtf640u_fVzQlBtgyLlk=CC5DBFC4"
    )
)

#get currently available version names
projects = jira.projects()
print(projects)
project = jira.project('PAIN')
versions = jira.project_versions(project)
current_versions = [v.name for v in reversed(versions)]

vname = args.tag
# check in the existing version names
if vname in current_versions:
    print(vname, ": exists")
else:
    # try to create new
    try:
        version = jira.create_version(name=vname, project='PAIN')
        print(vname, ": created, all good")
    except:
        print(vname, ": creation failed")
