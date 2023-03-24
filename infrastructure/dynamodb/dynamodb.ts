import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { Construct } from "constructs";

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

export class MyDynamoDB extends Construct {
    constructor(scope: Construct, name: string) {
        super(scope, name);
        new DynamodbTable(this, 'dynamo-db', {
            name: 'cruddur-messages',
            billingMode: 'PROVISIONED',
            readCapacity: 5,
            writeCapacity: 5,
            hashKey: 'pk', // partition key
            rangeKey: 'sk',// sort key
            attribute: [
                {
                    name: 'pk',
                    type: 'S'
                },
                {
                    name: 'sk',
                    type: 'S'
                }]
        });
    }
}