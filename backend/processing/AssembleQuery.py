# coding=utf-8

import os
import json
import unittest

class AssembleQuery:

    def assemble(self, data):
        query = ""
        cols = []
        tabl = []
        groupby = []
        orderby = []
        where = []
        print(json.dumps(data,indent=4,sort_keys=True))
        for n in data['columns']:
            if n['function'] is not None:
                cols.append("%s(%s.%s)" % (n['function'], n['table'], n['field']))
            else:
                cols.append("%s.%s" % (n['table'], n['field']))
        for n in data['tables']:
            tabl.append(n)
        for n in data['groupby']:
            groupby.append("%s.%s" % (n['table'], n['name']))
        orderby = data['orderby'] 
        wcntr = 0
        for n in data["where"]:
            if wcntr > 1:
                where.append(" and ")
            s = ""
            if "table" not in n['right'] and 'free' in n and len(n['free']) > 0:
                s += " %s" % n['free']
            else:
                s = " %s.%s " % (
                    n["left"]["table"],
                    n["left"]["name"]
                )
                s += " %s " % (
                    n["op"]["name"]
                )
                s += " %s.%s " % (
                    n["right"]["table"],
                    n["right"]["name"]
                )
            where.append(s)
            wcntr += 1
        query = "select %s " % (",".join(cols))
        query += " from "
        query += ",".join(tabl)
        if (len(where) > 0):
            query += " where "
            query += " ".join(where)
            pass
        if (len(groupby) > 0):
            query += " group by "
            query += ",".join(groupby)
        if (len(orderby) > 0):
            query += " order by "
            query += ",".join(orderby)
        return query


