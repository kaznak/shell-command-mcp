FROM ubuntu:22.04

# Set non-interactive mode for apt
ENV DEBIAN_FRONTEND=noninteractive

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

# Install Node.js 20.x - 修正版: 競合を避けるために既存のnode関連パッケージを削除してからインストール
RUN apt-get update \
    && apt-get purge -y nodejs npm libnode-dev \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs \
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

# Create a non-root user to run the MCP server
RUN useradd -m -s /bin/bash mcp \
    && echo "mcp ALL=(mcp) NOPASSWD:ALL" > /etc/sudoers.d/mcp

# Set up working directory
WORKDIR /home/mcp/app

# Copy package files and install dependencies
COPY package*.json ./
# npm ciの代わりにnpm installを使用
RUN npm install

# Copy application source
COPY --chown=mcp:mcp . .

# Build TypeScript
RUN npm run build

# Switch to non-root user
USER mcp

# Command to run the MCP server
CMD ["npm", "start"]
