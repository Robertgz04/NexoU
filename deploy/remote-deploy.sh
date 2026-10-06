#!/bin/bash
set -euo pipefail
# Instalado en /usr/local/sbin/nexou-deploy. Único comando admitido por la clave SSH.
command_text="${SSH_ORIGINAL_COMMAND:-}"
if [[ ! "$command_text" =~ ^deploy\ ([a-f0-9]{40})$ ]]; then
    echo 'Solo se admite: deploy <SHA de master>' >&2
    exit 2
fi
commit="${BASH_REMATCH[1]}"
exec 8>/run/lock/nexou-repository.lock
flock -w 1200 8
repository=/opt/nexou/repository
if [ ! -d "$repository/.git" ]; then
    git clone --no-checkout --single-branch --branch master \
        https://github.com/Robertgz04/NexoU.git "$repository"
fi
git -C "$repository" fetch --prune origin +refs/heads/master:refs/remotes/origin/master
# Si llegaron commits posteriores durante la cola, publicar el más reciente.
latest=$(git -C "$repository" rev-parse refs/remotes/origin/master)
if [ "$commit" != "$latest" ]; then
    echo "Commit superado por $latest; no se despliega una versión anterior."
    exit 0
fi
git -C "$repository" checkout --force --detach "$commit"
NEXOU_DEPLOY_SHA="$commit" /bin/bash "$repository/deploy/start.sh"
printf '%s\n' "$commit" > /opt/nexou/deployed-sha
