export interface ValidationRule {
  Id: string;
  ValidationName: string;
  Active: boolean;
  Description: string;
  EntityDefinition: {
    QualifiedApiName: string;
  };
}

export interface DeployPayload {
  Id: string;
  Active: boolean;
}