# SUPER-MARIO11 GitHub Portfolio

A fast, aesthetic, responsive GitHub portfolio website built with **HTML + CSS + Vanilla JS** and deployed on **GitHub Pages**.

Live URL:
- https://super-mario11.github.io

## Overview
This site is a live GitHub-powered portfolio for **Super-mario11** with a dark/light theme, animated UI, and auto-updating data.

Core design direction:
- Neon-glass visual style
- Smooth motion + reveal effects
- Responsive layout for desktop, tablet, and mobile
- Performance-focused rendering + lazy loading

## Tech Stack
- HTML5
- CSS3
- Vanilla JavaScript (no framework)
- GitHub Pages (static hosting)

## Project Structure
- `index.html`
- `styles.css`
- `script.js`
- `404.html`
- `assets/`
- `.nojekyll`

## Webpage Sections (Matches Live Site)

### 1. Hero
- GitHub avatar
- Username
- Bio
- Followers / Following / Public Repos / Recent Commits
- Typing animation
- CTA buttons

### 2. Portfolio Highlights Strip
- Design: Neon Glass System
- Data: Real-Time GitHub API
- Motion: Smooth Scroll + Tilt

### 3. OneFetch Snapshot
- Terminal-style profile summary
- Repo totals and aggregate stats
- Language distribution bars

### 4. Top Repositories
- Shows **top 3** non-fork repos (sorted by stars)
- Search filter
- Repo metadata:
  - Name
  - Description
  - Language
  - Stars
  - Forks
  - Updated date

### 5. Recently Added Repositories
- Shows latest 3 newly created non-fork repos
- Includes stats/details + last activity insight

### 6. GitHub Stats
- Contribution Activity graph
- Profile Metrics card
- Language Focus card
- Theme-matched dark/light image variants
- Lazy loaded for performance

### 7. Recent Activity
- Latest 5 public events from:
  - PushEvent
  - CreateEvent
  - PullRequestEvent
- Relative time + formatted date

## Data Sources (Live)
- User profile:
  - `https://api.github.com/users/Super-mario11`
- Repositories:
  - `https://api.github.com/users/Super-mario11/repos?per_page=100&sort=updated`
- Events:
  - `https://api.github.com/users/Super-mario11/events?per_page=20`

External stat providers:
- Contribution graph:
  - `https://github-readme-activity-graph.vercel.app/`
- Stats/language cards:
  - `https://github-profile-summary-cards.vercel.app/`

## Performance + UX Features
- Async/await Fetch API architecture
- Session cache with TTL
- Loading skeletons
- API rate-limit message handling
- Lazy loading for heavy stat images via IntersectionObserver
- Debounced search and resize handling
- `content-visibility` optimization for section rendering
- Smooth reveal animations and cursor aura

## Theme Logic
- Theme toggle stores preference in localStorage (`portfolio-theme`)
- Dark/light CSS variable system
- Browser `theme-color` meta updates dynamically
- GitHub stat image endpoints swap per theme
- Toast/status popup also follows current theme colors

## GitHub Pages Deployment
1. Create repository: `super-mario11.github.io`
2. Push all files to `main` branch root
3. GitHub -> Settings -> Pages
4. Source: `Deploy from a branch`
5. Branch: `main` and folder `/ (root)`

Final URL:
- `https://super-mario11.github.io`

## Notes
- External stat image services can occasionally return temporary 5xx errors.
- GitHub API unauthenticated rate limits apply.
