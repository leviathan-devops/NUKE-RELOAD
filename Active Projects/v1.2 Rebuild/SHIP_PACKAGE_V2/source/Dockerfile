# Kraken V1.2 TUI Testing Container
# Uses matching opencode version for proper hook testing

FROM node:20-bullseye

ENV DEBIAN_FRONTEND=noninteractive
ENV npm_config_noninteractive=true
ENV KRAKEN_IDENTITY_DIR=/root/.config/opencode/plugins/kraken-agent/identity

WORKDIR /opt/opencode

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Install opencode-ai matching local version
RUN npm install -g opencode-ai@1.4.6

# Verify
RUN opencode --version

# Create required directories
RUN mkdir -p /root/.config/opencode /root/.shark/evidence /workspace /tmp/kraken-compaction

ENTRYPOINT ["opencode"]