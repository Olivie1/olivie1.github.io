FROM node:18-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci

# Копируем все остальные файлы
COPY . .

# Type-check and build the production bundle.
RUN npm run build

# Используем nginx для раздачи статики
FROM nginx:alpine

# Копируем собранные файлы из первой стадии
COPY --from=builder /app/dist /usr/share/nginx/html

ENV BACKEND_URL=http://host.docker.internal:8000
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
