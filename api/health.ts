interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
  setHeader?: (name: string, value: string) => void;
}

export function handleHealthRequest(req: ApiRequest, res: ApiResponse): void {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  res.setHeader?.('Cache-Control', 'no-store');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}

// Default Vercel Serverless Function export
export default function handler(req: ApiRequest, res: ApiResponse): void {
  handleHealthRequest(req, res);
}
