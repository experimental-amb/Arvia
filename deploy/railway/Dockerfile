FROM docker.n8n.io/n8nio/n8n:latest

# Railway injects PORT — n8n reads N8N_PORT.
# We add a tiny entrypoint shim so Railway's health check hits the right port.
USER root
RUN apk add --no-cache curl
USER node

# Expose default n8n port (mapped in railway.toml)
EXPOSE 5678

# n8n reads N8N_PORT from env; Railway sets PORT. Both are set in Railway vars.
CMD ["n8n", "start"]
