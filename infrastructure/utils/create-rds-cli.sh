#!/bin/bash
aws rds create-db-instance \
  --db-instance-identifier cruddur-db-instance \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version  14.6 \
  --master-username root \
  --master-user-password "$(aws secretsmanager get-secret-value --secret-id my-rds-bootcamp-master-passwordjzr7 --profile aws-bootcamp --query SecretString --output text)"\
  --allocated-storage 20 \
  --availability-zone us-east-1a \
  --backup-retention-period 0 \
  --port 5432 \
  --no-multi-az \
  --db-name cruddur \
  --storage-type gp2 \
  --publicly-accessible \
  --storage-encrypted \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --no-deletion-protection \
  --profile aws-bootcamp


# Add this IP into the security group
#GITPOD_IP=$(curl ifconfig.me)