import { getManifest, updateManifest } from '../../../lib/manifest-manager'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const manifest = await getManifest()
      if (!manifest) {
        return res.status(404).json({ error: 'Manifest not found' })
      }
      res.status(200).json(manifest)
    } catch (error) {
      console.error('Error fetching manifest:', error)
      res.status(500).json({ error: 'Failed to fetch manifest' })
    }
  } else if (req.method === 'POST') {
    // Manual manifest update (admin only)
    try {
      const { adminPassword } = req.body
      
      if (adminPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const updatedManifest = await updateManifest()
      res.status(200).json({ 
        success: true, 
        message: 'Manifest updated successfully',
        manifest: updatedManifest
      })
    } catch (error) {
      console.error('Error updating manifest:', error)
      res.status(500).json({ error: 'Failed to update manifest' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}