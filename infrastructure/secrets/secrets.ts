import { SecretsmanagerSecret, SecretsmanagerSecretConfig  } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";
import generator from 'generate-password-ts';
import { Construct } from "constructs";

export class MySecrets extends Construct{

    public readonly cognitoUserPassword: SecretsmanagerSecretVersion;
    public readonly rdsMasterPassword: SecretsmanagerSecretVersion;

    constructor(scope: Construct, name: string) {
        super(scope,name);

        const secretString = generator.generate({
            length: 16,
            numbers: true,
            symbols: true
        });

        const suffix = generator.generate({
            length: 4,
            numbers: true,
            symbols: false,
            uppercase: false
        });

        const secretsmanagerSecretConfig: SecretsmanagerSecretConfig = {
            description: "Password for cognito user",
            name: "my-cognito-user-password-"+suffix
        }
        const cognitoUserSecret = new SecretsmanagerSecret(this, 'cognito-user-secret', secretsmanagerSecretConfig);
        this.cognitoUserPassword = new SecretsmanagerSecretVersion(this, 'cognito-user-secret-version', {
            secretId : cognitoUserSecret.id,
            secretString
        });

        // Database secret password
        const secretPassword = generator.generate({
            length: 16,
            numbers: true
        });

        const passwordSecretsmanagerSecretConfig: SecretsmanagerSecretConfig = {
            description: "Master password rds database",
            name: "my-rds-bootcamp-master-password"+suffix
        }
        const rdsUserSecret = new SecretsmanagerSecret(this, 'rds-master-secret', passwordSecretsmanagerSecretConfig);
        this.rdsMasterPassword = new SecretsmanagerSecretVersion(this, 'rds-master-secret-version', {
            secretId : rdsUserSecret.id,
            secretString : secretPassword
        });
    }        
}