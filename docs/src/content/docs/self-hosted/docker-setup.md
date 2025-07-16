---
title: canned-response
description: Manage canned responses for quick replies
---

# Self-Hosting DeepQuasar Bot with Docker Compose

The **recommended** and supported way to host DeepQuasar Bot is via Docker Compose. This guide will walk you through setting up Docker and running the bot on the most common Linux distributions.

---

## 1. Prerequisites

- A modern Linux server (Ubuntu, Debian, CentOS, Fedora, Arch, etc.)
- Root or sudo access

---

## 2. Install Docker & Docker Compose

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### CentOS / Fedora

```bash
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
```

### Arch Linux

```bash
sudo pacman -Syu docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

### Verify Installation

```bash
docker --version
docker compose version
```

---

## 3. Download the Required Files

- [docker-compose.yml](https://raw.githubusercontent.com/karutoil/deepquasar/main/docker-compose.yml)
- [.env.example](https://raw.githubusercontent.com/karutoil/deepquasar/main/.env.example)
- [lavalink/application.yml](https://raw.githubusercontent.com/karutoil/deepquasar/main/lavalink/application.yml)

You can download these files using `curl` or `wget`:

```bash
curl -O https://raw.githubusercontent.com/karutoil/deepquasar/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/karutoil/deepquasar/main/.env.example
mkdir -p data
curl -o lavalink/application.yml https://raw.githubusercontent.com/karutoil/deepquasar/main/lavalink/application.yml
```

---

## 4. Configure Your Environment

1. Copy `.env.example` to `.env` and fill in your secrets and configuration:

```bash
cp .env.example .env
nano .env
```

2. Edit `data/application.yml` as needed for Lavalink and audio settings.

---

## 5. Start the Bot

Run the following command in the directory containing your `docker-compose.yml`:

```bash
docker compose up -d
```

This will start all required services: MongoDB, Lavalink, the bot, and optional management/backup containers.

---

## 6. Monitor & Manage

- View logs: `docker compose logs -f`
- Stop services: `docker compose down`
- Restart: `docker compose restart`

---

## 7. Updating

To update, pull the latest images and restart:

```bash
docker compose pull
docker compose up -d
```

---

## Troubleshooting

- Ensure your `.env` and `application.yml` are correctly configured.
- Check container logs for errors.
- Make sure your server meets minimum requirements (RAM, CPU, disk space).

---

## Useful Links

- [DeepQuasarV2 GitHub](https://github.com/karutoil/deepquasarv2)
- [Docker Documentation](https://docs.docker.com/get-docker/)
- [Lavalink Documentation](https://github.com/lavalink-devs/Lavalink)

---
