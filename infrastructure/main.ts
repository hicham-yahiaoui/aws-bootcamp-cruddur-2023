import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { MyCognitoUserPool } from "./cognito/cognito-user-pool";
import { MySecrets } from "./secrets/secrets";
import { MyCognitoPostConfirmationLambda } from "./lambda/cognito-post-confirmation-lambda";


class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      profile: "aws-bootcamp",
      region: "us-east-1",
    });
    
    const mySecrets = new MySecrets(this, 'my-secrets');
    const myCognitoPostConfirmationLambda = new MyCognitoPostConfirmationLambda(this,'cognito-post-confirmation-lambda');
    new MyCognitoUserPool(this,'user-pool',mySecrets,myCognitoPostConfirmationLambda);    
  }
}

const app = new App();
new MyStack(app, "aws-bootcamp");
app.synth();
