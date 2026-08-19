# Каталог салонов: окончательное MVP-ТЗ для backend

## 1. Задача

Нужно заменить демонстрационные карточки на главной странице Hahazen реальными карточками салонов.

Для MVP должны работать два сценария:

1. Команда Hahazen добавляет карточку салона, который пока не использует CRM.
2. Владелец подключённого к CRM салона редактирует свою карточку самостоятельно.

Карточка должна иметь отдельную публичную страницу с фотографиями, контактами и ссылкой на онлайн-запись.

## 2. Главное решение

Одна карточка каталога соответствует одному физическому салону или филиалу.

Карточка каталога хранится отдельно от CRM-сущностей `companies` и `branches`.

- Если салон ещё не использует CRM, `branch_id = null`.
- Если салон подключён к CRM, карточка связывается с его настоящим `branch_id`.
- Нельзя создавать фиктивные `companies` и `branches` ради каталога.
- Один `branch_id` может быть связан только с одной карточкой каталога.

## 3. Как это работает

### 3.1. Салон пока не использует CRM

1. Команда Hahazen получает разрешение салона на публикацию информации и фотографий.
2. Команда Hahazen создаёт карточку через административный API.
3. Команда проверяет карточку и публикует её.
4. Карточка появляется на главной странице и по адресу `/salons/{slug}`.
5. Если у салона есть внешняя онлайн-запись, указывается внешняя HTTPS-ссылка. Если её нет, кнопка записи не показывается.

Такой салон не получает доступ к CRM и не может самостоятельно менять карточку.

### 3.2. Салон уже использует CRM

1. Карточка создаётся сразу с `branch_id` или существующая карточка вручную связывается командой Hahazen с реальным `branch_id`.
2. Владелец или руководитель открывает раздел `Публичная карточка` в существующем кабинете CRM.
3. Владелец меняет описание, контакты, фотографии и настройки онлайн-записи.
4. После сохранения опубликованная карточка обновляется без ручного согласования каждой правки.
5. Команда Hahazen сохраняет возможность скрыть карточку при нарушении правил.

### 3.3. Салон сначала добавлен командой, затем подключился к CRM

1. Команда Hahazen находит существующую карточку.
2. Команда вручную записывает в неё настоящий `branch_id`.
3. После связи владелец получает возможность редактировать карточку в CRM.
4. Новая карточка не создаётся, старый публичный URL сохраняется.

В MVP не нужна автоматическая заявка `Я владелец`. Связь выполняет команда Hahazen вручную.

## 4. Модель данных

Создать таблицу `salon_catalog_profiles`.

```sql
id BIGINT PRIMARY KEY
branch_id BIGINT NULL UNIQUE

slug VARCHAR(180) NOT NULL UNIQUE
name VARCHAR(180) NOT NULL
short_description VARCHAR(300) NULL
description TEXT NULL

country_code CHAR(2) NOT NULL
city VARCHAR(120) NOT NULL
address VARCHAR(300) NULL
phone VARCHAR(40) NULL
website_url VARCHAR(500) NULL
instagram_url VARCHAR(500) NULL
services_summary VARCHAR(300) NULL

gallery_urls JSON NULL

booking_mode VARCHAR(20) NOT NULL DEFAULT 'none'
external_booking_url VARCHAR(1000) NULL

status VARCHAR(20) NOT NULL DEFAULT 'draft'
is_partner BOOLEAN NOT NULL DEFAULT FALSE
sort_order INT NOT NULL DEFAULT 0

seo_title VARCHAR(180) NULL
seo_description VARCHAR(300) NULL

consent_received_at TIMESTAMP NULL
consent_note TEXT NULL

created_by BIGINT NULL
updated_by BIGINT NULL
created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
deleted_at TIMESTAMP NULL
```

### 4.1. Статусы

`status`:

- `draft` — черновик, публично не показывается;
- `published` — опубликована;
- `hidden` — временно скрыта владельцем или командой;
- `suspended` — принудительно скрыта командой Hahazen.

Публично возвращаются только карточки, у которых:

```text
status = published
deleted_at IS NULL
```

### 4.2. Страна

`country_code` хранится как ISO 3166-1 alpha-2:

- `KG` — Кыргызстан;
- `KZ` — Казахстан;
- `RU` — Россия.

Backend возвращает код. Отображаемое название страны формирует frontend.

### 4.3. Направления салона

Для MVP не создавать справочник и систему тегов.

Использовать обычное текстовое поле `services_summary`, например:

```text
Массаж · SPA · Уход
```

### 4.4. Фотографии

`gallery_urls` — упорядоченный массив URL.

Правила:

- максимум 7 фотографий;
- первое изображение используется как обложка;
- для публикации нужна минимум одна фотография;
- владелец может менять порядок;
- разрешены JPEG, PNG и WebP;
- максимальный размер исходного файла — 8 МБ;
- backend проверяет реальный MIME-тип;
- SVG и исполняемые файлы запрещены;
- публичный API дополнительно возвращает первое изображение как `cover_image_url`.

### 4.5. Онлайн-запись

`booking_mode`:

- `hahazen` — запись через Hahazen;
- `external` — внешняя ссылка салона;
- `none` — онлайн-записи нет.

Правила:

- `hahazen` разрешён только при наличии `branch_id`;
- для `hahazen` backend формирует URL `/booking/branches/{branch_id}/services/select`;
- для `external` обязателен валидный HTTPS URL в `external_booking_url`;
- для `none` публичное API возвращает `booking.url = null`.

### 4.6. SEO

Поля `seo_title` и `seo_description` необязательные.

Если они не заполнены, backend возвращает автоматически сформированные значения:

```text
seo_title: "{name} в городе {city} — онлайн-запись"
seo_description: "{short_description}. Адрес, фотографии и онлайн-запись в {name}."
```

Отдельные SEO keywords и другие SEO-теги в MVP не нужны.

## 5. Публичное API

Публичные endpoints не требуют авторизации.

### 5.1. Получить опубликованные карточки

`GET /public-api/catalog/salons`

Query-параметры:

- `limit` — по умолчанию `12`, максимум `50`;
- `country_code` — необязательный фильтр;
- `city` — необязательный фильтр.

Сортировка:

1. `sort_order ASC`;
2. `updated_at DESC`.

Пример ответа:

```json
{
  "data": [
    {
      "id": 41,
      "slug": "lotus-spa-bishkek",
      "name": "Lotus SPA",
      "short_description": "Массаж и SPA-программы в центре Бишкека",
      "country_code": "KG",
      "city": "Бишкек",
      "address": "ул. Примерная, 10",
      "services_summary": "Массаж · SPA · Уход",
      "cover_image_url": "https://cdn.example.com/salons/41/cover.webp",
      "is_partner": true,
      "booking": {
        "mode": "hahazen",
        "url": "/booking/branches/12/services/select"
      }
    }
  ]
}
```

### 5.2. Получить публичную страницу салона

`GET /public-api/catalog/salons/{slug}`

Возвращает:

```json
{
  "id": 41,
  "slug": "lotus-spa-bishkek",
  "name": "Lotus SPA",
  "short_description": "Массаж и SPA-программы в центре Бишкека",
  "description": "Полное описание салона.",
  "country_code": "KG",
  "city": "Бишкек",
  "address": "ул. Примерная, 10",
  "phone": "+996700000000",
  "website_url": "https://example.com",
  "instagram_url": "https://instagram.com/example",
  "services_summary": "Массаж · SPA · Уход",
  "gallery_urls": [
    "https://cdn.example.com/salons/41/cover.webp",
    "https://cdn.example.com/salons/41/interior.webp"
  ],
  "is_partner": true,
  "seo_title": "Lotus SPA в городе Бишкек — онлайн-запись",
  "seo_description": "Массаж и SPA-программы в центре Бишкека. Адрес, фотографии и онлайн-запись в Lotus SPA.",
  "updated_at": "2026-06-10T12:00:00Z",
  "booking": {
    "mode": "hahazen",
    "url": "/booking/branches/12/services/select"
  }
}
```

Если карточка не опубликована или удалена, вернуть `404`.

## 6. API владельца в существующей CRM

Отдельная админка владельцу не нужна. Frontend добавит в существующий кабинет раздел `Публичная карточка`.

Доступ разрешён владельцу или руководителю, имеющему права на указанный филиал.

### 6.1. Получить карточку своего филиала

`GET /branches/{branchId}/public-profile`

Если карточка ещё не создана:

```json
{
  "data": null
}
```

### 6.2. Создать или обновить карточку своего филиала

`PUT /branches/{branchId}/public-profile`

Endpoint работает как upsert.

Backend:

- проверяет доступ пользователя к филиалу;
- устанавливает `branch_id` только из URL;
- не создаёт вторую карточку для уже связанного филиала;
- не разрешает владельцу изменять служебные поля.

Payload:

```json
{
  "slug": "lotus-spa-bishkek",
  "name": "Lotus SPA",
  "short_description": "Массаж и SPA-программы в центре Бишкека",
  "description": "Полное описание салона.",
  "country_code": "KG",
  "city": "Бишкек",
  "address": "ул. Примерная, 10",
  "phone": "+996700000000",
  "website_url": "https://example.com",
  "instagram_url": "https://instagram.com/example",
  "services_summary": "Массаж · SPA · Уход",
  "gallery_urls": [
    "https://cdn.example.com/salons/41/cover.webp"
  ],
  "booking_mode": "hahazen",
  "external_booking_url": null,
  "seo_title": null,
  "seo_description": null
}
```

Владелец не может изменять:

- `branch_id`;
- `status`;
- `is_partner`;
- `sort_order`;
- `consent_received_at`;
- `consent_note`;
- `created_by`;
- `updated_by`.

### 6.3. Опубликовать карточку

`POST /branches/{branchId}/public-profile/publish`

Перед публикацией проверить:

- `name`;
- уникальный `slug`;
- `short_description`;
- `country_code`;
- `city`;
- минимум одну фотографию;
- корректные настройки онлайн-записи.

### 6.4. Скрыть карточку

`POST /branches/{branchId}/public-profile/hide`

Меняет `status` на `hidden`.

### 6.5. Загрузить фотографию

`POST /branches/{branchId}/public-profile/images`

Формат: `multipart/form-data`, поле `file`.

Ответ:

```json
{
  "url": "https://cdn.example.com/salons/41/interior.webp"
}
```

Endpoint только загружает файл. Порядок фотографий сохраняется через `PUT /branches/{branchId}/public-profile`.

### 6.6. Удалить фотографию

`DELETE /branches/{branchId}/public-profile/images`

Payload:

```json
{
  "url": "https://cdn.example.com/salons/41/interior.webp"
}
```

Backend разрешает удалить только файл, принадлежащий карточке этого филиала.

## 7. Административное API команды Hahazen

В MVP отдельный административный frontend не обязателен. Команда может использовать API через Postman или существующий внутренний инструмент.

Нужны platform-level права, не связанные с ролью администратора конкретного салона.

### Endpoints

- `GET /admin/catalog/salons` — получить все карточки;
- `POST /admin/catalog/salons` — создать карточку, в том числе без `branch_id`;
- `GET /admin/catalog/salons/{id}` — получить любую карточку;
- `PATCH /admin/catalog/salons/{id}` — изменить карточку и при необходимости привязать `branch_id`;
- `POST /admin/catalog/salons/{id}/publish` — опубликовать;
- `POST /admin/catalog/salons/{id}/hide` — скрыть;
- `POST /admin/catalog/salons/{id}/suspend` — принудительно скрыть;
- `POST /admin/catalog/salons/{id}/images` — загрузить фотографию;
- `DELETE /admin/catalog/salons/{id}/images` — удалить фотографию;
- `DELETE /admin/catalog/salons/{id}` — мягкое удаление через `deleted_at`.

Только команда Hahazen может изменять:

- `branch_id`;
- `status = suspended`;
- `is_partner`;
- `sort_order`;
- `consent_received_at`;
- `consent_note`.

При связывании с `branch_id` backend проверяет, что этот филиал ещё не связан с другой карточкой.

## 8. Права доступа

Добавить permissions:

```text
catalog:profile:view
catalog:profile:update
catalog:profile:publish
catalog:manage:any
```

Правила:

- `owner` и `gd` получают права просмотра, изменения и публикации карточек своих филиалов;
- салонный `admin` получает эти права только при явной выдаче;
- `catalog:manage:any` доступно только команде Hahazen;
- все проверки выполняются backend, а не только frontend.

## 9. Валидация

- `slug` уникальный, состоит из латинских букв, цифр и дефисов;
- опубликованный `slug` не менять без необходимости;
- `country_code` обязателен и входит в поддерживаемый список;
- URL должны использовать HTTPS;
- `services_summary` — максимум 300 символов;
- `short_description` — максимум 300 символов;
- `description` — максимум 5000 символов;
- `gallery_urls` — максимум 7 элементов;
- для публикации требуется минимум одна фотография;
- `seo_title` — максимум 180 символов;
- `seo_description` — максимум 300 символов;
- карточку без `branch_id` можно публиковать только при заполненном `consent_received_at`;
- для фотографий салона без `branch_id` право на публикацию фиксируется в `consent_note`;
- все удаления мягкие через `deleted_at`.

## 10. SEO: граница ответственности backend

Backend должен вернуть:

- стабильный уникальный `slug`;
- `seo_title` и `seo_description`, заданные вручную или сформированные автоматически;
- `updated_at`;
- страну, город, адрес, телефон, фотографии и ссылку на запись;
- публичный detail endpoint без авторизации.

Frontend должен сделать:

- серверную страницу `/salons/{slug}`;
- уникальные `<title>` и `<meta name="description">`;
- canonical URL;
- Open Graph;
- JSON-LD `LocalBusiness`;
- добавление опубликованных карточек в sitemap.

## 11. Что не входит в MVP

- отзывы и рейтинг;
- отдельная система SEO-тегов или keywords;
- справочник и фильтрация по тегам услуг;
- автоматическая синхронизация услуг из CRM;
- автоматическая заявка `Я владелец`;
- отдельная административная панель команды Hahazen;
- платное продвижение карточек;
- аналитика просмотров и кликов;
- автоматическая генерация текстов через AI.

## 12. Acceptance criteria

- Команда Hahazen может создать карточку салона без создания CRM-компании и CRM-филиала.
- Команда может вручную связать существующую карточку с реальным `branch_id`.
- Один `branch_id` нельзя связать с двумя карточками.
- Владелец или `gd` может редактировать, публиковать и скрывать карточку только своего филиала.
- Владелец не может самостоятельно изменить `is_partner`, `sort_order`, `branch_id` или снять `suspended`.
- Публичный список возвращает только опубликованные и не удалённые карточки.
- Публичная страница доступна по стабильному `slug`.
- В карточке можно хранить максимум 7 безопасных фотографий, первая является обложкой.
- Карточка может вести на запись Hahazen, внешнюю HTTPS-запись или не показывать кнопку записи.
- Если SEO-поля пустые, backend возвращает автоматически сформированные значения.
- Backend не хранит и не возвращает демонстрационный рейтинг.
- Backend проверяет права доступа для всех owner/admin endpoints.
