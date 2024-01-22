#!/bin/bash

cd $(dirname ${0})/..

rm -rf publish_aws publish_aws.tar
mkdir -p publish_aws
cp -r * publish_aws/
tar cf publish_aws.tar -C publish_aws .

#tar tf publish_aws.tar   #used to display what is in the TAR


#ssh-add 'Stockholm2019.pem';
scp publish_aws.tar aws/deploy-in-aws.sh ubuntu@ec2-13-49-217-91.eu-north-1.compute.amazonaws.com:
ssh ubuntu@ec2-13-49-217-91.eu-north-1.compute.amazonaws.com "./deploy-in-aws.sh"

#rm -rf publish_aws publish_aws.tar

#chmod u+x deploy-in-aws.sh I did that on the server the first time 