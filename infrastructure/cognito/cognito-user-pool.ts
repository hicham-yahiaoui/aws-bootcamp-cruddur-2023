import { CognitoUserPoolClient } from "@cdktf/provider-aws/lib/cognito-user-pool-client";
import { CognitoUserPool} from '@cdktf/provider-aws/lib/cognito-user-pool';
import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";
import { MySecrets } from "../secrets/secrets";
import { CognitoUser } from "@cdktf/provider-aws/lib/cognito-user";


export class MyCognitoUserPool extends Construct {
    constructor(scope: Construct, name: string, secrets: MySecrets) {
      super(scope, name);
      const cognitoUserPool = new CognitoUserPool(this, 'cognito-' + name, {
        name: 'my-user-pool',
        usernameAttributes: ['email'],
        autoVerifiedAttributes : ['email'],
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
        userPoolId : cognitoUserPool.id,
        dependsOn: [cognitoUserPool]
      });

      const cognitoUser = new CognitoUser(this, 'cognito-user', {
        userPoolId : cognitoUserPool.id,
        username : 'hicham.yahiaoui@bootcamp.com',
        password : secrets.cognitoUserPassword.secretString,
        attributes : {
          "preferred_username" : "hyahiaoui",
          "name" : "Hicham Yahiaoui"
        },
        dependsOn: [cognitoUserPool]
      });

      new TerraformOutput(scope,'cognito-user-client-name',{
        value : cognitoUserPoolClient.name
      })

      new TerraformOutput(scope,'cognito-user-client-id',{
        value : cognitoUserPoolClient.id
      })

      new TerraformOutput(scope,'cognito-user-pool-id',{
        value : cognitoUserPool.id
      })

      new TerraformOutput(scope,'cognito-user-name',{
        value : cognitoUser.username
      })
    }
  }