import { SecretsmanagerSecret, SecretsmanagerSecretConfig  } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";
import generator from 'generate-password-ts';
import { Construct } from "constructs";

export class MySecrets extends Construct{

    public readonly cognitoUserPassword: SecretsmanagerSecretVersion;

    constructor(scope: Construct, name: string) {
        super(scope,name);

        const secretString = generator.generate({
            length: 16,
            numbers: true,
            symbols: true
        });

        const secretsmanagerSecretConfig: SecretsmanagerSecretConfig = {
            description: "Password for cognito user",
            name: "my-cognito-user-password"
        }
        const cognitoUserSecret = new SecretsmanagerSecret(this, 'cognito-user-secret', secretsmanagerSecretConfig);
        this.cognitoUserPassword = new SecretsmanagerSecretVersion(this, 'cognito-user-secret-version', {
            secretId : cognitoUserSecret.id,
            secretString
        });
    }        
}