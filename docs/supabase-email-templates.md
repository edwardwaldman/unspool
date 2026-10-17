# Supabase email templates

Sign-up in the app is email + password, confirmed with a **6-digit code** typed into the sign-up popup
(`supabase.auth.verifyOtp({ email, token, type: "signup" })`). The visitor's picked file stays in the
page while they do this, so the confirmation email must carry the code itself (`{{ .Token }}`), not
only a link.

## Dashboard settings (project `ydlfimhjvvxejdpjgxuv`)

1. **Authentication → Sign In / Providers → Email**
   - **Confirm email: ON.** Without it `signUp` returns a session straight away and no code is sent
     (the app handles that too: it skips the code step).
   - **Email OTP length: 6.** The popup has exactly six boxes. 6 is the Supabase default, but check it:
     if it was changed to 8, codes won't fit.
   - **Email OTP expiration:** 3600 seconds (default) is fine. The popup's "Resend code" has a 30 s
     cooldown, matching Supabase's per-address resend limit.
2. **Authentication → Email Templates → Confirm signup**: paste the subject and HTML below and save.
3. **Authentication → Emails → SMTP Settings**: enable custom SMTP with Resend (Supabase's built-in
   sender is rate-limited to a few emails an hour and is not meant for production):

   | Field        | Value                                   |
   | ------------ | --------------------------------------- |
   | Host         | `smtp.resend.com`                       |
   | Port         | `465`                                   |
   | Username     | `resend`                                |
   | Password     | your Resend API key (`re_...`)          |
   | Sender email | `no-reply@unspool.cc` (a domain verified in Resend) |
   | Sender name  | `Unspool`                               |

   Then raise **Authentication → Rate Limits → emails sent per hour** to suit your traffic.

## Google sign-in

The sign-up popup also offers **Continue with Google**. If the visitor has already picked a file, the
app parks it in IndexedDB, sends them through Google with the return path `/?resume=1`, and uploads
the file automatically once they're back and signed in.

1. **Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID**
   (type **Web application**). Set up the OAuth consent screen first if prompted.
   - Authorized JavaScript origins: `https://unspool.cc`
   - Authorized redirect URI: `https://ydlfimhjvvxejdpjgxuv.supabase.co/auth/v1/callback`
2. **Supabase → Authentication → Sign In / Providers → Google**: enable it and paste the client ID
   and client secret from step 1.
3. **Supabase → Authentication → URL Configuration**:
   - Site URL: `https://unspool.cc`
   - Redirect URLs: `https://unspool.cc/**` and `https://*.vercel.app/**` (preview deployments)

## Confirm signup

**Subject**

```
Your Unspool code: {{ .Token }}
```

**Body (HTML)**

```html
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0f1d18;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1d18;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#152820;border:1px solid #24402f;border-top:2px solid #d3f05a;">
            <tr>
              <td style="padding:32px 32px 8px;font-family:Helvetica,Arial,sans-serif;color:#e9f0e4;">
                <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;">unspool</div>
                <h1 style="margin:24px 0 8px;font-size:22px;line-height:1.2;font-weight:700;color:#e9f0e4;">Your sign-up code</h1>
                <p style="margin:0;font-size:15px;line-height:1.5;color:#8ea595;">
                  Enter this code in the Unspool window to confirm your email and start unspooling your document.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px;">
                <div style="display:inline-block;padding:16px 24px;border:1px solid #d3f05a;font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#d3f05a;">{{ .Token }}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#8ea595;">
                The code expires in 1 hour. If you didn't try to sign up for Unspool with {{ .Email }}, you can ignore this email.
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#8ea595;">Unspool · unspool.cc</p>
        </td>
      </tr>
    </table>
  </body>
</html>
```

`{{ .Token }}` is the 6-digit code and `{{ .Email }}` the address it was sent to. Don't add
`{{ .ConfirmationURL }}`: opening a link confirms the account in a new tab, away from the popup
that's holding the visitor's file.
