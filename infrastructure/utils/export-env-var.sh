#!/bin/bash
export REACT_APP_CLIENT_ID=$(cdktf output aws-bootcamp | awk '/cognito-user-pool-id/ {print $3}')
export REACT_APP_AWS_USER_POOLS_ID=$(cdktf output aws-bootcamp | awk '/cognito-user-pool-id/ {print $3}')
gp env REACT_APP_CLIENT_ID=$(cdktf output aws-bootcamp | awk '/cognito-user-pool-id/ {print $3}')
gp env REACT_APP_AWS_USER_POOLS_ID=$(cdktf output aws-bootcamp | awk '/cognito-user-pool-id/ {print $3}')