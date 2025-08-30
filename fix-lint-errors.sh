#!/bin/bash

# Fix common undefined variable errors
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i \
  -e 's/_window/window/g' \
  -e 's/_document/document/g' \
  -e 's/_error\b/error/g' \
  -e 's/__error\b/error/g' \
  -e 's/_info\b/info/g' \
  -e 's/_domain\b/domain/g' \
  -e 's/_category\b/category/g' \
  -e 's/_ruleId\b/ruleId/g' \
  -e 's/_blockingTime\b/blockingTime/g' \
  -e 's/_url\b/url/g' \
  -e 's/_script\b/script/g' \
  -e 's/_rules\b/rules/g' \
  -e 's/_rule\b/rule/g' \
  -e 's/_limit\b/limit/g' \
  -e 's/\bargs\[/_args[/g' \
  -e 's/const \[url, _name, features\] = args/const [url] = args/g' \
  -e 's/\be\.target\b/e.target/g' \
  -e 's/\be\.preventDefault/e.preventDefault/g' \
  -e 's/\be\.stopPropagation/e.stopPropagation/g' \
  -e 's/\be\.stopImmediatePropagation/e.stopImmediatePropagation/g' \
  -e 's/_args\b/args/g' \
  -e 's/thisArg/_thisArg/g'

# Fix e is not defined errors by ensuring proper event parameter
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i \
  -e 's/addEventListener('\''click'\'', (_e)/addEventListener('\''click'\'', (e)/g' \
  -e 's/addEventListener("click", (_e)/addEventListener("click", (e)/g'

# Fix missing useCallback dependencies in React files
find src -name "*.tsx" | xargs sed -i \
  -e 's/}, \[\]);  \/\/ useCallback/}, []);/g'

echo "Common lint errors fixed. Run 'yarn lint' to check remaining issues."