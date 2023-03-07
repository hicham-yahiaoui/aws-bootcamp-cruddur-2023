import { SecretsmanagerSecret, SecretsmanagerSecretConfig  } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";
import { Construct } from "constructs";

export class MySecrets extends Construct{
    constructor(scope: Construct, name: string) {
        super(scope,name);

        const passwordLength = 8;
        const secretString = generateRandomPassword(passwordLength);

        const secretsmanagerSecretConfig: SecretsmanagerSecretConfig = {
            description: "Password for cognito user",
            name: "my-cognito-user-password"
        }
        const cognitoUserSecret = new SecretsmanagerSecret(this, 'cognito-user-secret', secretsmanagerSecretConfig);
        new SecretsmanagerSecretVersion(this, 'cognito-user-secret-version', {
            secretId : cognitoUserSecret.id,
            secretString
        });

        function generateRandomPassword(length: number) {
            const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
            const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const numberChars = '0123456789';
            const symbolChars = '!@#$%^&*()_+-=';
            const allChars = lowerChars + upperChars + numberChars + symbolChars;
          
            let password = '';
            password += randomChar(lowerChars);
            password += randomChar(upperChars);
            password += randomChar(numberChars);
            password += randomChar(symbolChars);
          
            for (let i = 0; i < length - 4; i++) {
              password += randomChar(allChars);
            }
          
            return password.split('').sort(() => Math.random() - 0.5).join('');
        }
        
        function randomChar(characters: string) {
          return characters.charAt(Math.floor(Math.random() * characters.length));
        }
    }        
}