# FrendGame

Если видишь ошибку вида:

> Branch "..." is not allowed to deploy to github-pages due to environment protection rules

это значит, что GitHub Pages environment разрешает деплой только из защищённой ветки (обычно `main`).

## Что уже исправлено в workflow

- Workflow теперь делает проверку файлов на **любой ветке**.
- Деплой в `github-pages` запускается **только** для `main` или `master`.
- Поэтому в feature-ветках не будет падения из-за environment protection.

## Что сделать у себя в репозитории

1. Смержить изменения в `main`.
2. Открыть **Settings → Environments → github-pages** и убедиться, что allowed branches включает `main` (или нужную ветку деплоя).
3. В **Settings → Pages** выбрать **Source: GitHub Actions**.
4. После merge дождаться успешного workflow deploy на `main`.

## URL

- user/organization site: `https://<user>.github.io/`
- project site: `https://<user>.github.io/<repo>/`


## Если открывается старая версия

- Открой сайт с принудительным обновлением: `Ctrl+F5` (или очисти cache в браузере).
- В проекте включён cache-busting: `styles.css?v=20260209`, `app.js?v=20260209`, `tasks.js?v=20260209`.