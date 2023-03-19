import { Construct } from "constructs";
import * as child_process from 'child_process';
import * as path from 'path';
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import * as random from "@cdktf/provider-random";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { AssetType, TerraformAsset} from "cdktf";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { S3Object } from "@cdktf/provider-aws/lib/s3-object";

const lambdaRolePolicy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }
    ]
};

export class MyCognitoPostConfirmationLambda extends Construct {
    public readonly lambdaARN: string;
    constructor(scope: Construct, name: string) {
        super(scope, name);

        const lambdaCognitoPath = path.join(__dirname, 'cognito-lambda');

        // Execute shell command to create the ZIP file
        const command = `cd ${lambdaCognitoPath} && pip install -r requirements.txt -t ./ --no-user`;
        child_process.execSync(command);

        // Create S3 bucket that will contain the lambda code
        new random.provider.RandomProvider(this, "random");

        // Create random value
        const bucketSuffix = new random.pet.Pet(this, "random-bucket-suffix", {
            length: 2,
        });

        // Create Lambda executable
        const lambdaAsset = new TerraformAsset(this, "lambda-asset", {
            path: path.resolve(__dirname, lambdaCognitoPath),
            type: AssetType.ARCHIVE, // if left empty it infers directory and file
        });

        // Create unique S3 bucket that hosts Lambda executable
        const bucketLambdaCode = new S3Bucket(this, "bucket-lambda-code", {
            bucketPrefix: `cognito-lambda-code-${bucketSuffix.id}`,
        });

        // Create Lambda role
        const role = new IamRole(this, "cognito-lambda-exec", {
            name: `${name}-${bucketSuffix.id}`,
            assumeRolePolicy: JSON.stringify(lambdaRolePolicy)
        });

        // Add execution role for lambda to write to CloudWatch logs
        new IamRolePolicyAttachment(this, "cognito-lambda-managed-policy", {
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            role: role.name
        });


        // Upload Lambda zip file to newly created S3 bucket
        const lambdaArchive = new S3Object(this, "lambda-archive", {
            bucket: bucketLambdaCode.bucket,
            key: `${lambdaAsset.fileName}`,
            source: lambdaAsset.path, // returns a posix path
        });



        // Create the AWS Lambda function
        const lambda = new LambdaFunction(this, 'MyLambdaFunction', {
            functionName: "cognito-post-confirmation",
            role: role.arn,
            runtime: "python3.8",
            s3Bucket: bucketLambdaCode.bucket,
            s3Key: lambdaArchive.key,
            handler: 'handler.lambda_handler',
        });

        // Execute shell command to clean lambda dependencies
        const command_clean = `cd ${lambdaCognitoPath} && find . -not -name cognito-post-confirmation.py ! -name requirements.txt -delete`;
        child_process.execSync(command_clean);

        this.lambdaARN = lambda.arn;
    }
}