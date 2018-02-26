#/bin/env bash
#
# Run a docker image and write the container id (CID) and mapped port into
# a properties file.
#
# run_container.sh <IMAGE_BASENAME> <IMAGE_VERSION> <APP_PORT>

IMAGE_BASENAME=$1
IMAGE_VERSION=$2
APP_PORT=$3

rm -f $IMAGE_BASENAME-$IMAGE_VERSION.cid
docker pull madhuabburu/$IMAGE_BASENAME:$IMAGE_VERSION
docker run -itdp :$APP_PORT --link mongodb:mongo --privileged --cidfile="$IMAGE_BASENAME-$IMAGE_VERSION.cid" madhuabburu/$IMAGE_BASENAME:$IMAGE_VERSION
CID=`cat $IMAGE_BASENAME-$IMAGE_VERSION.cid`
PORT=`docker port $CID $APP_PORT | cut -d ':' -f2`
echo "CID=$CID" > $IMAGE_BASENAME-$IMAGE_VERSION.properties
echo "PORT=$PORT" >> $IMAGE_BASENAME-$IMAGE_VERSION.properties
rm $IMAGE_BASENAME-$IMAGE_VERSION.cid
