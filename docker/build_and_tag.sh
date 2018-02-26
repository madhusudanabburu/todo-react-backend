#build_and_tag <directory of Dockerfile> <resultant docker image name>

DOCKERFILE_DIRECTORY=$1
DOCKER_IMAGE_NAME=$2

# Build docker image
rm -f docker-built-id
docker build --no-cache=true --rm=true $DOCKERFILE_DIRECTORY \
  | perl -pe '/Successfully built (\S+)/ && `echo -n $1 > docker-built-id`'
if [ ! -f docker-built-id ]; then
  echo "No docker-built-id file found"
  exit 1
fi
DOCKER_BUILD_ID=`cat docker-built-id`
echo $DOCKER_BUILD_ID
echo $DOCKER_IMAGE_NAME
# Tag the new image
docker tag -f $DOCKER_BUILD_ID madhuabburu/$DOCKER_IMAGE_NAME:latest

# Publish this image in a (remote) repository
docker push madhuabburu/$DOCKER_IMAGE_NAME
