# Setting up Vercel with GitHub Actions

To connect your GitHub Actions workflow to Vercel, you need the following tokens:

## Get Vercel Tokens

1. Install Vercel CLI locally: `npm i -g vercel`
2. Run `vercel login` and log in to your account
3. Run `vercel link` to link to your project
4. Get your tokens by running:
   ```bash
   vercel project ls
   ```
   (Note your project ID)

   ```bash
   vercel whoami
   ```
   (Note your organization ID)

5. Generate a token at https://vercel.com/account/tokens

## Set GitHub Secrets

In your GitHub repository:
1. Go to Settings > Secrets and variables > Actions
2. Add the following repository secrets:
   - `VERCEL_TOKEN`: The token you generated
   - `VERCEL_PROJECT_ID`: Your project ID
   - `VERCEL_ORG_ID`: Your organization ID
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
   - `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
   - `DATABASE_URL`: Your database connection string
   - `NEXTAUTH_SECRET`: A random string for NextAuth
   - `NEXTAUTH_URL`: Your site URL
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`: Email settings

After setting up these secrets, the workflow will automatically deploy your app with all environment variables configured. 