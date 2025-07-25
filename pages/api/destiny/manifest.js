import { getManifest, getManifestComponent } from '../../../lib/bungie-api';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { component } = req.query;
    
    if (component) {
      const data = await getManifestComponent(component);
      res.status(200).json({ success: true, data });
    } else {
      const manifest = await getManifest();
      res.status(200).json({ success: true, data: manifest });
    }
  } catch (error) {
    console.error('Manifest API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch manifest data',
      details: error.message 
    });
  }
}
