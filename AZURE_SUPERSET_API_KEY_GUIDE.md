# How to Get Superset API Key on Azure Deployment

## Overview

Since your Superset is deployed on Azure (AKS), you have several options for authentication. This guide covers all methods.

## Method 1: Create API Key in Superset UI (Recommended)

### Steps:

1. **Access Your Superset Instance**
   - Navigate to your Superset URL (via Application Gateway)
   - Example: `https://superset.yourdomain.com` or your Application Gateway URL
   - Log in with your admin credentials

2. **Navigate to API Keys**
   - Click on your **profile icon** (top right)
   - Go to **Settings** → **API Keys** (or **Security** → **API Keys**)
   - If you don't see this option, you may need to enable it in Superset configuration

3. **Create New API Key**
   - Click **"+ Add API Key"** or **"Create API Key"**
   - Fill in:
     - **Name**: e.g., "Frontend Integration Key"
     - **Description**: Optional description
   - Click **"Create"** or **"Save"**

4. **Copy the API Key**
   - ⚠️ **IMPORTANT**: Copy the key immediately - it will only be shown once!
   - The key will look something like: `eyJ0eXAiOiJKV1QiLCJhbGc...` (JWT token)

5. **Store in Azure Key Vault**
   - Go to Azure Portal → Key Vault (`aks-superset-vault`)
   - Create a new secret:
     - **Name**: `SupersetApiKey` (or `SupersetFrontendApiKey`)
     - **Value**: Paste your API key
     - Click **"Create"**

6. **Reference in App Service**
   - Go to your App Service → **Configuration** → **Application settings**
   - Add new setting:
     - **Name**: `VITE_SUPERSET_API_KEY`
     - **Value**: Reference Key Vault secret: `@Microsoft.KeyVault(SecretUri=https://aks-superset-vault.vault.azure.net/secrets/SupersetApiKey/)`
   - Or directly paste the key (less secure, but simpler for testing)

## Method 2: Create API Key via Superset CLI (If UI Not Available)

If the API key option is not available in the UI, you can create it via CLI:

### Steps:

1. **Access Superset Pod/Container**
   ```bash
   # Get pod name
   kubectl get pods -n <your-namespace> | grep superset
   
   # Access the pod
   kubectl exec -it <superset-pod-name> -n <your-namespace> -- bash
   ```

2. **Create API Key via Flask CLI**
   ```bash
   # Inside the container
   flask fab create-api-key \
     --name "Frontend Integration" \
     --description "API key for frontend integration"
   ```

3. **Copy the Generated Key**
   - The command will output the API key
   - Copy it immediately

4. **Store in Azure Key Vault** (same as Method 1, step 5)

## Method 3: Use OAuth/Access Token (Alternative)

If API keys are not available, you can use OAuth tokens:

### Steps:

1. **Configure OAuth in Superset** (if not already done)
   - This requires Azure AD setup
   - See your deployment documentation

2. **Get Access Token**
   - Use Azure AD to get an access token
   - Use this token instead of API key

3. **Update Frontend Service**
   - Modify `SupersetService.ts` to use OAuth token instead of API key

## Method 4: Use Username/Password (Development Only)

For development/testing, you can use username/password:

### Steps:

1. **Get Superset Admin Credentials**
   - These should be stored in Azure Key Vault
   - Secret name: `SupersetAdminPassword` or similar

2. **Set Environment Variables in App Service**
   - Go to App Service → **Configuration** → **Application settings**
   - Add:
     - `VITE_SUPERSET_USERNAME`: `admin` (or your username)
     - `VITE_SUPERSET_PASSWORD`: Reference from Key Vault or set directly

   ⚠️ **Warning**: This is less secure and not recommended for production!

## Recommended Azure Setup (Production)

### Step 1: Store API Key in Azure Key Vault

```bash
# Using Azure CLI
az keyvault secret set \
  --vault-name aks-superset-vault \
  --name SupersetApiKey \
  --value "your-api-key-here"
```

### Step 2: Configure App Service to Use Key Vault

1. **Enable Managed Identity** on your App Service
   - Go to App Service → **Identity** → **System assigned** → **On** → **Save**

2. **Grant Key Vault Access**
   - Go to Key Vault → **Access policies** → **Add Access Policy**
   - Select your App Service's Managed Identity
   - Grant **Get** permission for secrets
   - Click **Add** → **Save**

3. **Reference in App Service Configuration**
   - Go to App Service → **Configuration** → **Application settings**
   - Add:
     ```
     Name: VITE_SUPERSET_API_KEY
     Value: @Microsoft.KeyVault(SecretUri=https://aks-superset-vault.vault.azure.net/secrets/SupersetApiKey/)
     ```
   - Click **Save**

### Step 3: Set Superset URL

Also configure the Superset URL:

```
Name: VITE_SUPERSET_URL
Value: https://your-application-gateway-url.azurecloud.net
```

Or if using custom domain:
```
Value: https://superset.yourdomain.com
```

## Verification

1. **Check App Service Logs**
   - Go to App Service → **Log stream** or **Logs**
   - Look for any Superset connection errors

2. **Test in Browser**
   - Navigate to your frontend → `/superset`
   - Check browser console for errors
   - Try loading a dashboard

3. **Check Network Tab**
   - Open browser DevTools → Network
   - Look for requests to Superset
   - Check if authentication headers are present

## Troubleshooting

### "API Key not found" or "Invalid API Key"

1. **Verify Key Vault Secret**
   ```bash
   az keyvault secret show --vault-name aks-superset-vault --name SupersetApiKey
   ```

2. **Check App Service Configuration**
   - Ensure the Key Vault reference is correct
   - Verify Managed Identity has access

3. **Check Superset API Key**
   - Log into Superset
   - Verify the API key still exists and is active
   - Create a new one if needed

### "Cannot connect to Superset"

1. **Verify Superset URL**
   - Test the URL in browser: `https://your-superset-url/api/v1/security/csrf_token/`
   - Should return JSON response

2. **Check Network Connectivity**
   - App Service should be able to reach Application Gateway
   - Check firewall rules

3. **Check CORS Settings**
   - Superset needs to allow requests from your App Service domain
   - Configure in Superset's `superset_config.py`

## Security Best Practices

1. ✅ **Use Key Vault** for storing secrets
2. ✅ **Use Managed Identity** for Key Vault access
3. ✅ **Rotate API keys** periodically
4. ✅ **Use HTTPS** for all Superset communication
5. ✅ **Limit API key permissions** in Superset
6. ❌ **Never commit** API keys to Git
7. ❌ **Don't use** username/password in production

## Next Steps

1. Create API key in Superset
2. Store in Azure Key Vault
3. Configure App Service to reference Key Vault
4. Test the integration
5. Monitor logs for any issues
