#!/bin/bash

### ==============================================================================
### Script Name: docker-setup.sh
### Description: Automates Docker Engine installation on AWS Debian/Ubuntu EC2 instances.
### ==============================================================================

### Exit immediately if a command exits with a non-zero status
set -euo pipefail

### Resolve the Apt suite Docker publishes packages for. Ubuntu derivatives such as
### Linux Mint report their own codename, so UBUNTU_CODENAME is preferred when present.
. /etc/os-release
case "${ID}" in
  debian) DOCKER_DISTRO="debian" ;;
  ubuntu) DOCKER_DISTRO="ubuntu" ;;
  *)
    case "${ID_LIKE:-}" in
      *ubuntu*) DOCKER_DISTRO="ubuntu" ;;
      *debian*) DOCKER_DISTRO="debian" ;;
      *)
        echo "Unsupported distribution '${ID}'. This script handles Debian and Ubuntu only." >&2
        exit 1
        ;;
    esac
    ;;
esac
DOCKER_CODENAME="${UBUNTU_CODENAME:-${VERSION_CODENAME:-}}"
if [ -z "${DOCKER_CODENAME}" ]; then
  echo "Could not determine the release codename from /etc/os-release." >&2
  exit 1
fi

echo "========================================="
echo " Starting Docker Installation             "
echo " Target: ${DOCKER_DISTRO} ${DOCKER_CODENAME}"
echo "========================================="

### 1. Update system package index and install required prerequisites
echo "--> Updating package list and installing dependencies..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg

### 2. Set up Docker's official GPG keyring directory and download the key
echo "--> Adding Docker's official GPG key..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL "https://download.docker.com/linux/${DOCKER_DISTRO}/gpg" | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

### 3. Add the Docker stable repository to Apt sources
echo "--> Setting up the Docker repository..."
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${DOCKER_DISTRO} ${DOCKER_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

### Prefer Docker Inc. packages over Debian/Ubuntu's docker-cli / docker-compose / docker-buildx.
sudo tee /etc/apt/preferences.d/docker-ce >/dev/null <<'EOF'
Package: docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras
Pin: origin download.docker.com
Pin-Priority: 990

Package: docker-cli docker-compose docker-buildx docker.io docker-doc docker-compose-v2
Pin: release *
Pin-Priority: -1
EOF

### 4. Refresh package list and install Docker Engine from Docker Inc.
echo "--> Installing Docker Engine and Docker Compose plugin..."
sudo apt-get update -y
sudo apt-get remove -y docker-cli docker-compose docker-buildx docker.io containerd runc 2>/dev/null || true
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

### 5. Enable and start the Docker service to run on boot
echo "--> Starting and enabling Docker systemd service..."
sudo systemctl start docker
sudo systemctl enable docker

### 6. Add the invoking user (not root when run via sudo) to the docker group
DOCKER_USER="${SUDO_USER:-$USER}"
echo "--> Adding user '${DOCKER_USER}' to the docker group..."
sudo usermod -aG docker "${DOCKER_USER}"

echo "========================================="
echo " Docker installation completed successfully! "
echo "========================================="
echo "IMPORTANT: Please log out of your SSH session and log back in"
echo "to run Docker commands without using 'sudo'."
echo "========================================="
