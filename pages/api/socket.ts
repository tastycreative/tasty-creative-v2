import { NextApiRequest } from 'next'
import { NextApiResponseServerIO } from '@/lib/socket'
import { initializeSocketIO, setSocketIOServer } from '@/lib/socket'

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...')
    
    // Initialize Socket.IO
    const io = initializeSocketIO(res.socket.server)
    res.socket.server.io = io
    
    // Ensure global instance is set
    setSocketIOServer(io)
    
    console.log('Socket.IO server is ready')
  } else {
    console.log('Socket.IO server already running')
    // Ensure global instance is set even if server already exists
    setSocketIOServer(res.socket.server.io)
  }
  
  res.end()
}

export const config = {
  api: {
    bodyParser: false,
  },
}
