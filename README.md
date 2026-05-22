# Political Economy Portfolio — Hugo + GitHub Pages

A clean, research-credible portfolio built with [Hugo](https://gohugo.io) and the
[PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme, deployed free on
GitHub Pages via GitHub Actions.

## What's here

```
.
├── hugo.toml                 # site config: theme, profile hero, menu, social
├── archetypes/default.md     # template for new posts
├── assets/css/extended/      # custom.css — fonts & accent colour
├── content/
│   ├── _index.md             # homepage (profile hero comes from config)
│   ├── about.md
│   ├── publications.md
│   ├── cv.md
│   ├── contact.md
│   └── analysis/             # blog section + two sample posts
├── static/profile.jpg        # placeholder headshot — replace this
└── .github/workflows/hugo.yml  # auto-build & deploy on every push
```

> Note: the **theme is not bundled** — Hugo expects it to live in `themes/` and be
> managed separately. You'll add it as a git submodule in step 3 below (one command).
> The deploy workflow checks out submodules automatically.

## 1. Install Hugo (one time)

Use the **extended** edition (needed for the theme's CSS). On macOS with Homebrew
this is the default:

```bash
brew install hugo
hugo version      # should say "extended"
```

(Git you already have.)

## 2. Get the project ready

Unzip this folder, open Terminal in it, and make it a git repo:

```bash
cd hugo-portfolio
git init
git branch -M main
```

## 3. Add the PaperMod theme

```bash
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

## 4. Preview locally

```bash
hugo server
```

Open <http://localhost:1313/>. It live-reloads as you edit. Now make it yours:

- Replace every `[bracketed]` / `(parenthesised)` placeholder (name, regions, links).
- Swap `static/profile.jpg` for your own square headshot (keep the filename).
- Update the social links and `baseURL` in `hugo.toml`.
- Add real entries to `content/publications.md`.
- Add a post: `hugo new analysis/my-post.md`, then set `draft: false` when ready.

## 5. Create the GitHub repo

1. On GitHub, create a **new empty repository** (e.g. `portfolio`).
2. In the repo's **Settings → Pages**, set **Source = GitHub Actions**.
   (This is required — the included workflow does the deploying.)

## 6. Push and deploy

```bash
git add .
git commit -m "Initial portfolio"
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
git push -u origin main
```

The Actions workflow runs automatically, builds the site, and deploys it. Watch
progress under the repo's **Actions** tab. Within a minute or two your site is live
at `https://YOUR-USERNAME.github.io/portfolio/`.

Update `baseURL` in `hugo.toml` to match that URL, then commit/push again.

To update later: edit, `git add . && git commit -m "..." && git push` — the workflow
redeploys on every push to `main`.

## 7. (Optional) Custom domain

Buy a domain, add it under **Settings → Pages → Custom domain**, point your DNS at
GitHub Pages, and update `baseURL`.

## Keeping it updated with Claude

If you connect a GitHub connector, you can ask Claude to draft and commit new
analysis posts or publication entries straight to this repo — the push then
triggers a redeploy automatically.
