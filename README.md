# Ibuki frontend

Мобильный React-интерфейс QR-чек-ина для додзё. Backend вынесен в отдельный
репозиторий [`Olivie1/ibuki-back`](https://github.com/Olivie1/ibuki-back).

## Публичная схема

```text
Телефон спортсмена
  → https://olivie1.github.io (GitHub Pages, React/Vite)
  → VITE_API_URL             (HTTPS-запросы)
  → ibuki-back               (FastAPI на Render или другом runtime)
  → SQLite на постоянном диске
```

GitHub Pages раздаёт frontend, но не исполняет Python. Поэтому backend должен
быть развёрнут отдельно. Инструкции и `render.yaml` находятся в `ibuki-back`.

## Публикация на GitHub Pages

Workflow `.github/workflows/pages.yml` автоматически собирает и публикует
frontend при push в `main`.

Перед публикацией backend:

1. Разверните репозиторий `ibuki-back` по его README.
2. Откройте **Settings → Secrets and variables → Actions → Variables**.
3. Создайте переменную `VITE_API_URL`, например:

   ```text
   https://ibuki-back.onrender.com
   ```

4. В **Settings → Pages → Build and deployment** выберите источник
   **GitHub Actions**.
5. Запустите workflow `Deploy frontend to GitHub Pages` или сделайте push.

URL обязан использовать HTTPS, иначе браузер заблокирует API-запросы со
страницы GitHub Pages как mixed content. После смены `VITE_API_URL` frontend
нужно пересобрать: Vite встраивает адрес во время build.

## Локальная разработка

Backend:

```bash
cd ../ibuki-back
cp .env.example .env
docker compose up --build -d
```

Frontend:

```bash
cp .env.example .env
npm ci
npm run dev
```

Откройте `http://localhost:5173`. По умолчанию запросы идут на
`http://localhost:8000`.

## Локальный Docker frontend

```bash
cp .env.example .env
docker compose up --build -d
```

Frontend будет доступен на `http://localhost:8080`. В production bundle будет
встроен `VITE_API_URL` из `.env`. Backend запускается отдельно из `ibuki-back`.

## Проверки

```bash
npm ci
npm run build
npm run lint
```

## Сценарий использования

1. Тренер открывает приложение и входит по `TRAINER_SECRET`, настроенному на
   backend.
2. Создаёт тренировочную сессию.
3. Показывает созданный QR спортсменам.
4. Спортсмен сканирует QR, вводит код и отправляет pre-check-in.
5. После тренировки спортсмен отправляет RPE.
6. Тренер видит заполнение и закрывает сессию.

Backend должен иметь `FRONTEND_URL=https://olivie1.github.io` и разрешать этот
origin в `CORS_ORIGINS`. Эти значения уже указаны в `ibuki-back/render.yaml`.

## Структура

```text
src/
├── api/       # HTTP-клиент и VITE_API_URL
├── data/      # локальные справочные данные
├── pages/     # экраны тренера и спортсмена
├── types/     # TypeScript-типы
├── App.tsx
└── index.css
```

Каталог `frontend/` — сохранённый legacy Next.js-прототип. Текущая сборка
использует корневой `src/` и Vite.

## Диагностика

- `Failed to fetch`: проверьте `VITE_API_URL`, HTTPS, CORS и `/health` backend.
- API вызывает `olivie1.github.io`: переменная не была задана при build;
  задайте GitHub Actions variable и перезапустите workflow.
- QR ведёт на localhost: исправьте `FRONTEND_URL` backend и создайте новую
  сессию — URL записывается в QR в момент создания.
- После перезапуска исчезли данные: backend работает без постоянного диска или
  `DB_PATH` направлен не в его mount path.
