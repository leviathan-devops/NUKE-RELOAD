# Kraken V1.2 Multi-Brain Container Testing
# Based on opencode image with all plugins bundled

FROM ghcr.io/anomalyco/opencode:latest

# Environment variables
ENV KRAKEN_CONTAINER=true
ENV KRAKEN_PLUGIN_DIR=/root/.config/opencode/plugins/kraken-agent
ENV KRAKEN_IDENTITY_DIR=/root/.config/opencode/plugins/kraken-agent/identity
ENV KRAKEN_ALLOWED_PATHS=/root,/app,/workspace
ENV OPENCODE_WORKSPACE=/workspace

# Create required directories
RUN mkdir -p /root/.config/opencode/plugins

# Copy Kraken V1.2 plugin
COPY dist /root/.config/opencode/plugins/kraken-agent/dist

# Copy identity files (file-based agent identity)
COPY identity /root/.config/opencode/plugins/kraken-agent/identity

# Copy subagent-manager
COPY subagent-manager /root/.config/opencode/plugins/kraken-agent/subagent-manager

# Copy wrappers
COPY wrappers /root/.config/opencode/plugins/kraken-agent/wrappers

# Copy embedded shark/manta
COPY shark-agent /root/.config/opencode/plugins/kraken-agent/shark-agent
COPY manta-agent /root/.config/opencode/plugins/kraken-agent/manta-agent

# Copy required supporting plugins
COPY container-plugins/coding-subagents /root/.config/opencode/plugins/coding-subagents
COPY container-plugins/opencode-subagent-manager /root/.config/opencode/plugins/opencode-subagent-manager
COPY container-plugins/opencode-plugin-engineering /root/.config/opencode/plugins/opencode-plugin-engineering
COPY container-plugins/shark-agent-v4.7-hotfix-v3 /root/.config/opencode/plugins/shark-agent-v4.7-hotfix-v3
COPY container-plugins/manta-agent-v1.5 /root/.config/opencode/plugins/manta-agent-v1.5

# Create opencode config with all plugins
RUN echo '{"plugin":["file:///root/.config/opencode/plugins/coding-subagents/dist/index.js","file:///root/.config/opencode/plugins/opencode-subagent-manager/dist/index.js","file:///root/.config/opencode/plugins/opencode-plugin-engineering/dist/index.js","file:///root/.config/opencode/plugins/kraken-agent/dist/index.js","file:///root/.config/opencode/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js","file:///root/.config/opencode/plugins/manta-agent-v1.5/dist/index.js"]}' > /root/.config/opencode/opencode.json

# Create workspace directories
RUN mkdir -p /workspace /tmp/kraken-compaction

# Create evidence directories
RUN mkdir -p /root/.shark/evidence

# Default command - run opencode TUI
CMD ["opencode"]