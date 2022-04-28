aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin 942095822719.dkr.ecr.eu-west-2.amazonaws.com
docker build -t kidsloop-h5p-xapi-service .
docker tag kidsloop-h5p-xapi-service:latest 942095822719.dkr.ecr.eu-west-2.amazonaws.com/kidsloop-h5p-xapi-service:latest
docker push 942095822719.dkr.ecr.eu-west-2.amazonaws.com/kidsloop-h5p-xapi-service:latest
