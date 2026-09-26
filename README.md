# Recovery App — QR-чек-ин для додзё

Пилотное веб-приложение для опроса спортсменов до и после тренировки. Тренер
создаёт сессию и показывает QR-код группе. Спортсмен открывает ссылку с телефона,
вводит код, проходит pre-check-in, после тренировки указывает RPE. Тренер видит
заполнение в реальном времени и закрывает сессию с агрегированной сводкой.

Система поднимается через Docker Compose. Python, Node.js и SQLite на хосте для
обычного запуска не нужны.

## Возможности

- вход тренера по секретному коду;
- создание тренировки и QR-кода;
- регистрация спортсмена по коду, например `A001`;
- pre-check-in: сон, усталость, стресс и боль;
- post-check-in: RPE от 1 до 10;
- live-список ответов и функциональные флаги;
- защита от повторной отправки;
- итоговые проценты, средний RPE и групповая сводка;
- опциональные OpenAI-заметка и Telegram-уведомление;
- постоянная SQLite между пересборками;
- адаптивный мобильный интерфейс.

Важно: не закрывайте сессию, пока спортсмены не отправили post-check-in.
Закрытая сессия больше не принимает ответы.

## Стек

Frontend: React 18, TypeScript, Vite 5, React Router, Tailwind CSS и nginx.

Backend: Python 3.11, FastAPI, Uvicorn, SQLAlchemy 2, Pydantic 2, SQLite,
`qrcode`, Pillow и `python-jose`. OpenAI SDK и Telegram используются только при
наличии ключей.

Инфраструктура: Docker Compose, отдельная bridge-сеть, backend healthcheck и
именованный volume для SQLite.

## Архитектура

```text
Телефон или браузер
       │ http://HOST:8080
       ▼
frontend: nginx
  /             → React SPA
  /api/*        → http://backend:8000
  /health       → http://backend:8000/health
       │ Docker network
       ▼
backend: FastAPI/Uvicorn
       │ SQLAlchemy
       ▼
/data/recovery.db → Docker volume recovery_data
```

Браузер не использует Docker-имя `backend`. Он обращается на тот же host, с
которого загружен frontend, а nginx проксирует API во внутреннюю сеть. При
создании сессии nginx передаёт фактический Origin, и backend помещает его в QR.
Если тренер открыл `http://192.168.2.145:8080`, этот адрес попадёт в QR.

## Структура

```text
olivie1.github.io/
├── backend/                  # Рабочий FastAPI backend
│   ├── app/
│   │   ├── core/            # Конфигурация и SQLite
│   │   ├── models/          # SQLAlchemy-модели
│   │   ├── repositories/    # Доступ к данным
│   │   ├── routes/          # HTTP-маршруты
│   │   ├── schemas/         # Pydantic DTO
│   │   └── services/        # Сессии, check-in, LLM, Telegram
│   ├── tests/
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── src/                      # Рабочий React/Vite frontend
│   ├── api/
│   ├── data/
│   ├── pages/
│   ├── types/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── frontend/                 # Legacy Next.js-прототип, не собирается
├── Dockerfile                # Vite build + nginx
├── nginx.conf                # SPA fallback и API proxy
├── docker-compose.yml
├── .env.example
├── package.json
├── package-lock.json
├── pyrightconfig.json
└── README.md
```

Активный frontend — корневой `src/`. Каталог `frontend/` сохранён как старый
черновик и исключён из Docker context. Compose его не использует.

## Быстрый запуск через Docker

Требуются Docker Engine 24+ и Docker Compose v2:

```bash
docker --version
docker compose version
```

Перейдите в корень репозитория:

```bash
cd /home/paprojky/StartUp_project/olivie1.github.io
```

Если `.env` отсутствует:

```bash
cp .env.example .env
```

Запуск с выводом логов:

```bash
docker compose up --build
```

Запуск в фоне:

```bash
docker compose up --build -d
```

Адреса после запуска:

- приложение: `http://localhost:8080`;
- backend health: `http://localhost:18000/health`;
- Swagger: `http://localhost:18000/docs`;
- OpenAPI: `http://localhost:18000/openapi.json`.

Проверка и логи:

```bash
docker compose ps
docker compose logs -f backend frontend
```

Backend должен иметь статус `healthy`.

Остановка без удаления данных:

```bash
docker compose down
```

Повторная сборка после правок:

```bash
docker compose up --build -d
```

Сборка полностью без cache:

```bash
docker compose build --no-cache
docker compose up -d
```

## Запуск с телефона

Компьютер и телефоны должны находиться в одной Wi-Fi-сети.

Узнайте LAN IP компьютера:

```bash
hostname -I
```

Используйте адрес `192.168.x.x`, а не `127.0.0.1`, Docker-адрес `172.x.x.x`,
VPN-адрес или `localhost`. В текущей сети использовался:

```text
http://192.168.2.145:8080
```

Тренер открывает этот адрес на телефоне и создаёт сессию. Спортсмены направляют
камеры своих телефонов на QR на экране тренера. Если QR прислан картинкой на тот
же телефон, используйте Google Lens или распознавание QR в галерее.

Если приложение не открывается:

1. Проверьте общую Wi-Fi-сеть.
2. Отключите VPN.
3. Повторно проверьте LAN IP.
4. Разрешите порт:

   ```bash
   sudo ufw allow 8080/tcp
   ```

5. Убедитесь, что роутер не использует client/AP isolation.
6. Проверьте `curl http://LAN_IP:8080/health`.

Телефонам нужен только порт `8080`: nginx сам проксирует backend.

## Сценарий тренировки

### Тренер

1. Открывает приложение по LAN-адресу.
2. Входит с кодом из `TRAINER_SECRET`. Стандартный pilot-код:

   ```text
   default-trainer-secret-12345
   ```

3. Указывает ожидаемое число участников.
4. Создаёт сессию и показывает QR.
5. Наблюдает live-ответы, обновляемые каждые пять секунд.
6. После отправки post-check-in всеми участниками закрывает тренировку.

### Спортсмен

1. Сканирует QR.
2. Вводит произвольный непустой код, например `A001`.
3. Отвечает на четыре вопроса pre-check-in.
4. Оставляет страницу post-check-in открытой до конца тренировки.
5. Выбирает RPE и отправляет ответ.

Предварительного реестра кодов пока нет: первый ввод создаёт спортсмена.
Повторная регистрация этого кода в сессии возвращает существующий device token.

Сводка содержит число спортсменов, заполнение pre/post, высокую усталость,
высокий стресс, боль, средний RPE и опциональную AI-заметку.

## Переменные окружения

Канонический шаблон — `.env.example` в корне.

| Переменная | Значение | Назначение |
|---|---:|---|
| `FRONTEND_PORT` | `8080` | Внешний порт frontend |
| `BACKEND_PORT` | `18000` | Внешний диагностический порт backend |
| `PORT` | `8000` | Uvicorn внутри контейнера |
| `ENV` | `production` | Режим backend |
| `DB_PATH` | `/data/recovery.db` | SQLite внутри контейнера |
| `FRONTEND_URL` | `http://localhost:8080` | Fallback URL для QR |
| `CORS_ORIGINS` | `*` | Допустимые origins |
| `JWT_SECRET` | заменить | Ключ подписи JWT |
| `TRAINER_SECRET` | pilot-код | Код тренера |
| `OPENAI_API_KEY` | пусто | Опциональный OpenAI key |
| `LLM_TIMEOUT_SECONDS` | `7` | Таймаут LLM |
| `TELEGRAM_BOT_TOKEN` | пусто | Telegram bot token |
| `TELEGRAM_CHAT_ID` | пусто | Получатель Telegram |
| `LOG_LEVEL` | `info` | Уровень логов |

После изменения `.env`:

```bash
docker compose up -d --force-recreate
```

`.env` исключён из Git. Перед публичным размещением замените `JWT_SECRET` и
`TRAINER_SECRET`.

## API

Успешный envelope:

```json
{"success": true, "data": {}, "error": null}
```

Ошибка:

```json
{"success": false, "data": null, "error": "Описание"}
```

| Метод | Путь | Назначение |
|---|---|---|
| `GET` | `/health` | Healthcheck |
| `POST` | `/api/auth/login` | Вход тренера |
| `POST` | `/api/sessions` | Создание сессии |
| `GET` | `/api/sessions` | Список сессий |
| `GET` | `/api/sessions/{id}` | Детали сессии |
| `POST` | `/api/sessions/{id}/close` | Закрытие и агрегация |
| `POST` | `/api/athletes/register` | Регистрация спортсмена |
| `POST` | `/api/checkin/pre` | Pre-check-in |
| `POST` | `/api/checkin/post` | Post-check-in |
| `GET` | `/api/checkin/sessions/{id}` | Live-ответы |

Примеры тел:

```json
{"secret": "default-trainer-secret-12345"}
```

```json
{"trainer_id": "trainer-main", "athlete_count": 15}
```

```json
{"athlete_code": "A001", "session_id": "uuid"}
```

```json
{
  "session_id": "uuid",
  "device_token": "uuid",
  "sleep": 3,
  "fatigue": 2,
  "stress": 2,
  "pain": false
}
```

```json
{"session_id": "uuid", "device_token": "uuid", "rpe": 7}
```

Повторные pre/post возвращают `409`; post без pre — `400`; неизвестная или
закрытая сессия — `400`/`404` в зависимости от операции.

## SQLite и резервная копия

База находится в `/data/recovery.db` и подключена к volume
`startup_project_recovery_data`. `docker compose down` и пересборка её не удаляют.

Резервная копия:

```bash
docker compose cp backend:/data/recovery.db ./recovery-backup.db
```

Полное удаление контейнеров и базы:

```bash
docker compose down -v
```

Команда `down -v` необратимо удаляет pilot-данные.

## Локальная разработка без Docker

Backend:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

Frontend в другом терминале из корня:

```bash
npm ci
npm run dev
```

Backend будет на `http://localhost:8000`, Vite — на
`http://localhost:5173`. Development frontend по умолчанию использует backend
на `8000`. При необходимости создайте `.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

## Тесты и статический анализ

Frontend:

```bash
npm ci
npm run build
npm run lint
```

Backend:

```bash
cd backend
source venv/bin/activate
python -m compileall -q app main.py tests
python -m pytest -q
```

Pyright из корня:

```bash
npx --yes pyright backend/app backend/main.py backend/tests
```

Docker smoke-test:

```bash
docker compose up --build -d
docker compose ps
curl --fail http://localhost:18000/health
curl --fail http://localhost:8080/health
```

Ручной цикл: login → создать сессию → зарегистрировать `A001` → pre → post →
проверить live-ответы → закрыть сессию → проверить сводку.

## Зависимости и сборка

Frontend собирается через `npm ci`, поэтому `package.json` и
`package-lock.json` должны быть синхронизированы. Для изменения зависимости:

```bash
npm install <package>
npm run build
```

Backend-версии зафиксированы в `backend/requirements.txt`. После их изменения:

```bash
docker compose build --no-cache backend
```

Frontend Dockerfile состоит из `node:18-alpine` для TypeScript/Vite build и
`nginx:alpine` для production. Backend использует `python:3.11-slim`.
`node_modules`, `dist`, `backend/venv`, Python cache и SQLite исключены из Git и
Docker build contexts.

## Диагностика

### Порты заняты

```bash
ss -ltnp | grep -E ':8080|:18000'
```

Измените `.env`, например `FRONTEND_PORT=8081` и `BACKEND_PORT=18001`.

### Backend не healthy

```bash
docker compose ps
docker compose logs backend
curl -v http://localhost:18000/health
```

### Frontend возвращает 502

```bash
docker compose logs frontend backend
```

Проверьте health backend. Краткий 502 допустим только во время отдельного
перезапуска backend.

### Изменения frontend не появились

```bash
docker compose up --build -d frontend
```

Затем обновите страницу без cache или откройте приватное окно.

### Pylance показывает старые ошибки

Выберите `backend/venv/bin/python`, выполните `Pylance: Restart Language Server`
и `Developer: Reload Window`. Не сохраняйте старые открытые буферы поверх файлов.

## Ограничения пилота

- Нет отдельного реестра разрешённых кодов спортсменов.
- JWT выдаётся, но coach-маршруты пока не выполняют полную серверную проверку.
- `CORS_ORIGINS=*` предназначен для локального пилота.
- OpenAI и Telegram отключены без ключей; основная агрегация работает без них.
- Используется один backend и локальная SQLite.
- HTTPS не настроен.
- Согласие, gate несовершеннолетних, обучение, прогресс и партнёрские функции не
  входят в текущий этап.

## Дизайн-система

Основные токены: `--ink #12141c`, `--panel #1b2032`, `--tatami #7a9b7e`,
`--rope #c98a4b`, `--chalk #eeeae1`, `--chalk-dim #a8a6a3`. Заголовки и цифры —
Space Grotesk, интерфейс — Inter. Карточки плоские, без теней; мобильные кнопки
шкал имеют touch target 52×52 px. Цветные флаги используются функционально.
