import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { MyCognitoUserPool } from "./cognito/cognito-user-pool";


class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      profile: "aws-bootcamp",
      region: "us-east-1",
    });
    
    new MyCognitoUserPool(this,'user-pool')
  }
}

const app = new App();
new MyStack(app, "aws-bootcamp");
app.synth();
