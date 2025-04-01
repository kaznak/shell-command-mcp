FROM ubuntu:22.04

# Set non-interactive mode for apt
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=22.14.0

# Install basic utilities and dependencies
RUN apt-get update && apt-get install -y \
    tzdata \
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
# kubectl (latest stable version)
RUN curl -fsSL https://dl.k8s.io/release/stable.txt \
    | xargs -I {} curl -fsSL https://dl.k8s.io/release/{}/bin/linux/amd64/kubectl -o /usr/local/bin/kubectl \
    && chmod +x /usr/local/bin/kubectl

# helm (latest stable version)
RUN mkdir -p /root/tmp && cd /root/tmp   \
    && curl -fsSL https://api.github.com/repos/helm/helm/releases/latest    \
    | jq -r '.tag_name' \
    | xargs -I {} curl -fsSL https://get.helm.sh/helm-{}-linux-amd64.tar.gz -o helm.tar.gz \
    && tar -zxvf helm.tar.gz \
    && mv linux-amd64/helm /usr/local/bin/helm \
    && cd .. && rm -rf /root/tmp    \
    && helm plugin install https://github.com/databus23/helm-diff  \
    && helm plugin install https://github.com/aslafy-z/helm-git \
    && helm plugin install https://github.com/hypnoglow/helm-s3.git \
    && helm plugin install https://github.com/jkroepke/helm-secrets

# kustomize (latest stable version)
RUN mkdir -p /root/tmp && cd /root/tmp   \
    && curl -fsSL https://api.github.com/repos/kubernetes-sigs/kustomize/releases/latest | jq -r '.tag_name' | sed 's/kustomize\///' | xargs -I {} curl -fsSL https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F{}/kustomize_{}_linux_amd64.tar.gz -o kustomize.tar.gz \
    && tar -zxvf kustomize.tar.gz \
    && mv kustomize /usr/local/bin/ \
    && cd .. && rm -rf /root/tmp

# Install additional tools like k9s (latest stable version)
RUN mkdir -p /root/tmp && cd /root/tmp   \
    && curl -fsSL https://api.github.com/repos/derailed/k9s/releases/latest \
    | jq -r '.tag_name' \
    | xargs -I {} curl -fsSL https://github.com/derailed/k9s/releases/download/{}/k9s_Linux_amd64.tar.gz -o k9s.tar.gz \
    && tar -zxvf k9s.tar.gz \
    && mv k9s /usr/local/bin/ \
    && rm k9s.tar.gz LICENSE README.md 2>/dev/null || true \
    && cd .. && rm -rf /root/tmp

# Install helmfile
RUN mkdir -p /root/tmp && cd /root/tmp   \
    && curl -fsSL https://github.com/helmfile/helmfile/releases/download/v0.171.0/helmfile_0.171.0_linux_amd64.tar.gz -o helmfile.tar.gz \
    && tar -zxvf helmfile.tar.gz \
    && mv helmfile /usr/local/bin/ \
    && cd .. && rm -rf /root/tmp

# Install sops
RUN curl -fsSL https://github.com/getsops/sops/releases/download/v3.9.4/sops-v3.9.4.linux.amd64 -o /usr/local/bin/sops \
    && chmod +x /usr/local/bin/sops

# Install age
RUN mkdir -p /root/tmp && cd /root/tmp   \
    && curl -fsSL https://github.com/FiloSottile/age/releases/download/v1.2.1/age-v1.2.1-linux-amd64.tar.gz -o age.tar.gz \
    && tar -zxvf age.tar.gz \
    && mv age/age /usr/local/bin/ \
    && mv age/age-keygen /usr/local/bin/ \
    && cd .. && rm -rf /root/tmp

# Node.jsのバイナリをダウンロードしてインストール
RUN mkdir -p /root/tmp && cd /root/tmp  \
    && ARCH=$(uname -m | sed 's/aarch64/arm64/' | sed 's/x86_64/x64/')  \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${ARCH}.tar.xz"   \
    && tar -xJf "node-v${NODE_VERSION}-linux-${ARCH}.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
    && rm "node-v${NODE_VERSION}-linux-${ARCH}.tar.xz"  \
    && npm install -g npm@11.2.0    \
    && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
    && cd .. && rm -rf /root/tmp

WORKDIR /mcpserver
COPY . .
RUN npm install && npm run build 

# Create a non-root user to run the MCP server
RUN useradd -m -s /bin/bash mcp
# Copy default home directory contents if the home directory is empty
RUN cp -rp /home/mcp /home/mcp-home-backup

WORKDIR /home/mcp
ENV WORKDIR=/home/mcp

# Command to run the MCP server
CMD ["/mcpserver/entrypoint.sh", "mcp", "node", "/mcpserver/build/index.js"]
