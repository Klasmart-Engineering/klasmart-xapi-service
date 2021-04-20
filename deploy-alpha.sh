aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 871601235178.dkr.ecr.ap-northeast-2.amazonaws.com
docker build -t kidsloop-alpha-xapi-ace-ray .
docker tag kidsloop-alpha-xapi-ace-ray:latest 871601235178.dkr.ecr.ap-northeast-2.amazonaws.com/kidsloop-alpha-xapi-ace-ray:latest
docker push 871601235178.dkr.ecr.ap-northeast-2.amazonaws.com/kidsloop-alpha-xapi-ace-ray:latest
aws ecs update-service --region ap-northeast-2 --service arn:aws:ecs:ap-northeast-2:871601235178:service/kidsloop-alpha/kidsloop-alpha-xapi --force-new-deployment --cluster kidsloop-alpha