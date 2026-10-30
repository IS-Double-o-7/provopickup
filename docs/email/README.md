# Sign-up confirmation email

Supabase's built-in confirmation email is plain, comes from "Supabase Auth", and is
rate-limited to a few emails per hour, so it's meant for testing only. This folder holds
a Rally Provo version.

| File | What it is |
|---|---|
| `confirm-signup.html` | The email body for Supabase's **Confirm signup** template |
| `rally-ball.png` | The logo in the email header, served from GitHub Pages at `https://is-double-o-7.github.io/provopickup/docs/email/rally-ball.png` |

Nothing here takes effect until someone with access to the Supabase dashboard does the
steps below. None of them change the database.

## 1. Use the Rally Provo template

1. Supabase dashboard → project **rvaopevfrhybqnppuemq** → **Authentication** →
   **Emails** → **Templates** → **Confirm signup**.
2. **Subject:** `Confirm your email to start playing on Rally Provo`
3. **Message body:** paste the whole of `confirm-signup.html`.
4. Save. Supabase fills in `{{ .ConfirmationURL }}` and `{{ .Email }}` when it sends.

## 2. Make the link come back to the site

**Authentication → URL Configuration**:

- **Site URL:** `https://is-double-o-7.github.io/provopickup/`
- **Redirect URLs:** add `https://is-double-o-7.github.io/provopickup/**` and, for
  local testing, `http://localhost:8000/**`

The app asks Supabase to send people back to the page they signed up from. If that
address isn't listed here, Supabase uses the Site URL instead, and the link can land on
a page that doesn't exist.

## 3. Send from Rally Provo instead of Supabase (custom SMTP)

The template changes what the email says. Who it's **from** comes from the email service
that sends it. With Supabase's built-in sender it's always "Supabase Auth"
(`noreply@mail.app.supabase.io`) and limited to a few emails an hour. To send as
"Rally Provo", connect an email service under **Authentication → Emails → SMTP
Settings**.

Two free options that don't need the team to own a domain:

| Service | Sender address | Free limit | Setup |
|---|---|---|---|
| **Gmail** (a team account such as rallyprovo@gmail.com) | that Gmail address | about 500 a day | Turn on 2-Step Verification for the account, create an **App password**, then in Supabase: host `smtp.gmail.com`, port `465`, username = the Gmail address, password = the app password |
| **Brevo** | any address you verify with them | 300 a day | Create an account, verify the sender address, create an **SMTP key**, then in Supabase: host `smtp-relay.brevo.com`, port `587`, username and password from Brevo's SMTP page |

In both cases set **Sender name** to `Rally Provo`.

**Keep the password out of the repo and out of chat.** Type the app password or SMTP key
only into Supabase's SMTP form. AGENTS.md section 12 applies: never put it in GitHub,
Trello, FigJam or a message.

After connecting SMTP, check **Authentication → Rate Limits → emails sent per hour**.
Supabase's default for custom SMTP is low; raise it to fit the class demo.

## 4. Test it

Sign up on the live site with an address you can check. The email should come from
Rally Provo, look like the template, and the button should land back on
`https://is-double-o-7.github.io/provopickup/` signed in. Then mark **L3** Complete in
the main README's Behavioral Requirements.
