export interface ValidationRule {
  Id: string;
  ValidationName: string;
  Active: boolean;
  Description: string;
  EntityDefinition: {
    QualifiedApiName: string;
  };
}

export interface TokenResponse {
  access_token: string;
  instance_url: string;
  token_type: string;
  scope: string;
}

export interface DeployRulePayload {
  Id: string;
  Active: boolean;
}

export interface ApiError {
  message: string;
  errorCode: string;
}