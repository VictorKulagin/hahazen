#!/usr/bin/env bash
set -e

VERSION="${1:?Укажите версию, например: 16.3.4}"
APP_DIR="/opt/hahazen"
CONTAINER="hahazen-frontend"
IMAGE="hahazen-frontend"

cd "$APP_DIR"

echo "Создание резервного образа..."
if docker inspect "$CONTAINER" >/dev/null 2>&1; then
    CURRENT_IMAGE=$(docker inspect --format='{{.Image}}' "$CONTAINER")
    docker tag "$CURRENT_IMAGE" "$IMAGE:backup"
fi

echo "Сборка Next.js $VERSION..."
docker build -t "$IMAGE:$VERSION" .

echo "Замена контейнера..."
docker rm -f "$CONTAINER" 2>/dev/null || true

docker run -d \
    --name "$CONTAINER" \
    --restart unless-stopped \
    -p 3000:3000 \
    "$IMAGE:$VERSION"

echo "Проверка запуска..."
sleep 3
docker logs --tail=30 "$CONTAINER"
curl -f http://localhost:3000 >/dev/null

echo "Обновление до версии $VERSION завершено успешно."
