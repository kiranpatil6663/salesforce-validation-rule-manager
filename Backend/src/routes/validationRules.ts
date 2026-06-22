import { Router, Request, Response } from 'express';
import axios from 'axios';
import type { ValidationRule, DeployRulePayload } from '../types/salesforce.js';

const router = Router();

// Helper to extract headers
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
    const updatePromises = rules.map((rule) =>
      axios.patch(
        `${instanceUrl}/services/data/v59.0/tooling/sobjects/ValidationRule/${rule.Id}`,
        { Metadata: { active: rule.Active } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
    );

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