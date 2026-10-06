#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
exec 9>/run/lock/nexou-api-deploy.lock
flock -w 1200 9
image="nexou-api:${NEXOU_DEPLOY_SHA:-local}"
candidate="nexou-api-candidate"
replacing=false
had_previous=false
rollback() {
    result=$?
    trap - EXIT
    docker rm -f "$candidate" >/dev/null 2>&1 || true
    if [ "$replacing" = true ]; then
        if docker container inspect nexou-api-previous >/dev/null 2>&1; then
            docker rm -f nexou-api >/dev/null 2>&1 || true
            docker rename nexou-api-previous nexou-api
            docker start nexou-api
            echo 'Se restauró el contenedor anterior.' >&2
        elif [ "$had_previous" = true ]; then
            docker start nexou-api
        else
            docker rm -f nexou-api >/dev/null 2>&1 || true
        fi
    fi
    exit "$result"
}
trap rollback EXIT
run_api() {
    local name="$1"
    shift
    docker run -d --name "$name" --restart unless-stopped \
        --network nexou-private --memory 512m --cpus 1 \
        "$@" --env-file /etc/nexou/api.env \
        -v /var/lib/nexou/uploads:/uploads --read-only \
        --tmpfs /tmp:rw,noexec,nosuid,size=64m --cap-drop ALL \
        --security-opt no-new-privileges \
        --health-cmd='node -e "fetch(\"http://127.0.0.1:3000/ready\").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"' \
        --health-interval=30s --health-timeout=8s --health-retries=3 \
        "$image"
}
ready() {
    for attempt in {1..30}; do
        if docker exec "$1" node -e 'fetch("http://127.0.0.1:3000/ready").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))' >/dev/null 2>&1; then
            return 0
        fi
        sleep 2
    done
    docker logs --tail 30 "$1" >&2
    return 1
}
# La API anterior sigue atendiendo durante compilación y pruebas.
docker build -t "$image" -f deploy/Dockerfile .
docker rm -f "$candidate" >/dev/null 2>&1 || true
run_api "$candidate"
ready "$candidate"
docker rm -f "$candidate" >/dev/null
if docker container inspect nexou-api >/dev/null 2>&1; then
    had_previous=true
    docker rm -f nexou-api-previous >/dev/null 2>&1 || true
    replacing=true
    docker stop -t 35 nexou-api >/dev/null
    docker rename nexou-api nexou-api-previous
fi
replacing=true
run_api nexou-api -p 127.0.0.1:3000:3000
ready nexou-api
curl --fail --silent --show-error --resolve nexou-api.avorainc.com:443:127.0.0.1 \
    https://nexou-api.avorainc.com/health
replacing=false
# SQL y fotos permanecen en sus volúmenes. No ejecutar migraciones automáticamente.
echo "Desplegado: $image"
