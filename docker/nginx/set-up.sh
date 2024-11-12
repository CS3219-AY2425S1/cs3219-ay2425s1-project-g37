#!/bin/sh

if [ "$VITE_SELF_HOST" = "true" ]; then
  echo "Using prod nginx configuration"
  cp /etc/nginx/nginx.prod.conf /etc/nginx/nginx.conf
else
  echo "Using local nginx configuration"
  cp /etc/nginx/nginx.local.conf /etc/nginx/nginx.conf
fi
