
# System is MySQL (Maria), Python and React.
# URLS
## UAT (Tor) - https://uat.gomaxpain.com
## UAT (API) - https://uat-api.gomaxpain.com
## UAT (Provider) - https://uat-providers.gomaxpain.com
## UAT (Clients) - https://uat-clients.gomaxpain.com
## UAT (Legal) - https://uat-legal.gomaxpain.com

# Requirements:
  Python 3 virtual env
  nodejs 16.x
  mysql 8
## mysql config
```
sql-mode        = ""
secure-file-priv = ""
group_concat_max_len = 1000000
- On windows, its C:\ProgramData\MySQL\MySQL Server 8.0\my.ini
```

# Committing and Jira Controls
```git fetch origin
git checkout -b PAIN-123-<branch-name> origin/master
... do some work ...
## git commit -m "PAIN-123 <summary of commit>"
git fetch origin
git rebase -i origin/master
... merge changes as appropriate ...
## Move Ticket to CR
```
# Backend
  cd pain/backend
  ## Flyway - SQL management platform for schema
    mysql> create database pain;
    Crete a file called ./bin/conf/flyway.conf.$USER
      flyway.url=jdbc:mysql://localhost:3306/pain
      flyway.user=user
      flyway.password=pass
      flyway.locations=filesystem:sql
    bash bin/flyway-repair.sh ; bash bin/flyway-migrate.sh
  ### Creating a flyway config
    Rules:
       1) you cant ever go back in time
       2) Never modify an old file
       3) Always tell everyone in chat that you are modifying the database and the version number
       4) Test your changes
       5) Push your DB changes (ONLY) so that everyone stays in sync
    ```
    cd pain/backend
    vi sql/V<version>_0_0__data.sql
    create update, modify tables
    ```
  ## Server
    make virtualenv
    source p/bin/activate
    bash wrapper.sh
    Update settings
      cp settings.tmpl settings.cfg
      Edit the file, change values for your sql instance
  ## Celery
    Make sure in settings.cfg
      local_storage=True
      make sure use_defer doesnt exist
# Chat server
    npm install -g pm2
    npm i
    cp ../backend/settings.cfg
    bash bin/config.sh
    pm2-dev server.py
# Front End
  cd pain/torres
  npm config set legacy-peer-deps true
  cp start-torres-pmaszy.sh start-sing-$USER.sh
  Change values as appropriate
  npm i
  bash start-sing-$USER.sh
## .env
```
REACT_APP_BASE_URL="http://localhost:3001"
REACT_APP_API_BASE_URL="http://localhost:3001"
REACT_APP_STRIPE_KEY="pk_test_51NWP2GBkCI2KshjJ8yD42fw8oSjqeP1xNaqssbC0xAzSZO35HDl9DtZlxnPHg7bVXbBjoth3SPIN0ORSlvElATfC00rQYT3v8n"
REACT_APP_SQUARE_APP_KEY="sandbox-sq0idb-a11c5rnUiHHq1VpamNovzA"
REACT_APP_SQUARE_LOCATION_KEY="LDV5HKSZPAWNS"
REACT_APP_SQUARE_API_KEY="EAAAl7AsQkJxxNO-jpSetAgogK1Rq0V8KNyEVAqeI4lSexkkmkck9lGfrj-63nQ5"
REACT_APP_SALESFORCE_URL="https://poundpain--uat.sandbox.lightning.force.com/"
REACT_APP_GOOGLE_API_KEY=""
REACT_APP_BASE_SITE_TYPE="provider"
```

# Config File
## Server Config
```
  [Configuration]
  bind_port=0.0.0.0
  debug=True
  http_port=8001
  use_sqsbackend=False
  backend_url=redis://localhost:6379/2
  broker_url=redis://localhost:6379/1
  celery_queue_pass=
  celery_queue_user=
  celery_queue_prefix=pain-user-queue
  encryption_salt=JG7ncwAacbfwPyn65fAU8vgvFzmzRNCg
  encryption_key=efutzGMyGLC5zBUSunKqwwVq8m3jVQKk
  document_bucket=pain-dev-documents-bucket
  document_bucket_access_key=
  document_bucket_access_secret=
  request_bucket=pain-dev-data-bucket
  request_bucket_access_key=
  request_bucket_access_secret=
  temporary_files=/tmp
  hdfs_master_node=localhost
  spark_namespace=userdata
  mysql_host=localhost
  mysql_user=root
  mysql_db=pain
  mysql_pass=
  api_url=http://localhost:8001/#
  host_url=http://10.0.0.9:3001
  local_storage=True
  spark_home=/u01/hadoop/spark
  hadoop_home=/u01/hdoop/hadoop-2.10.2
  jdk_home=/usr/lib/jvm/java-11-openjdk-amd64/
  email_user=AKIAZI2LFG5UNK3BKXJW
  email_pass=
  email_to_override=paul@poundpain.com
  stripe_key=sk_test_
  stripe_key_pub=pk_test_51NWP2GBkCI2KshjJ8yD42fw8oSjqeP1xNaqssbC0xAzSZO35HDl9DtZlxnPHg7bVXbBjoth3SPIN0ORSlvElATfC00rQYT3v8n
  local_storage=True
  environment=dev
  email_to_override=<youremail>@poundpain.com
  support_email=<youremail>@poundpain.com
  appt_email_override=<youremail>@poundpain.com
  chat_port=8000
  chat_key=uI2ooxtwHeI6q69PS98fx9SWVGbpQohO
  chat_url=localhost:8000
  chat_deploy=0
```



  
  
