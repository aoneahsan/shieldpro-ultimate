#!/bin/bash

# This script fixes the popup.html and options.html files after build
# Run this after every build to ensure the HTML files are correct

echo "Fixing HTML files in dist folder..."

# Fix popup.html
cat > dist/popup.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShieldPro Ultimate</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 400px;
      min-height: 500px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: white;
      opacity: 1;
    }
    body.dark {
      background-color: #111827;
    }
    #root {
      width: 100%;
      height: 100%;
    }
  </style>
  <script src="theme-loader.js"></script>
  <script type="module" crossorigin src="popup.js"></script>
  <link rel="modulepreload" crossorigin href="assets/youtube.DWxOQNjk.js">
  <link rel="modulepreload" crossorigin href="assets/storage.D7aoBfUR.js">
  <link rel="stylesheet" crossorigin href="assets/youtube.css">
</head>
<body class="popup">
  <div id="root"></div>
</body>
</html>
EOF

# Fix options.html
cat > dist/options.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShieldPro Ultimate - Settings</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: #f5f5f5;
      opacity: 1;
    }
    .dark body {
      background: #111827;
    }
    #root {
      width: 100%;
      min-height: 100vh;
    }
  </style>
  <script src="theme-loader.js"></script>
  <script type="module" crossorigin src="options.js"></script>
  <link rel="modulepreload" crossorigin href="assets/youtube.DWxOQNjk.js">
  <link rel="modulepreload" crossorigin href="assets/auth.service.BEW3isC_.js">
  <link rel="modulepreload" crossorigin href="assets/storage.D7aoBfUR.js">
  <link rel="stylesheet" crossorigin href="assets/youtube.css">
  <link rel="stylesheet" crossorigin href="assets/options.css">
</head>
<body>
  <div id="root"></div>
</body>
</html>
EOF

echo "✅ HTML files fixed successfully!"
echo ""
echo "Files updated:"
echo "  - dist/popup.html"
echo "  - dist/options.html"
echo ""
echo "The extension should now work properly."