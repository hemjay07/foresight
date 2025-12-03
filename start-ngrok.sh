#!/bin/bash

# Foresight ngrok Quick Share Script
# This script exposes your local Foresight site to the internet

echo "🚀 Foresight Quick Share Setup"
echo "================================"
echo ""

# Check if ngrok is authenticated
if ! ngrok config check > /dev/null 2>&1; then
    echo "⚠️  ngrok not authenticated yet!"
    echo ""
    echo "Please run: ngrok config add-authtoken YOUR_TOKEN"
    echo "Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo ""
    exit 1
fi

echo "✅ ngrok authenticated"
echo ""

# Start backend ngrok in background
echo "📡 Starting backend tunnel (port 3001)..."
ngrok http 3001 --log=stdout > /tmp/ngrok-backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Get backend URL
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

if [ -z "$BACKEND_URL" ] || [ "$BACKEND_URL" = "null" ]; then
    echo "❌ Failed to get backend URL. Make sure backend is running on port 3001"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend URL: $BACKEND_URL"
echo ""

# Update frontend .env
echo "📝 Updating frontend configuration..."
cd frontend
echo "VITE_API_URL=$BACKEND_URL" > .env.local
echo "✅ Frontend configured to use: $BACKEND_URL"
echo ""

# Restart frontend to pick up new env
echo "🔄 Restarting frontend..."
# Kill existing frontend
lsof -ti:5173 | xargs kill -9 2>/dev/null
# Start frontend
pnpm dev > /dev/null 2>&1 &
FRONTEND_PID=$!
sleep 5

# Start frontend ngrok
echo "📡 Starting frontend tunnel (port 5173)..."
ngrok http 5173 --log=stdout > /tmp/ngrok-frontend.log 2>&1 &
FRONTEND_NGROK_PID=$!
sleep 3

# Get frontend URL
FRONTEND_URL=$(curl -s http://localhost:4041/api/tunnels | jq -r '.tunnels[0].public_url')

if [ -z "$FRONTEND_URL" ] || [ "$FRONTEND_URL" = "null" ]; then
    echo "❌ Failed to get frontend URL"
    kill $BACKEND_PID $FRONTEND_PID $FRONTEND_NGROK_PID 2>/dev/null
    exit 1
fi

echo ""
echo "================================"
echo "✅ Foresight is now live!"
echo "================================"
echo ""
echo "🌐 Share this URL with your friends:"
echo ""
echo "   $FRONTEND_URL"
echo ""
echo "================================"
echo ""
echo "💡 Tips:"
echo "   • Keep this terminal open"
echo "   • Your computer must stay on"
echo "   • URLs change each time you restart"
echo ""
echo "📊 Monitor ngrok traffic:"
echo "   Backend:  http://localhost:4040"
echo "   Frontend: http://localhost:4041"
echo ""
echo "🛑 To stop: Press Ctrl+C or run: killall ngrok"
echo ""

# Keep script running
wait
