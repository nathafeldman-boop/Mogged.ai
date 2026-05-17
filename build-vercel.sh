#!/bin/bash
pnpm install --ignore-scripts
pnpm --filter @workspace/mogged run build
mkdir -p public
cp -r artifacts/mogged/dist/public/* public/
