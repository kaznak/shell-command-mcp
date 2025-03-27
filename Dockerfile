FROM ubuntu:22.04

# Set non-interactive mode for apt
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=22.14.0

# Install basic utilities and dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    gnupg \
    lsb-release \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    unzip \
    zip \
    vim \
    nano \
    jq \
    netcat \
    iputils-ping \
    dnsutils \
    net-tools \
    sudo \
    python3 \
    python3-pip \
    ssh \
    openssl \
    build-essential \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Kubernetes tools
# kubectl
RUN curl -fsSL https://dl.k8s.io/release/v1.28.4/bin/linux/amd64/kubectl -o /usr/local/bin/kubectl \
    && chmod +x /usr/local/bin/kubectl

# helm
RUN curl -fsSL https://get.helm.sh/helm-v3.13.1-linux-amd64.tar.gz -o helm.tar.gz \
    && tar -zxvf helm.tar.gz \
    && mv linux-amd64/helm /usr/local/bin/helm \
    && rm -rf linux-amd64 helm.tar.gz

# kustomize
RUN curl -fsSL https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2Fv5.1.1/kustomize_v5.1.1_linux_amd64.tar.gz -o kustomize.tar.gz \
    && tar -zxvf kustomize.tar.gz \
    && mv kustomize /usr/local/bin/ \
    && rm kustomize.tar.gz

# Install additional tools like k9s, kubectx, etc.
RUN curl -fsSL https://github.com/derailed/k9s/releases/download/v0.27.4/k9s_Linux_amd64.tar.gz -o k9s.tar.gz \
    && tar -zxvf k9s.tar.gz \
    && mv k9s /usr/local/bin/ \
    && rm k9s.tar.gz LICENSE README.md 2>/dev/null || true

# Node.jsのバイナリをダウンロードしてインストール
RUN ARCH=$(uname -m | sed 's/aarch64/arm64/' | sed 's/x86_64/x64/') && \
    curl -fsSLO --compressed "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${ARCH}.tar.xz" && \
    tar -xJf "node-v${NODE_VERSION}-linux-${ARCH}.tar.xz" -C /usr/local --strip-components=1 --no-same-owner && \
    rm "node-v${NODE_VERSION}-linux-${ARCH}.tar.xz" && \
    npm install -g npm@11.2.0 && \
    ln -s /usr/local/bin/node /usr/local/bin/nodejs

WORKDIR /mcpserver
COPY --chown=mcp:mcp . .
RUN npm install && npm run build

# Create a non-root user to run the MCP server
RUN useradd -m -s /bin/bash mcp

USER mcp
WORKDIR /home/mcp

# Command to run the MCP server
CMD ["node", "/mcpserver/build/index.js"]
