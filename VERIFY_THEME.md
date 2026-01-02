# Verifying rms-auth-theme-plugin Theme in Keycloak

## After Building the Theme JAR

Once you've built the theme using `npm run build-keycloak-theme`, follow these steps to verify it's properly registered:

## 1. Check the JAR File Structure

The JAR should contain:
```
META-INF/
  └── keycloak-themes.json  (defines the theme name)
theme/
  └── rms-auth-theme-plugin/
      ├── login/
      │   ├── theme.properties
      │   └── templates/
      │       └── login.ftl
      └── account/
          ├── theme.properties
          └── templates/
```

## 2. Verify Theme Name in JAR

Extract and check `META-INF/keycloak-themes.json`:
```json
{
  "themes": [{
    "name": "rms-auth-theme-plugin",
    "types": ["login", "account"]
  }]
}
```

**The theme name MUST be exactly: `rms-auth-theme-plugin`** (as defined in `src/kc.gen.tsx`)

## 3. Copy JAR to Providers Folder

Copy the generated JAR from `dist_keycloak/` to:
```
C:\Users\shiva\cursor_workspace\keycloak_with_plugins_deploy\providers\
```

The JAR name should be something like:
- `keycloak-theme-for-kc-26.2-and-above.jar` (if using Keycloak 26.2+)
- Or whatever keycloakify generates

## 4. Verify JAR is in Providers Folder

```powershell
cd C:\Users\shiva\cursor_workspace\keycloak_with_plugins_deploy
dir providers\*.jar
```

You should see:
- `keycloak-phone-provider.jar`
- `keycloak-phone-provider-msg91.jar`
- `keycloak-theme-for-kc-26.2-and-above.jar` (or your theme JAR)

## 5. Restart Keycloak

After placing the JAR in the providers folder, restart Keycloak to load the theme.

## 6. Check Keycloak Logs

Look for theme loading messages:
```
INFO  [org.keycloak.theme] Theme loaded: rms-auth-theme-plugin
```

## 7. Verify in Admin Console

1. Log into Keycloak Admin Console
2. Select your realm (e.g., "gateway")
3. Go to **Realm Settings** → **Themes**
4. Check the **Login theme** dropdown
5. You should see `rms-auth-theme-plugin` in the list

## 8. If Theme Still Doesn't Appear

### Check JAR Contents:
```powershell
# Extract and inspect the JAR
cd C:\Users\shiva\cursor_workspace\keycloak_with_plugins_deploy\providers
jar -xf keycloak-theme-for-kc-26.2-and-above.jar
type META-INF\keycloak-themes.json
```

### Verify Theme Name Matches:
- JAR: `META-INF/keycloak-themes.json` → `"name": "rms-auth-theme-plugin"`
- Code: `src/kc.gen.tsx` → `ThemeName = "rms-auth-theme-plugin"`

### Check for login.ftl:
```powershell
dir theme\rms-auth-theme-plugin\login\templates\login.ftl
```

## Common Issues

1. **Theme name mismatch**: The name in `keycloak-themes.json` must exactly match `rms-auth-theme-plugin`
2. **Missing templates**: Ensure `login.ftl` exists in the JAR
3. **JAR not in providers folder**: Must be in `/opt/keycloak/providers` (mapped from `./providers`)
4. **Keycloak not restarted**: Themes are loaded at startup
5. **Wrong Keycloak version**: Ensure the JAR matches your Keycloak version

## Quick Verification Command

After building, verify the JAR contains the theme:
```powershell
cd C:\Users\shiva\eclipse-workspace\rms-auth-theme-plugin
jar -tf dist_keycloak\keycloak-theme-for-kc-26.2-and-above.jar | findstr "keycloak-themes.json"
jar -tf dist_keycloak\keycloak-theme-for-kc-26.2-and-above.jar | findstr "login.ftl"
```

