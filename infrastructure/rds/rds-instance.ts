import { RdsCluster } from "@cdktf/provider-aws/lib/rds-cluster";
import { RdsClusterInstance } from "@cdktf/provider-aws/lib/rds-cluster-instance";
import { Construct } from "constructs";
import { MySecrets } from "../secrets/secrets";

export class MyRdsInstance extends Construct{
    constructor(scope: Construct, name:string, mySecret: MySecrets){
        super(scope,name);
        // RDS cluster
        const rdsCluster = new RdsCluster(this,'rds-cluster',{
            clusterIdentifier: 'bootcamp-rds-cluster',
            databaseName: "cruddur",
            masterUsername: "root",
            masterPassword: mySecret.rdsMasterPassword.secretString,
            engine: "postgres",
            engineVersion: "14.6",
            allocatedStorage: 20,
            availabilityZones: ["us-east-1a"],
            port: 5432,
            storageType: "gp2",
            storageEncrypted: true,
            deletionProtection: false
        });
        // RDS cluster instance
        new RdsClusterInstance(this,'rds-cluster-instance',{
            clusterIdentifier: rdsCluster.id,
            instanceClass: "db.t4g.micro",
            publiclyAccessible: true,
            performanceInsightsEnabled: true,
            performanceInsightsRetentionPeriod: 7,
            
        })
    }

}