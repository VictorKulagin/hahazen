# Профкарта: задача для бэкенда

## Главная логика

Раздел на фронте называется `Профкарта`. Он уже есть во вкладках карточки клиента.

Внутри профкарты тип зависит от специализации сотрудника.

Бэкенд хранит универсальный `pro_card_mode` с прицелом на будущие карты/схемы, но на первом этапе активная карта только одна: `body`.

Если `pro_card_mode = "body"` - показываем карту тела. Все остальные режимы пока показываются как простая текстовая профкарта. Когда позже будет готова карта лица, фронт и бэкенд просто начнут возвращать `face` как активный режим карты.

На фронте группы специализаций уже заведены в `lib/employee-specialties.ts`:

```ts
type SpecialtyGroupId =
    | "body"
    | "face"
    | "dental"
    | "aesthetics"
    | "wellness"
    | "technical";
```

Сейчас фронт уже знает такие режимы профкарты:

```ts
type ProCardMode =
    | "body"
    | "face"
    | "eyes"
    | "hands"
    | "feet"
    | "hair"
    | "dental"
    | "text";
```

Примеры:

- массажист, остеопат, депиляция, LPG -> `body`
- косметолог, визажист, перманентный макияж -> `face`
- бровист / лэшмейкер -> `eyes`
- стоматолог, ортодонт -> `dental`
- маникюр -> `hands`
- педикюр / подолог -> `feet`
- парикмахер / барбер -> `hair`
- инструктор, психолог, тату, технические услуги и остальное -> `text`

Для группы `body` сейчас используются специализации:

- `massage`
- `osteopath`
- `depilation`
- `body-hardware`

У этих специализаций `groupId: "body"` и `proCardMode: "body"`. У других специализаций `proCardMode` может быть `face`, `eyes`, `dental`, `hands`, `feet`, `hair` или `text`.

## Что должен сделать бэкенд

### 1. Сохранять группу специализации сотрудника

Сейчас фронт отправляет сотрудника с полем `specialty` строкой. Для профкарты бэкенду нужно уметь однозначно определить группу специализации.

Лучший вариант: добавить сотруднику явные поля:

```json
{
  "specialty": "Массажист",
  "specialty_id": "massage",
  "specialty_group": "body",
  "pro_card_mode": "body"
}
```

Если пока нельзя менять модель, временно можно вычислять группу на бэкенде по `specialty`, но это хуже: строки могут отличаться.

### 2. Отдавать доступность профкарты по клиенту

Фронту нужно понять, какую профкарту показывать конкретному клиенту.

Нужен endpoint:

`GET /clients/{clientId}/pro-card/capabilities`

Ответ:

```json
{
  "client_id": 831,
  "available_modes": ["body", "text"],
  "primary_mode": "body",
  "source": {
    "type": "employee_specialties",
    "employee_ids": [12, 18],
    "specialty_groups": ["body"]
  }
}
```

Правило формирования:

- Бэкенд смотрит сотрудников/визиты/назначения клиента в текущей компании.
- На первом этапе, если у связанного сотрудника `pro_card_mode = "body"`, вернуть `["body", "text"]`, а `primary_mode` сделать `body`.
- Если `pro_card_mode` любой другой (`face`, `eyes`, `dental`, `hands`, `feet`, `hair` или `text`), вернуть только `["text"]`, а `primary_mode` сделать `text`.
- В будущем, когда появится карта лица, для `pro_card_mode = "face"` можно будет вернуть `["face", "text"]`, а `primary_mode` сделать `face`.

Пример для специализации без карты/схемы:

```json
{
  "client_id": 831,
  "available_modes": ["text"],
  "primary_mode": "text",
  "source": {
    "type": "employee_specialties",
    "employee_ids": [44],
    "specialty_groups": ["technical"]
  }
}
```

Фронт-логика:

- Вкладка называется `Профкарта` всегда.
- Если `primary_mode = "body"`, внутри вкладки показываем карту тела.
- Если `primary_mode = "text"`, внутри вкладки показываем текстовую профкарту.

### 3. Добавить текстовую профкарту

Текстовая профкарта нужна для всех специализаций, где нет карты тела.

Минимальная модель `client_pro_card_notes`:

```sql
id BIGINT PRIMARY KEY
company_id BIGINT NOT NULL
client_id BIGINT NOT NULL
author_id BIGINT NULL
updated_by BIGINT NULL

content TEXT NOT NULL

service_id BIGINT NULL
appointment_id BIGINT NULL
visit_date DATE NULL

created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
deleted_at TIMESTAMP NULL
```

Можно сделать проще и хранить одно поле `pro_card_text` прямо у клиента, если бэкендеру так быстрее. Но лучше отдельной таблицей: тогда будет история заметок по датам, мастерам и визитам.

API:

`GET /clients/{clientId}/pro-card/notes`

```json
{
  "data": [
    {
      "id": 25,
      "client_id": 831,
      "content": "Текстовая профкарта клиента. Особенности, рекомендации, профессиональные заметки.",
      "service_id": null,
      "appointment_id": 555,
      "visit_date": "2026-04-27",
      "created_at": "2026-04-27T09:10:00Z",
      "updated_at": "2026-04-27T09:10:00Z",
      "author": {
        "id": 12,
        "name": "Анна"
      }
    }
  ]
}
```

`POST /clients/{clientId}/pro-card/notes`

```json
{
  "content": "Текстовая профкарта клиента.",
  "service_id": null,
  "appointment_id": 555,
  "visit_date": "2026-04-27"
}
```

`PUT /clients/{clientId}/pro-card/notes/{noteId}`

```json
{
  "content": "Обновленный текст профкарты."
}
```

`DELETE /clients/{clientId}/pro-card/notes/{noteId}`

Поведение: мягкое удаление через `deleted_at`.

### 4. Добавить сущность отметки на карте тела

Таблица `client_body_marks`:

```sql
id BIGINT PRIMARY KEY
company_id BIGINT NOT NULL
client_id BIGINT NOT NULL
author_id BIGINT NULL
updated_by BIGINT NULL

body_view VARCHAR(16) NOT NULL
body_part VARCHAR(64) NOT NULL
mark_type VARCHAR(32) NOT NULL
title VARCHAR(120) NULL
description TEXT NULL

x DECIMAL(6,3) NOT NULL
y DECIMAL(6,3) NOT NULL
radius DECIMAL(6,3) NULL
color VARCHAR(24) NULL

service_id BIGINT NULL
appointment_id BIGINT NULL
visit_date DATE NULL

is_archived BOOLEAN NOT NULL DEFAULT FALSE
created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
deleted_at TIMESTAMP NULL
```

Пояснения:

- `body_view` - сторона тела: `front`, `back`, `left`, `right`.
- `body_part` - зона тела: `head`, `neck`, `chest`, `abdomen`, `back`, `left_arm`, `right_arm`, `left_leg`, `right_leg`, `feet`, `other`.
- `mark_type` - тип отметки: `problem`, `procedure`, `contraindication`, `note`, `scar`, `mole`, `pain`, `result`.
- `x`, `y` - координаты в процентах от изображения/контейнера, диапазон `0..100`.
- `radius` - опциональный размер зоны в процентах.
- `service_id`, `appointment_id`, `visit_date` - опциональная привязка к услуге/визиту.
- `deleted_at` - мягкое удаление.

Индексы:

```sql
CREATE INDEX idx_client_body_marks_company_client
ON client_body_marks(company_id, client_id, deleted_at);

CREATE INDEX idx_client_body_marks_client_view
ON client_body_marks(client_id, body_view, deleted_at);

CREATE INDEX idx_client_body_marks_appointment
ON client_body_marks(appointment_id);
```

### 5. Добавить API карты

На первом этапе нужен только endpoint карты тела для режима `body`.

Для будущих карт/схем (`face`, `eyes`, `dental`, `hands`, `feet`, `hair`) лучше сразу проектировать данные универсально через поле `pro_card_mode`, но сами endpoints можно не делать до появления этих карт.

Главное: фронт должен получать и сохранять отметки только для режима, который доступен клиенту через `capabilities`. Сейчас это только `body`.

#### Получить отметки

`GET /clients/{clientId}/body-map`

Query параметры:

- `body_view` - опционально: `front`, `back`, `left`, `right`.
- `mark_type` - опционально.
- `include_archived` - опционально, по умолчанию `false`.

Ответ:

```json
{
  "data": [
    {
      "id": 101,
      "client_id": 831,
      "body_view": "front",
      "body_part": "neck",
      "mark_type": "problem",
      "title": "Зажим в шее",
      "description": "Клиент жалуется на дискомфорт справа.",
      "x": 48.5,
      "y": 18.2,
      "radius": 2.5,
      "color": "#22c55e",
      "service_id": null,
      "appointment_id": 555,
      "visit_date": "2026-04-27",
      "is_archived": false,
      "created_at": "2026-04-27T09:10:00Z",
      "updated_at": "2026-04-27T09:10:00Z",
      "author": {
        "id": 12,
        "name": "Анна"
      }
    }
  ]
}
```

#### Создать отметку

`POST /clients/{clientId}/body-map`

Payload:

```json
{
  "body_view": "front",
  "body_part": "neck",
  "mark_type": "problem",
  "title": "Зажим в шее",
  "description": "Клиент жалуется на дискомфорт справа.",
  "x": 48.5,
  "y": 18.2,
  "radius": 2.5,
  "color": "#22c55e",
  "service_id": null,
  "appointment_id": 555,
  "visit_date": "2026-04-27"
}
```

Ответ: созданная отметка.

#### Обновить отметку

`PUT /clients/{clientId}/body-map/{markId}`

Ответ: обновленная отметка.

#### Удалить отметку

`DELETE /clients/{clientId}/body-map/{markId}`

Поведение: мягкое удаление через `deleted_at`.

Ответ:

```json
{
  "success": true
}
```

#### Архивировать отметку

`PATCH /clients/{clientId}/body-map/{markId}/archive`

Payload:

```json
{
  "is_archived": true
}
```

Ответ: обновленная отметка.

## Валидация

Обязательные поля при создании отметки:

- `body_view`
- `body_part`
- `mark_type`
- `x`
- `y`

Правила:

- `body_view` только `front`, `back`, `left`, `right`.
- `x` и `y` от `0` до `100`.
- `radius` от `0` до `100`, можно `null`.
- `title` максимум 120 символов.
- `description` можно пустым.
- `mark_type` только из разрешенного списка.
- `service_id` и `appointment_id`, если переданы, должны принадлежать той же компании.
- Создание отметки разрешено только если для клиента доступен режим `body`.

## Права доступа

- Все запросы фильтровать по `company_id`.
- Нельзя отдавать или менять отметки клиента из другой компании.
- Просмотр карты тела: тот же доступ, что и просмотр клиента.
- Создание/редактирование/удаление: тот же доступ, что и редактирование клиента или профкарты.
- Если у клиента нет доступного режима `body`, создание отметки должно вернуть `403` или `422` с понятным сообщением.

Пример ошибки:

```json
{
  "message": "This pro card map is not available for this client's specialties"
}
```

## Что фронт подключит после готовности API

Фронт добавит:

- `services/clientProCardApi.ts`
- `services/clientBodyMapApi.ts`
- `useClientProCardCapabilities`
- `useClientProCardNotes`
- `useClientBodyMap`
- `useCreateBodyMark`
- `useUpdateBodyMark`
- `useDeleteBodyMark`
- компонент карты тела во вкладке `proCard`

Query keys:

```ts
["client", clientId, "pro-card", "capabilities"]
["client", clientId, "pro-card", "notes"]
["client", clientId, "body-map", filters]
```

После create/update/delete фронт инвалидирует `["client", clientId, "body-map"]`.

## Acceptance criteria

- Бэкенд хранит или стабильно вычисляет `specialty_group`.
- Бэкенд хранит или стабильно вычисляет `pro_card_mode`: `body`, `face`, `eyes`, `dental`, `hands`, `feet`, `hair` или `text`.
- На первом этапе активной картой считается только `body`.
- Для `body` возвращается `available_modes = ["body", "text"]`.
- Для всех остальных режимов пока возвращается текстовая профкарта: `available_modes = ["text"]`.
- Текстовую профкарту можно создать, отредактировать, удалить и получить по клиенту.
- `GET /clients/{clientId}/body-map` возвращает отметки только текущей компании.
- `POST` создает отметку и автоматически проставляет `company_id`, `client_id`, `author_id`.
- `PUT/PATCH` обновляет только отметку этого клиента и этой компании.
- `DELETE` делает мягкое удаление, после него отметка не приходит в обычном `GET`.
- Координаты валидируются в диапазоне `0..100`.
- Нельзя создать отметку на чужого клиента.
- Нельзя создать отметку карты тела для клиента, у которого нет режима `body`.
- Нельзя привязать отметку к чужому визиту или услуге.

