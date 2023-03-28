import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { MyCognitoUserPool } from "./cognito/cognito-user-pool";
import { MySecrets } from "./secrets/secrets";
import { MyCognitoPostConfirmationLambda } from "./lambda/cognito-post-confirmation-lambda";
import { MyRdsInstance } from "./rds/rds-instance";
import { MyDynamoDbLambdas } from "./dynamodb/dynamodb-lambdas";
import { MyDynamoDB } from "./dynamodb/dynamodb";
import { Provider } from "cdktf-local-exec";
import * as random from "@cdktf/provider-random";


class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      profile: "aws-bootcamp",
      region: "us-east-1",
    });

    new Provider(this, "local-exec");

    new random.provider.RandomProvider(this, "random");
    
    const mySecrets = new MySecrets(this, 'my-secrets');
    const myRdsInstance = new MyRdsInstance(this, 'my-rds-instance', mySecrets);
    const myCognitoPostConfirmationLambda = new MyCognitoPostConfirmationLambda(this,'cognito-post-confirmation-lambda',myRdsInstance.myDbInstance,myRdsInstance.securityGroupId);
    new MyCognitoUserPool(this,'user-pool',mySecrets,myCognitoPostConfirmationLambda);
    new MyDynamoDbLambdas(this,'my-dynamodb-lambda');
    new MyDynamoDB(this,'my-dynamodb');
  }
}

const app = new App();
new MyStack(app, "aws-bootcamp");
app.synth();
