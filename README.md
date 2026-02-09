# FrendGame

Чтобы убрать конфликты и ошибки вида `outdated deployment`, структура упрощена до **одной** версии сайта в корне репозитория.

## Текущая схема

- `index.html` — главный вход
- `404.html` — fallback
- `app.js`, `tasks.js`, `styles.css` — логика и стили
- GitHub Actions deploy только из `main/master`

## Важно

- В PR запускается только `validate` (без deploy), поэтому feature-ветка не падает на protection rules.
- После merge в `main` запускается реальный deploy.
- Если видишь старую версию — сделай hard refresh (`Ctrl+F5`).
