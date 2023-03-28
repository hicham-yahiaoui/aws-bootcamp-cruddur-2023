import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { Construct } from "constructs";

export class MyDynamoDB extends Construct {

    public readonly streamArn: string;
    constructor(scope: Construct, name: string) {
        super(scope, name);
        const dynamoDbTable = new DynamodbTable(this, 'dynamo-db', {
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
                }, {
                    name: 'message_group_uuid',
                    type: 'S'
                },],
            globalSecondaryIndex: [
                {
                    name: 'message-group-sk-index',
                    hashKey: 'message_group_uuid',
                    rangeKey: 'sk',
                    readCapacity: 5,
                    writeCapacity: 5,
                    projectionType: 'ALL',
                }
            ],
            streamEnabled: true,
            streamViewType: 'NEW_IMAGE'
        });

        this.streamArn = dynamoDbTable.streamArn;
    }
}