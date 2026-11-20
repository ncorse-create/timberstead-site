# Timberstead website

Static site for the Timberstead iPhone game, served by GitHub Pages: home, support, and privacy policy. No build step.

Preview locally with any static server, from this folder:

```bash
python3 -m http.server 8080
```

## App Store link

`site-config.js` is the only place the store URL lives. Leave `appStoreUrl` as an empty string until the listing is live — the site shows “Coming soon to the App Store”. When you have the URL, set it to the full `https://` link and every badge becomes a real App Store link.

## Screenshots

Gallery frames are `img/gallery/01` through `10`, each as `.avif`, `.webp`, and `.jpg`, plus a smaller `-sm` `.avif` and `.webp`. Replace those files together to swap in a new round, then update the alt text and `data-title` values in `index.html` if the baked-in captions change. Hero plates are `img/hero/`, and the four season bands are `img/seasons/`.
