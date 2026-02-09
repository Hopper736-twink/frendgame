# FrendGame

Если видишь 404 на GitHub Pages:

1. Проверь URL:
   - user/organization site: `https://<user>.github.io/`
   - project site: `https://<user>.github.io/<repo>/`
2. В **Settings → Pages** выбери **Source: GitHub Actions**.
3. Убедись, что последний push дошёл в GitHub (не только локальный commit).
4. Дождись успешного workflow **Deploy static site to GitHub Pages**.

## Что настроено в репозитории

- Есть `index.html` как главная страница.
- Есть `404.html` fallback.
- Workflow деплоя запускается на push в **любую** ветку и выкладывает текущий коммит.
