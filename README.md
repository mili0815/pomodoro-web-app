# Pomodoro

GitHub Pages deployment target:

`https://mili0815.github.io/pomodoro-web-app/`

Render deployment target example:

`https://pomodoro-web-app.onrender.com`

## Local run

```bash
npm start
```

Open:

`http://127.0.0.1:4173/`

## Deploy

1. Upload this project to the GitHub repository `mili0815/pomodoro-web-app`.
2. Push to the `main` branch.
3. In GitHub repository settings, open `Settings > Pages`.
4. Ensure GitHub Pages is enabled for `GitHub Actions`.
5. After the workflow completes, open:

`https://mili0815.github.io/pomodoro-web-app/`

## Deploy On Render

1. Push this project to GitHub.
2. Open Render and create a new `Blueprint` or `Static Site`.
3. Connect the repository `mili0815/pomodoro-web-app`.
4. If using `Blueprint`, Render reads [render.yaml](/C:/Users/mili0/pomodoro-app/render.yaml) automatically.
5. If using `Static Site` manually, use:

`Build Command:`

```bash
echo skip build
```

`Publish Directory:`

```bash
.
```

6. Set the service name you want. The final URL becomes:

`https://서비스이름.onrender.com`

Example:

`https://pomodoro-web-app.onrender.com`
