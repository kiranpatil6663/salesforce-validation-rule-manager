import { Router, Request, Response } from 'express';
import axios from 'axios';
import type { TokenResponse } from '../types/salesforce.js';

const router = Router();

// Route 1: Build and return Salesforce OAuth URL
router.get('/login', (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SF_CONSUMER_KEY!,
    redirect_uri: process.env.SF_CALLBACK_URL!,
    scope: 'api refresh_token full'
  });

  const authUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/authorize?${params}`;
  res.json({ url: authUrl });
});

// Route 2: Handle Salesforce OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'No authorization code received' });
    return;
  }

  try {
    const tokenResponse = await axios.post<TokenResponse>(
      `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.SF_CONSUMER_KEY!,
        client_secret: process.env.SF_CONSUMER_SECRET!,
        redirect_uri: process.env.SF_CALLBACK_URL!,
        code
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, instance_url } = tokenResponse.data;

    // Redirect to React frontend with token
    res.redirect(
      `http://localhost:5173/dashboard?token=${access_token}&instance=${encodeURIComponent(instance_url)}`
    );

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('OAuth Error:', error.response?.data);
      res.status(500).json({ error: error.response?.data || 'OAuth failed' });
      return;
    }
    res.status(500).json({ error: 'Unknown error during OAuth' });
  }
});

export default router;