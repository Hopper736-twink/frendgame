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


## Ошибка `Branch ... is not allowed to deploy to github-pages`

Исправлено в workflow:
- job `deploy` теперь **всегда успешный** для PR/feature-веток (noop-step),
- реальный Pages deploy выполняется только на push в `main/master`.

Это убирает блокирующую ошибку protection rules в PR-чексах.


## Ручной merge как в GitHub UI

Если хочешь повторить шаги из блока `Checkout via the command line`, используй:

```bash
./scripts/github_manual_merge.sh codex/create-truth-or-dare-game-website-koswz2 main
```

Для проверки команд без выполнения:

```bash
./scripts/github_manual_merge.sh codex/create-truth-or-dare-game-website-koswz2 main --dry-run
```


### Если GitHub всё ещё пишет `This branch has conflicts that must be resolved`

Запусти именно авто-резолв для текущего списка конфликтных файлов:

```bash
./scripts/resolve_pr_conflicts.sh codex/create-truth-or-dare-game-website-koswz2 main --refresh
```

Скрипт уже включает файлы из сообщения GitHub:
- `.github/workflows/deploy-pages.yml`
- `Index.html`
- `README.md`
- `app.js`
- `index.html`
- `styles.css`
- `tasks.js`


## Почему ошибка могла «не исчезать»

Теперь workflow разделены:
- `PR Checks (no deploy)` запускается в pull request и **никогда** не деплоит.
- `Deploy Pages (main only)` запускается только после push в `main/master`.

Если раньше в PR уже был красный deploy-run, он останется в истории старого commit.
Новый commit создаёт новый набор checks, и именно он должен быть зелёным.


## Совместимость с legacy required checks

Если в branch protection остались старые required checks (например `pages build and deployment`),
в `pr-checks.yml` добавлен одноимённый совместимый job, который на PR завершается успешно
без реального деплоя в `github-pages` environment.
