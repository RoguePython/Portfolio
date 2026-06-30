<div align="center">

# Benjamin Joubert

**Fullstack Developer** · Bloemfontein, South Africa

*2 years professional experience · 5 years building things that (mostly) work*

[![Live Site](https://img.shields.io/badge/Live_Site-benjaminjoubert.co.za-cc0000?style=for-the-badge&logo=googlechrome&logoColor=white)](https://benjaminjoubert.co.za)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/benjamin-joubert-00bba7263/)
[![Email](https://img.shields.io/badge/Email-Say_Hi-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:bendriejoubert@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-RoguePython-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/RoguePython)

</div>

---

## About This Project

This is my personal portfolio — a hand-crafted, zero-framework website built with vanilla HTML, CSS, and JavaScript. No React. No Tailwind. No 400 MB `node_modules` folder. Just good old-fashioned web development, a text editor, and an unreasonable amount of coffee.

It showcases my work experience, projects, skills, and a few hidden easter eggs for anyone curious enough to look. If you're reading this, you've already found one clue.

## About Me

I'm a Fullstack Developer at **Weighsoft / Wow Scales**, where I architect production React Native mobile apps, build C# .NET Core backend APIs, integrate industrial hardware (scales, NFC/RFID), and manage CI/CD pipelines — all before my second coffee.

On weekends, I moonlight as General Manager at **Dancakes Coffee & Bakery**, because apparently one career at a time wasn't enough of a challenge. I also built [their website](https://dancakesza.com/), which means I'm technically my own client. I do not recommend this.

Before going professional, I spent 3 years building projects, freelancing, and learning everything I could — from web development to game dev. I earned top marks in both Computer Applications Technology and Information Technology at Jim Fouchè Hoërskool, which was the earliest sign that I'd end up staring at screens for a living.

## Tech Stack

<div align="center">

| Domain | Technologies |
|--------|-------------|
| **Mobile** | React Native · TypeScript · Expo EAS · SQLite |
| **Backend** | C# · .NET Core · RESTful APIs |
| **Frontend** | HTML5 · CSS3 · JavaScript |
| **Database** | SQL · Database Design |
| **Hardware** | Serial Protocols · NFC/RFID Integration |
| **Legacy** | Delphi *(yes, really)* |
| **Tools** | Git · Agile/Scrum · CI/CD |

</div>

## Featured Projects

### 🌐 Portfolio *(you are here)*
> A fully responsive personal website with scroll animations, a live GitHub activity feed, typing animations, and more easter eggs than a Sunday morning. Built from scratch — no frameworks, no shortcuts.

### ☕ Dancakes Website
> A website for Dancakes Coffee & Bakery. Built with love, caffeine, and a vested interest in the business succeeding.
>
> [dancakesza.com](https://dancakesza.com/)

### 🧮 ChangeCalculator
> A C# .NET Core Web API that calculates optimal change denominations. Small project, clean code, zero bugs.* <br>
> *\*At the time of writing.*

### 🎮 Prompt Games
> A collection of quick vanilla JS games built in Cursor prompts — no frameworks, no build step. Play from the [games hub](games/).

| Game | Description |
|------|-------------|
| **Pipe Flow** | Rotate pipes so liquid reaches the exit. Fewer moves, higher score. |
| **Snake** | Classic arcade snake with smooth canvas animation, themes, grid settings, and pause. |
| **Minesweeper** | Classic minefield with three difficulties, timer, flags, chord reveal, and best times. |
| **Tetra Blocks** | Guideline-style falling blocks with 7-bag randomizer, ghost piece, hard drop, and line-clear animations. |
| **Ball Bash** | Slingshot physics puzzler — aim trajectory preview, collapse structures, defeat enemy balls. Matter.js. |

### ✂️ Cut Wise *(Work in Progress)*
> A tool designed for engineers. More details soon.

## Site Features

- **Responsive Design** — Looks good on everything from a 4K monitor to a phone held together by a screen protector
- **Live GitHub Activity** — Contribution grid, recent commits, and repositories pulled from the GitHub API with session caching
- **Scroll Animations** — Intersection Observer-powered slide-in and fade-in effects
- **Typing Animation** — A custom typewriter effect cycling through my roles (including "Superhero" and "Coffee-Powered Developer", because accuracy matters)
- **Expandable Work History** — Click-to-expand details with keyboard accessibility
- **Dark Theme** — Because light mode is for people who enjoy migraines
- **Easter Eggs** — I've hidden several throughout the site. Here's a few hints:
  - Try opening the dev console
  - Leave the tab and come back
  - Right-click the hero section
  - Click my profile photo. A lot.
  - Stay idle for 30 seconds
  - Double-click my name in the navbar
  - Scroll to the very bottom
  - Check the coffee counter ☕

## Architecture

```
Portfolio/
├── index.html              # Main page — single-page layout
├── style.css               # All styles — responsive, animated, themed
├── app.js                  # All interactivity — no dependencies
├── ChangeCalculator/       # Standalone sub-project
│   ├── index.html
│   ├── app.js
│   └── style.css
├── games/                  # Prompt games hub
│   ├── index.html          # Hub — lists all games
│   ├── hub.css
│   ├── hub.js
│   ├── pipe-flow/          # Pipe Flow — vanilla JS pipe puzzle
│   │   ├── index.html
│   │   ├── game.js
│   │   └── styles.css
│   ├── snake/              # Snake — classic arcade
│   │   ├── index.html
│   │   ├── game.js
│   │   └── styles.css
│   ├── minesweeper/        # Minesweeper — classic minefield
│   │   ├── index.html
│   │   ├── game.js
│   │   └── styles.css
│   ├── tetra-blocks/       # Tetra Blocks — falling blocks puzzle
│   │   ├── index.html
│   │   ├── game.js
│   │   ├── styles.css
│   │   └── README.md
│   └── ball-bash/          # Ball Bash — slingshot physics (Matter.js)
│       ├── index.html
│       ├── game.js
│       ├── levels.js
│       ├── styles.css
│       └── README.md
├── assets/
│   └── images/             # Project screenshots, icons, profile photos
├── docs/
│   ├── CODE_REVIEW_SUMMARY.md
│   └── release-notes/
├── .github/
│   └── workflows/
│       └── static.yml      # GitHub Pages deployment
├── CNAME                   # Custom domain config
├── VERSION                 # Semantic versioning
└── site.webmanifest        # PWA manifest
```

## Deployment

The site is deployed automatically to **GitHub Pages** via a GitHub Actions workflow. Every push to `main` triggers a deployment to [benjaminjoubert.co.za](https://benjaminjoubert.co.za).

No build step. No bundler. Just files on the internet, the way Tim Berners-Lee intended.

## Running Locally

```bash
# Clone the repository
git clone https://github.com/RoguePython/Portfolio.git

# Open in your browser
# That's it. There's no npm install. You're welcome.
```

## Version

**Current:** `v1.3.0`

See the [release notes](docs/release-notes/v1.3.0.md) for the latest changes.

## Contact

I'm always open to connecting — whether it's about a job opportunity, a collaboration, or just to talk about why tabs are superior to spaces.

- **Email:** [bendriejoubert@gmail.com](mailto:bendriejoubert@gmail.com)
- **LinkedIn:** [Benjamin Joubert](https://www.linkedin.com/in/benjamin-joubert-00bba7263/)
- **GitHub:** [RoguePython](https://github.com/RoguePython)
- **Website:** [benjaminjoubert.co.za](https://benjaminjoubert.co.za)

---

<div align="center">

*Built with HTML, CSS, JavaScript, and mass quantities of coffee.*

*If you scrolled all the way down here, you're hired.*

</div>
