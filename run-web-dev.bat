@echo off
pushd %~dp0
cd apps\web
npm run dev -- --host --port 5174
popd
