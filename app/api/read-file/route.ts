import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json({ error: 'Path parameter required' }, { status: 400 })
    }

    // Security check - only allow reading from the workspace content directory
    const workspaceContent = '/Users/georgeopenclaw/.openclaw/workspace/content'
    const resolvedPath = path.resolve(filePath)
    
    if (!resolvedPath.startsWith(path.resolve(workspaceContent))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
      const content = readFileSync(filePath, 'utf-8')
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    } catch (fileError) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error reading file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}