import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group-rule";
import { Fn } from "cdktf";
import { spawnSync } from "child_process";
import { Construct } from "constructs";
import { MySecrets } from "../secrets/secrets";

export class MyRdsInstance extends Construct {
    public readonly myDbInstance: DbInstance;
    public readonly securityGroupId: string;

    constructor(scope: Construct, name: string, mySecret: MySecrets) {
        super(scope, name);
        // RDS cluster
        this.myDbInstance = new DbInstance(this, 'rds-instance', {
            identifier: 'cruddur-db-instance',
            instanceClass: 'db.t4g.micro',
            engine: 'postgres',
            engineVersion: '14.6',
            username: 'root',
            password: mySecret.rdsMasterPassword.secretString,
            allocatedStorage: 20,
            availabilityZone: 'us-east-1a',
            backupRetentionPeriod: 0,
            port: 5432,
            multiAz: false,
            dbName: 'cruddur',
            storageType: 'gp2',
            publiclyAccessible: true,
            storageEncrypted: true,
            performanceInsightsEnabled: true,
            performanceInsightsRetentionPeriod: 7,
            deletionProtection: false,
            skipFinalSnapshot: true
        });

        this.securityGroupId = Fn.element(this.myDbInstance.vpcSecurityGroupIds,0);

        // Get the public IP address using curl ifconfig.me command
        const ipProcess = spawnSync('curl', ['ifconfig.me']);
        const ip: string = ipProcess.stdout.toString().trim();
        // Define the inbound rule
        new SecurityGroupRule(this, 'my-inbound-rule', {
            type: 'ingress',
            securityGroupId: this.securityGroupId,
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            cidrBlocks: [`${ip}/32`]
        })

    }
}