import { Construct } from "constructs";
import * as child_process from 'child_process';
import * as path from 'path';
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import * as random from "@cdktf/provider-random";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";

export class MyCognitoPostConfirmationLambda extends Construct {
    constructor(scope: Construct, name: string) {
        super(scope, name);
        // Create S3 bucket that will contain the lambda code
        new random.provider.RandomProvider(this, "random");

        // Create random value
        const bucketSuffix = new random.pet.Pet(this, "random-bucket-suffix", {
            length: 4,
        });

        // Create unique S3 bucket that hosts Lambda executable
        const bucketLambdCode = new S3Bucket(this, "bucket-lambda-code", {
            bucketPrefix: `learn-cdktf-${bucketSuffix.id}`,
        });

        const lambdaCognitoPath = path.join(__dirname, 'lambda', 'cognito-lambda');
        const lambdaCognitoZipPath = path.join(lambdaCognitoPath, '..', 'cognito-post-confirmation.zip');

        // Execute shell command to create the ZIP file
        const command = `cd ${lambdaCognitoPath} && pip install -r requirements.txt -t ./ && zip -r ../cognito-post-confirmation.zip . && rm -rf __pycache__ && rm -rf *`;
        child_process.execSync(command);

        // Create the AWS Lambda function
        const lambdaFn = new LambdaFunction(this, 'MyLambdaFunction', {
            functionName: "test",
            role: "role",
            runtime: "python3.8",
            filename: lambdaCognitoZipPath,
            handler: 'handler.lambda_handler',
        });

        // Delete the ZIP file on successful deployment

    }
}