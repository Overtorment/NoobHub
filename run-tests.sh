#!/bin/bash


echo starting Noobhub server...
./bin/noobhub-server &
sleep 2

if [ `netstat -ltnup 2>/dev/null | grep 1337 | wc -l` == 1 ]
then
  echo running tests...
  nodejs client/js/client.test.js
  echo killing Noobhub server...
  jobs -l | awk '{print $2}' | xargs kill -9
else
  echo Noobhub not started, tests didnt run
fi