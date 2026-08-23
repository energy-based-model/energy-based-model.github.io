# Energy-Based Models website

This folder contains the final root-level documents for the academic overview at <https://energy-based-model.github.io/>.

## Files

- `index.html` — complete page, with inline CSS and JavaScript
- `robots.txt` — crawler instructions and sitemap location
- `sitemap.xml` — canonical root page and linked project pages

## Deploying to GitHub Pages

Copy these three public files to the root of the existing `energy-based-model.github.io` repository. Keep the repository's current `files/` directory: publication images and videos in `index.html` use relative paths such as `files/paper/25-eqm/eqm.png`. The thesis thumbnail is loaded from `yilundu.github.io`.

The page has no JavaScript or CSS build step. After publishing, confirm that:

1. <https://energy-based-model.github.io/> loads the revised overview.
2. Publication images and videos still resolve from the retained `files/` directory.
3. <https://energy-based-model.github.io/robots.txt> and <https://energy-based-model.github.io/sitemap.xml> are publicly accessible.

The experimental overview figure is intentionally not included. The final page uses the clearer text-and-equation explanation in the opening section.
