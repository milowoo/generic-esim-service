#!/bin/sh

NAME=genericesim
PORT=9220

DIR=/opt/miep/lib/node_modules/$NAME

getpid()
{
  pid=`fuser $PORT/tcp`
}


start()
{
    if [ -z "$pid" ] ; then
        cd $DIR
        npm start
    else
        echo "$NAME is already running, pid=$pid"
        exit 0
    fi
}

stop()
{
    if [ ! -z "$pid" ] ; then
        kill -3 $pid
    fi
}

forceStop()
{
    if [ ! -z "$pid" ] ; then
        kill -9 $pid
    fi
}

getpid

case "$1" in
    start)
        start
    ;;
    stop)
        stop
    ;;
    kill)
        forceStop
    ;;
    status)
        if [ -z "$pid" ] ; then
            echo "$NAME is not running"
            exit 1
        else
            echo "$NAME is running, pid=$pid"
            exit 0
        fi
    ;;
    *)
        echo "Usage: $0 start|stop|kill|status"
        exit 1
    ;;
esac
