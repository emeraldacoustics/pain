
import os
import sys
sys.path.append(os.getcwd())  # noqa: E402
from util import calcdate
from common.SparkSQLException import SparkSQLException
from sparks.SparkMapping import SparkMapping


sm = SparkMapping()
spark = sm.getSparkConfig('default','pain')
spark.sql("use userdata.db_1_pain")
t = spark.sql("show tables").collect()

tsToExpire = calcdate.getTimeIntervalAddHoursRaw(None,-48).strftime("%Y-%m-%d %H:%M:%S")
for g in t:
    s = """call system.expire_snapshots(table=>'%s',retain_last => 5)
        """ % ("userdata.db_1_pain.%s" % g['tableName'],)
    print("s=%s" % s)
    spark.sql(s)

