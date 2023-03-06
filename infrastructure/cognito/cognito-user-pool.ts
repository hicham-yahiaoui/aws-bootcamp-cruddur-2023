import { CognitoUserPoolClient } from "@cdktf/provider-aws/lib/cognito-user-pool-client";
import { CognitoUserPool} from '@cdktf/provider-aws/lib/cognito-user-pool';
import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";


export class MyCognitoUserPool extends Construct {
    constructor(scope: Construct, name: string) {
      super(scope, name);
  
      const cognitoUserPool = new CognitoUserPool(this, 'cognito-' + name, {
        name: 'my-user-pool',
        usernameAttributes: ['email'],
        emailConfiguration : {
          emailSendingAccount : "COGNITO_DEFAULT"
        },
        accountRecoverySetting: {
          recoveryMechanism: [
            {
              name : "verified_email",
              priority : 1
            }
          ]
        },
        passwordPolicy: {
          minimumLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: true
        },
        
        schema: [
          {
            attributeDataType : "String",
            mutable : true,
            required: true,
            name : "name",
            stringAttributeConstraints: {
              minLength : '1',
              maxLength : '2048'
            }
          },
          {
            attributeDataType : "String",
            mutable : true,
            required: true,
            name : "preferred_username",
            stringAttributeConstraints: {
              minLength : '1',
              maxLength : '2048'
            }
          }
        ]
      });
  
      const cognitoUserPoolClient = new CognitoUserPoolClient(this, 'cognito-'+name+'-client', {
        name: 'Cruddur',
        userPoolId : cognitoUserPool.id
      });

      new TerraformOutput(scope,'cognito-user-client-name',{
        value : cognitoUserPoolClient.name
      })
    }
  }