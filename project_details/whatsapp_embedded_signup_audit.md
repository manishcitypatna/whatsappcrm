# WhatsApp Embedded Signup Audit & Implementation Plan

## 1. Existing WhatsApp Integration Architecture

### Manual Configuration Architecture
- **UI**: [whatsapp-config.tsx](file:///Users/manish/Documents/wcrm/src/components/settings/whatsapp-config.tsx) provides a manual form for `Phone Number ID`, `WABA ID`, `Access Token`, `Verify Token`, and `2FA PIN`.
- **API**: `POST /api/whatsapp/config` handles verification, encryption, and registration.
- **Encryption**: Tokens are encrypted at rest using AES-256-GCM in [encryption.ts](file:///Users/manish/Documents/wcrm/src/lib/whatsapp/encryption.ts).
- **Tenancy**: The `whatsapp_config` table is account-scoped via `account_id`.
- **Meta Helpers**: [meta-api.ts](file:///Users/manish/Documents/wcrm/src/lib/whatsapp/meta-api.ts) contains low-level helpers for sending messages, registering numbers, and syncing templates.

### Existing OAuth/Meta/Facebook Integration
- **Discovered**: No existing Facebook Login or OAuth integration was found.
- **SDKs**: No Meta/Facebook SDKs are currently included in [package.json](file:///Users/manish/Documents/wcrm/package.json).
- **Callback Routes**: No OAuth callback routes currently exist.

### Existing Webhook Routes
- **Verification**: `GET /api/whatsapp/webhook` handles Hub verification.
- **Ingestion**: `POST /api/whatsapp/webhook` handles inbound messages, status updates, and template changes.

---

## 2. Embedded Signup Feasibility Audit

**Result: YES**

The application can support Meta Embedded Signup. The existing backend infrastructure (encryption, account-based tenancy, Meta API helpers) is already designed to handle the data that Embedded Signup provides.

### Why?
- We already have the table structure to store WABA IDs, Phone IDs, and Access Tokens.
- We already have the encryption logic to protect these tokens.
- We already have the account-based tenancy model to ensure teammates share the same connection.

---

## 3. Meta Requirements Checklist

| Requirement | Status | Description |
| :--- | :--- | :--- |
| **Meta App** | **READY** | Assumed to exist for manual integration. |
| **WhatsApp Product** | **READY** | Assumed to exist for manual integration. |
| **Facebook Login for Business** | **MISSING** | Must be added to the Meta App. |
| **Embedded Signup Configuration** | **MISSING** | Must be configured in Meta App settings. |
| **Redirect URI** | **MISSING** | Need to add `/settings/whatsapp/callback` or similar to Meta App. |
| **App Domains** | **READY** | Assumed to be configured. |
| **Business Verification** | **REQUIRED** | Required by Meta for production use of Embedded Signup. |
| **App Review Permissions** | **REQUIRED** | `whatsapp_business_messaging` and `whatsapp_business_management`. |
| **System User Setup** | **MISSING** | Required for permanent token flow (if used). |
| **Webhook Configuration** | **READY** | Already implemented and functional. |
| **Permanent Token Flow** | **MISSING** | Requires backend token exchange logic. |

---

## 4. Target User Experience Design

### New Settings UI
- **Primary Action**: A "Connect WhatsApp" button using the Meta branding.
- **Advanced Setup**: A toggle or accordion below the primary action containing the existing manual configuration form. This ensures power users can still manually enter tokens.

### The Connection Flow
1. User clicks **Connect WhatsApp**.
2. Meta Embedded Signup popup opens.
3. User selects their Business Portfolio, WABA, and Phone Number.
4. Meta returns an `accessToken` and `code` to the callback.
5. CRM backend:
   - Exchanges the code for a long-lived token.
   - Fetches the WABA ID and Phone Number ID associated with the token.
   - Automatically saves the configuration to the database.
6. UI refreshes to show "Connected" status.

---

## 5. Implementation Plan

### Phase 1: Meta App Configuration
- Add **Facebook Login for Business** to the Meta App.
- Configure the **Embedded Signup** settings.
- Add authorized **Redirect URIs**.

### Phase 2: Backend Infrastructure
- **Token Exchange**: Implement logic to exchange the Meta code for a long-lived token.
- **Discovery API**: Implement logic to fetch WABA and Phone details from Meta using a token.
- **Permanent Tokens**: Implement a flow to convert the user's token into a System User token (optional but recommended for stability).

### Phase 3: Frontend Integration
- **Facebook SDK**: Load the SDK in the client-side layout or settings page.
- **Connect Button**: Implement the `FB.login` call with appropriate scopes (`whatsapp_business_management`, `whatsapp_business_messaging`).
- **Callback Handling**: Process the response from the Meta popup.

### Phase 4: UI/UX Refinement
- Update [whatsapp-config.tsx](file:///Users/manish/Documents/wcrm/src/components/settings/whatsapp-config.tsx) to show the new "Connect" button.
- Move manual fields into an "Advanced Setup" section.

---

## 6. Security Considerations
- **Token Protection**: Continue using AES-256-GCM for all stored tokens.
- **State Validation**: Use the `state` parameter in OAuth to prevent CSRF.
- **System Users**: Prefer System User tokens over user tokens to prevent connection breaks when a user's password changes or they leave the business.

## 7. Migration Strategy
- No data migration is required. Existing manual configurations will continue to work.
- The UI will simply provide a more streamlined way to populate the same database fields.
