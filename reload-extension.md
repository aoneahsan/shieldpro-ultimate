# How to Properly Reload the Extension

## Steps to Fix the Connection Error:

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)

2. **Remove and Reload the Extension**
   - Find "ShieldPro Ultimate" in the list
   - Click the "Remove" button
   - Click "Load unpacked" again
   - Select the `dist/` folder

3. **Check Service Worker Status**
   - After loading, look for "Service Worker" link next to the extension
   - Click "Inspect views: service worker" to see if there are any errors
   - The service worker console will show any initialization errors

4. **Alternative: Just Reload**
   - If the extension is already loaded, click the refresh icon (↻) on the extension card
   - This reloads the service worker and all extension components

5. **Check for Errors**
   - Click on "Errors" button if it appears (red text)
   - Open the browser console (F12) while the popup is open
   - Check for any error messages

## Common Issues and Solutions:

### Issue: "Could not establish connection. Receiving end does not exist"
**Solution**: The service worker needs to be running. Reload the extension.

### Issue: Service worker inactive
**Solution**: Click the refresh button on the extension card in chrome://extensions/

### Issue: Manifest errors
**Solution**: Check the console for specific manifest issues

## Quick Fix Command:
After reloading, the extension should work properly. The error occurs when:
- The extension was just installed but service worker hasn't started
- Chrome killed the service worker due to inactivity
- There was an error during service worker initialization

## Verify It's Working:
1. Click the extension icon
2. The popup should open without errors
3. Stats should load properly
4. Toggle switch should work