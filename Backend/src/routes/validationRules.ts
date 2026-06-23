import { Router } from 'express';
import type { Request, Response } from 'express';
import axios from 'axios';
import type { ValidationRule, DeployRulePayload } from '../types/salesforce.js';

const router = Router();

const extractHeaders = (req: Request): { token: string; instanceUrl: string } | null => {
  const token = req.headers.authorization?.split(' ')[1];
  const instanceUrl = req.headers['x-instance-url'] as string;
  if (!token || !instanceUrl) return null;
  return { token, instanceUrl };
};

// Route 1: Fetch all validation rules
router.get('/', async (req: Request, res: Response) => {
  const headers = extractHeaders(req);
  if (!headers) {
    res.status(401).json({ error: 'Missing token or instance URL' });
    return;
  }

  const { token, instanceUrl } = headers;

  try {
    const query = `
      SELECT Id, ValidationName, Active, Description,
             EntityDefinition.QualifiedApiName
      FROM ValidationRule
      WHERE EntityDefinition.QualifiedApiName = 'Account'
    `;

    const response = await axios.get<{ records: ValidationRule[] }>(
      `${instanceUrl}/services/data/v59.0/tooling/query`,
      {
        params: { q: query },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    res.json(response.data.records);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Fetch Rules Error:', error.response?.data);
      res.status(500).json({ error: error.response?.data || 'Failed to fetch rules' });
      return;
    }
    res.status(500).json({ error: 'Unknown error fetching rules' });
  }
});

// Route 2: Deploy (toggle) validation rules
router.post('/deploy', async (req: Request, res: Response) => {
  const headers = extractHeaders(req);
  if (!headers) {
    res.status(401).json({ error: 'Missing token or instance URL' });
    return;
  }

  const { token, instanceUrl } = headers;
  const { rules } = req.body as { rules: DeployRulePayload[] };

  if (!rules || !Array.isArray(rules)) {
    res.status(400).json({ error: 'Rules array is required' });
    return;
  }

  try {
    // Step 1: Fetch full metadata for each rule
    const fullMetadataPromises = rules.map(rule =>
      axios.get(
        `${instanceUrl}/services/data/v59.0/tooling/sobjects/ValidationRule/${rule.Id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
    );

    const fullMetadataResponses = await Promise.all(fullMetadataPromises);

    // Step 2: Patch each rule with full metadata + updated active state
    const updatePromises = fullMetadataResponses.map((response, index) => {
      const existingMetadata = response.data.Metadata;

      return axios.patch(
        `${instanceUrl}/services/data/v59.0/tooling/sobjects/ValidationRule/${rules[index].Id}`,
        {
          Metadata: {
            ...existingMetadata,
            active: rules[index].Active
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    });

    await Promise.all(updatePromises);
    res.json({ success: true, message: 'Rules deployed successfully' });

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Deploy Error:', error.response?.data);
      res.status(500).json({ error: error.response?.data || 'Deploy failed' });
      return;
    }
    res.status(500).json({ error: 'Unknown error during deploy' });
  }
});

export default router;