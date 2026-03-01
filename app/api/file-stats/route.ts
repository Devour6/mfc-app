import { NextRequest, NextResponse } from 'next/server'
import { statSync } from 'fs'
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
      const stats = statSync(filePath)
      return NextResponse.json({
        size: stats.size,
        mtime: stats.mtime.toISOString(),
        ctime: stats.ctime.toISOString(),
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      })
    } catch (fileError) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error getting file stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}