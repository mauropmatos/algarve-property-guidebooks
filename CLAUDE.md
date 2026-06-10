# Algarve Property Guidebooks

## Stack
Plain HTML, Google Sheets (live data), Vercel (hosting), GitHub (version control)

## Folder structure
- /clients/[property-slug]/index.html — one folder per property
- /assets/images/ — hero photos named [property-slug]-hero.jpg
- /_template/ — master template to duplicate for new properties

## Adding a new property
1. Duplicate /_template/index.html
2. Rename folder to property slug
3. Create a new Google Sheet from the master template
4. Update the Sheet ID in the new HTML file
5. Add hero photo to assets/images/
6. Push to GitHub, Vercel auto-deploys

## Design system
Font: Montserrat
Primary: #1AA3DC
Navy: #1C1C5C
Background: #FFFFFF
Card: #F8F9FB
Border: #E8EAEC
Grey: #9BA3AB
