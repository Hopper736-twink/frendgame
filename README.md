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


## Быстрое решение конфликтов PR

Если GitHub пишет `Checks awaiting conflict resolution`, используй скрипт:

```bash
./scripts/resolve_pr_conflicts.sh codex/create-truth-or-dare-game-website-koswz2 main
```

Он делает то же, что в инструкции GitHub:
1. fetch `main`
2. checkout head-ветки
3. merge base в head
4. автоматически закрывает типовые конфликты по статическим файлам
5. делает merge commit

После этого останется выполнить push:

```bash
git push -u origin codex/create-truth-or-dare-game-website-koswz2
```


## Если статус в PR "не меняется"

Иногда GitHub показывает `outdated deployment` и визуально кажется, что ошибка не обновляется.
Сделай merge base -> head и добавь пустой refresh-коммит:

```bash
./scripts/resolve_pr_conflicts.sh codex/create-truth-or-dare-game-website-koswz2 main --refresh
```

Потом push в head-ветку:

```bash
git push -u origin codex/create-truth-or-dare-game-website-koswz2
```

Это принудительно перезапускает checks и обновляет статус PR.
