import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'all_predictions.json')
    
    if (!fs.existsSync(filePath)) {
      return Response.json({ error: 'No prediction data. Run Python script first.' }, { status: 404 })
    }
    
    const data = fs.readFileSync(filePath, 'utf8')
    const report = JSON.parse(data)
    
    return Response.json(report)
  } catch (error) {
    return Response.json({ error: 'Failed to load prediction data' }, { status: 500 })
  }
}
