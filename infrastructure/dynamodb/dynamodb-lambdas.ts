import { Construct } from "constructs"
import * as path from 'path';
import * as child_process from 'child_process';
import { LocalExec, Provider } from "cdktf-local-exec";
import * as random from "@cdktf/provider-random";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { AssetType, TerraformAsset } from "cdktf";
import { S3Object } from "@cdktf/provider-aws/lib/s3-object";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";

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

export class MyDynamoDbLambdas extends Construct{
    constructor(scope: Construct, name: string) {
        super(scope, name);
        new Provider(this, "local-exec");

        const lambdaDynamodbPath = path.join(__dirname, 'dynamodb-lambdas');

        // Execute shell command to create the ZIP file
        const command = `cd ${lambdaDynamodbPath} && pip install -r requirements.txt -t ./ --no-user`;
        child_process.execSync(command);

        // Create S3 bucket that will contain the lambda code
        new random.provider.RandomProvider(this, "random");

        // Create random value
        const bucketSuffix = new random.pet.Pet(this, "random-bucket-suffix", {
            length: 2,
        });

        // Create unique S3 bucket that hosts Lambda executable
        const bucketLambdaCode = new S3Bucket(this, "bucket-lambda-update-message-groups-code", {
            bucketPrefix: `dynamodb-lambda-code-${bucketSuffix.id}`,
        });

        // Create Lambda role
        const role = new IamRole(this, "lambda-update-message-groups-lambda-exec", {
            name: `${name}-${bucketSuffix.id}`,
            assumeRolePolicy: JSON.stringify(lambdaRolePolicy)
        });

        // Add execution role for lambda to write to CloudWatch logs
        new IamRolePolicyAttachment(this, "lambda-update-message-groups-managed-policy", {
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            role: role.name
        });

        // Add execution role for lambda to write to CloudWatch logs
        new IamRolePolicyAttachment(this, "lambda-update-message-groups-dynamodb-full-access", {
            policyArn: 'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
            role: role.name
        });
        // Create Lambda executable
        const lambdaAsset = new TerraformAsset(this, "lambda-asset", {
            path: path.resolve(lambdaDynamodbPath),
            type: AssetType.ARCHIVE, // if left empty it infers directory and file
        });

        // Upload Lambda zip file to newly created S3 bucket
        const lambdaArchive = new S3Object(this, "lambda-archive", {
            bucket: bucketLambdaCode.bucket,
            key: `${lambdaAsset.fileName}`,
            source: lambdaAsset.path, // returns a posix path
        });

        // Create the AWS Lambda function
        const lambda = new LambdaFunction(this, 'update-message-groups-function', {
            functionName: "update-message-groups",
            role: role.arn,
            runtime: "python3.8",
            s3Bucket: bucketLambdaCode.bucket,
            s3Key: lambdaArchive.key,
            handler: 'update-message-groups.lambda_handler',
        });

        // Execute shell command to clean lambda dependencies
        new LocalExec(this, "local-clean-python-requirements", {
            cwd: lambdaDynamodbPath,
            command: "find . -not -name update-message-groups.py ! -name requirements.txt -delete",
            dependsOn: [lambda],
        });
    }
}