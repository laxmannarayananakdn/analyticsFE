# Steps to Get and Set Superset API Key

## Current Status
✅ Key Vault secret exists: `SupersetApiKey`  
❌ Value is still placeholder: `"your-api-key-here"`  
➡️ **Action Required**: Get real API key from Superset and update Key Vault

---

## Step 1: Access Your Superset Instance

1. **Get your Superset URL**
   - Check your Application Gateway URL or Superset service URL
   - It should be something like: `https://superset-xxxxx.azurecloud.net` or your custom domain
   - You can find this in:
     - Azure Portal → Application Gateway → Frontend IPs
     - Or your Superset service configuration

2. **Log into Superset**
   - Open the URL in your browser
   - Log in with your admin credentials

---

## Step 2: Create API Key in Superset

### Option A: Via Superset UI (If Available)

1. **Navigate to API Keys**
   - Click your **profile icon** (top right corner)
   - Look for **"Settings"** or **"Security"** menu
   - Click **"API Keys"** or **"Security" → "API Keys"**

2. **Create New API Key**
   - Click **"+ Add API Key"** or **"Create API Key"** button
   - Fill in:
     - **Name**: `Frontend Integration Key`
     - **Description**: `API key for frontend dashboard embedding`
   - Click **"Create"** or **"Save"**

3. **Copy the API Key**
   - ⚠️ **CRITICAL**: The key will be shown only once!
   - Copy the entire key (it's a long JWT token starting with `eyJ...`)
   - Save it temporarily in a secure place

### Option B: Via Superset CLI (If UI Not Available)

If you don't see the API Keys option in the UI, use the CLI:

1. **Access Superset Pod**
   ```bash
   # List Superset pods
   kubectl get pods -n <your-namespace> | grep superset
   
   # Access the pod (replace with actual pod name)
   kubectl exec -it <superset-pod-name> -n <your-namespace> -- bash
   ```

2. **Create API Key**
   ```bash
   # Inside the pod
   flask fab create-api-key \
     --name "Frontend Integration" \
     --description "API key for frontend dashboard embedding"
   ```

3. **Copy the Generated Key**
   - The command will output the API key
   - Copy it immediately

### Option C: Via Superset REST API

If you have access to Superset API with admin credentials:

```bash
# First, get an access token
curl -X POST "https://your-superset-url/api/v1/security/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password",
    "provider": "db",
    "refresh": true
  }'

# Use the access_token from response to create API key
curl -X POST "https://your-superset-url/api/v1/security/api_key/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Frontend Integration",
    "description": "API key for frontend dashboard embedding"
  }'
```

---

## Step 3: Update Azure Key Vault with Real API Key

Once you have the real API key, update the Key Vault secret:

### Using Azure CLI:

```bash
az keyvault secret set \
  --vault-name aks-superset-vault \
  --name SupersetApiKey \
  --value "PASTE_YOUR_REAL_API_KEY_HERE"
```

Replace `PASTE_YOUR_REAL_API_KEY_HERE` with the actual API key you copied from Superset.

### Using Azure Portal:

1. Go to **Azure Portal** → **Key Vaults** → `aks-superset-vault`
2. Click **"Secrets"** in the left menu
3. Click on **"SupersetApiKey"**
4. Click **"New version"** or **"Edit"**
5. Paste your real API key in the **"Value"** field
6. Click **"Create"** or **"Save"**

### Verify the Update:

```bash
az keyvault secret show \
  --vault-name aks-superset-vault \
  --name SupersetApiKey \
  --query value -o tsv
```

This should now show your real API key (not "your-api-key-here").

---

## Step 4: Verify App Service Configuration

1. **Check App Service Settings**
   - Go to Azure Portal → Your App Service → **Configuration** → **Application settings**
   - Verify `VITE_SUPERSET_API_KEY` is set to:
     ```
     @Microsoft.KeyVault(SecretUri=https://aks-superset-vault.vault.azure.net/secrets/SupersetApiKey/)
     ```

2. **Restart App Service** (if needed)
   - Go to **Overview** → Click **"Restart"**
   - This ensures the new Key Vault value is loaded

---

## Step 5: Test the Integration

1. **Access Your Frontend**
   - Navigate to your App Service URL
   - Go to `/superset` page

2. **Check Browser Console**
   - Open DevTools (F12) → Console
   - Look for any authentication errors

3. **Check Network Tab**
   - Open DevTools → Network
   - Look for requests to Superset
   - Check if they have proper Authorization headers

---

## Troubleshooting

### "Invalid API Key" Error

- Verify the API key in Key Vault is correct (not the placeholder)
- Check if the API key is still active in Superset
- Ensure App Service has access to Key Vault

### "Cannot Connect to Superset" Error

- Verify `VITE_SUPERSET_URL` is set correctly in App Service
- Test the Superset URL directly in browser
- Check network connectivity from App Service to Superset

### "Authentication Failed" Error

- Verify the API key hasn't expired
- Check if the API key has proper permissions in Superset
- Try creating a new API key

---

## Security Reminder

- ✅ API keys are sensitive - never commit them to Git
- ✅ Store only in Azure Key Vault
- ✅ Use Key Vault references in App Service (not direct values)
- ✅ Rotate API keys periodically
- ✅ Monitor Key Vault access logs
