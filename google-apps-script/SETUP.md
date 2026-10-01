# Contact form → Google Sheet

Sends portfolio contact-form messages straight to a Google Sheet, with an
email notification. Replaces the Express/MongoDB endpoint, so the form no
longer waits on Render to wake up.

## Setup

1. Create a new Google Sheet. Name it something like `Portfolio messages`.
2. In that sheet: **Extensions → Apps Script**.
3. Delete the stub `myFunction`, paste in everything from `Code.gs`, and save.
4. Check `NOTIFY_EMAIL` near the top is the address you want mail at. Set it to
   `''` if you'd rather not get an email per message.
5. **Deploy → New deployment**, then:
   - gear icon → **Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**  ← must be "Anyone", not "Anyone with Google account"
   - **Deploy**
6. Authorise when prompted. Google will warn the app is unverified — it's your
   own script, so **Advanced → Go to (project name)** and allow.
7. Copy the **Web app URL**. It ends in `/exec`.

Paste the URL in your browser; you should see `{"ok":true,...}`. That confirms
the deploy is live.

## Point the site at it

`frontend/.env`:

```
VITE_FORM_ENDPOINT=https://script.google.com/macros/s/AKfy.../exec
```

Set the same variable in Netlify under **Site configuration → Environment
variables**, then redeploy. With it unset the form falls back to the old
Express endpoint, so nothing breaks before you've deployed the script.

## After changing Code.gs

Apps Script serves the last *deployed* version, not the last saved one.
**Deploy → Manage deployments → pencil icon → Version: New version → Deploy.**
Keeping the same deployment keeps the same URL.

## Why the request is `text/plain`

Apps Script web apps can't answer a CORS preflight. Posting JSON with a
`Content-Type: application/json` header triggers one and the request fails.
Sending the same JSON body as `text/plain` keeps it a "simple" request, so the
browser skips the preflight. The script still parses it with `JSON.parse`.

## Notes

- Google caps `MailApp` at 100 emails/day on a free account. Far beyond what a
  portfolio form will see, but that's the ceiling.
- There's no rate limiting. The honeypot field catches most bots; if you start
  getting spam, add a reCAPTCHA or go back to the Express endpoint, which does
  rate limit.
- Submissions land in the `Messages` tab with a frozen, bold header row.
