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
2. Подтверждённый адрес backend задан в `.env.production` и в `env` job
   `.github/workflows/pages.yml`:

   ```text
   https://ibuki-back-docker.onrender.com
   ```

3. В **Settings → Pages → Build and deployment** выберите источник
   **GitHub Actions**.
4. Запустите workflow `Deploy frontend to GitHub Pages` или сделайте push.

URL обязан использовать HTTPS, иначе браузер заблокирует API-запросы со
страницы GitHub Pages как mixed content. После смены `VITE_API_URL` frontend
нужно пересобрать: Vite встраивает адрес во время build. При переносе backend
обновите оба файла. Workflow задаёт адрес явно и не зависит от Actions variable.

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
`/api` через Vite proxy на `http://localhost:8000`.

## Локальный Docker frontend

```bash
cp .env.example .env
docker compose up --build -d
```

Frontend будет доступен на `http://localhost:8080`. По умолчанию nginx
проксирует `/api` на backend хоста (`host.docker.internal:8000`). Backend
запускается отдельно из `ibuki-back`. `BACKEND_URL` задаёт адрес upstream nginx;
`VITE_API_URL=/` оставляет запросы на адресе frontend. Для отдельного публичного
backend задайте `VITE_API_URL=https://<backend-host>` без `/api` и пересоберите.

Для общего запуска из родительского каталога с обоими репозиториями:

```bash
docker compose -f docker-compose.local.yml up --build -d
```

Этот вариант использует `BACKEND_URL=http://backend:8000` в общей Docker-сети.
Если порт 8000 уже занят, используйте `BACKEND_PORT=18000` перед командой.
GitHub Pages не поддерживает nginx proxy: workflow требует публичный HTTPS
адрес backend в job environment `VITE_API_URL` и проверяет его перед сборкой.

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
  проверьте job environment в workflow и перезапустите публикацию.
- QR ведёт на localhost: исправьте `FRONTEND_URL` backend и создайте новую
  сессию — URL записывается в QR в момент создания.
- После перезапуска исчезли данные: backend работает без постоянного диска или
  `DB_PATH` направлен не в его mount path.

## Восстановление запросов и сессий

Тренерский экран восстанавливает сессию по `?session_id=...` и показывает список
последних тренировок. Закрытая сессия открывает сохранённую сводку.

Перед созданием сессии браузер сохраняет `request_id` и неизменяемый черновик.
При потере ответа или перезагрузке можно нажать «Восстановить создание»:
сервер возвращает ту же сессию. Повтор закрытия возвращает тот же итог.

Перед первой регистрацией участника браузер сохраняет случайный
`registration_secret`. Повтор после потери ответа восстанавливает токен только
при наличии исходного секрета или уже выданного device token. Очистка данных
браузера удаляет эти подтверждения; один код участника не восстанавливает
существующий токен другого устройства.

Проверка клиентского восстановления без новых зависимостей:

```bash
npm test
```
## Исправления P2

Список участников и подсказка ротации используют публичные `participant_id`,
а секретные коды новых участников вводятся в скрытое поле. При смене серверного
JWT_SECRET публичные обозначения обновляются. Требуется согласованный выпуск
backend с этим контрактом; API списка ответов больше не возвращает секретный код.

Расширенная форма загружает сохранённые ответы и отправляет только изменённые
поля. Очистка поля передаёт null; неизменённое поле не отправляется. При сетевом
сбое проверки доступа доступны повтор и продолжение базового сценария без
сохранения расширенных данных. Сон в новых ответах — качество по шкале 1–5,
с маркером формата на сервере; старые ответы не переинтерпретируются.
