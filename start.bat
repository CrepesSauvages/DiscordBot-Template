@echo off
start cmd /k "node index.js"
cd dashboard-next
start cmd /k "npm run dev"