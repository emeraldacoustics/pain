# coding=utf-8

import sys
import boto3
import json
import os
from common import settings

config = settings.config()
config.read('settings.cfg')

def uploadS3ItemToBucketDefault(path, mime, data):
    return uploadS3ItemToBucket(
        config.getKey("request_bucket_access_key"),
        config.getKey("request_bucket_access_secret"),
        config.getKey("request_bucket"),
        path, 
        mime,
        data)

def downloadS3ItemToBucketDefault(path):
    return downloadS3ItemToBucket(
        config.getKey("request_bucket_access_key"),
        config.getKey("request_bucket_access_secret"),
        config.getKey("request_bucket"),
        path, 
        data)

def deleteS3ItemToBucketDefault(path):
    return deleteS3ItemToBucket(
        config.getKey("request_bucket_access_key"),
        config.getKey("request_bucket_access_secret"),
        config.getKey("request_bucket"),
        path, 
        data)

def uploadS3ItemToBucket(access, secret, bucket, path, mime, data):
    if config.getKey("local_storage") is not None:
        d = "./tmp"
        f = "%s/%s" % (d,path)
        g = os.path.dirname(f)
        if not os.path.exists(g):
            os.makedirs(g)
        H = open(f, "wb")
        H.write(data.encode('UTF-8'))
        H.close()
        return
    if access is None:
        raise Exception("INVALID_ACCESS_KEY")
    if secret is None:
        raise Exception("INVALID_SECRET_KEY")
    s3 = boto3.resource(
        's3', aws_access_key_id=access,
        aws_secret_access_key=secret, use_ssl=True)
    obj = s3.Object(bucket, path)
    obj.put(Body=data,ContentType=mime)

def downloadS3ItemFromBucket(access, secret, bucket, path):
    if config.getKey("local_storage") is not None:
        d = "./tmp"
        f = "%s/%s" % (d,path)
        H = open(f, "rb")
        T = H.read()
        return T.decode('UTF-8')
    if access is None:
        raise Exception("INVALID_ACCESS_KEY")
    if secret is None:
        raise Exception("INVALID_SECRET_KEY")
    s3 = boto3.client(
        's3', aws_access_key_id=access,
        aws_secret_access_key=secret, use_ssl=True)
    obj = s3.get_object(Bucket=bucket, Key=path)
    r = obj['Body'].read()
    return r

def deleteS3ItemFromBucket(access, secret, bucket, path):
    if access is None:
        raise Exception("INVALID_ACCESS_KEY")
    if secret is None:
        raise Exception("INVALID_SECRET_KEY")
    s3 = boto3.resource(
        's3', aws_access_key_id=access,
        aws_secret_access_key=secret, use_ssl=True)
    s3.Object(bucket, path).delete()

def iterateBucket(access,secret,bucket,prefix):
    ret = []
    if prefix is not None:
        if prefix.startswith('/'):
            raise Exception('Dont start prefix with /')
    s3 = boto3.client('s3', 
            aws_access_key_id=access,
            aws_secret_access_key=secret)
    paginator = s3.get_paginator('list_objects_v2')
    page_iterator = paginator.paginate(Bucket=bucket,Prefix=prefix)
    for page in page_iterator:
        if 'Contents' not in page:
            continue
        for obj in page['Contents']:
            key = obj['Key']
            if len(prefix) > 0:
                if prefix not in key:
                    continue
            ret.append(key)
    return ret
