import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'metrics.json')
    
    if (!fs.existsSync(filePath)) {
      return Response.json({ error: 'No metrics data available' }, { status: 404 })
    }
    
    const data = fs.readFileSync(filePath, 'utf8')
    const metrics = JSON.parse(data)
    
    return Response.json(metrics)
  } catch (error) {
    return Response.json({ error: 'Failed to load metrics data' }, { status: 500 })
  }
}
