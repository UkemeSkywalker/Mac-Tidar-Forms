# Mac Tidar Forms

Create forms, share a link, and collect responses in a spreadsheet and on a dashboard.

## Stack

- Next.js (App Router and API routes) on Amplify Hosting, eu-west-1
- DynamoDB on-demand, single table
- Email and password accounts (scrypt, signed session cookie)
- Terraform in `infra/`

Amplify and on-demand DynamoDB bill per request, so the app costs close to nothing while idle.

## Run locally

```bash
npm install
npm run dev
```

With no `TABLE_NAME` set, data goes to a JSON file in `.data/`, so AWS isn't needed locally.

## Deploy

```bash
cd infra
terraform init
TF_VAR_github_access_token=<token> terraform apply
terraform output dns_records_for_namecheap
```

Add the two output records to Namecheap to serve the app at forms.mactidar.com. Amplify builds `master` on every push.

## Routes

- `/forms`: your forms
- `/forms/<id>/edit`: question builder
- `/forms/<id>/responses`: spreadsheet, Excel and CSV download
- `/forms/<id>/dashboard`: charts
- `/f/<id>`: public form
