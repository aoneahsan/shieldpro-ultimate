#!/bin/bash

# Fix remaining ESLint warnings

echo "Fixing remaining ESLint warnings..."

# Fix unused variables by prefixing with underscore
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s/} catch (error) {/} catch {/g" \
  -e "s/} catch (_error) {/} catch {/g" \
  -e "s/} catch (_e) {/} catch {/g" \
  -e "s/} catch (err) {/} catch {/g" \
  -e "s/} catch (_err) {/} catch {/g" \
  {} \;

# Fix specific patterns
sed -i 's/\(sender\)\([^_]\)/\_sender\2/g' src/content/image-swap.ts
sed -i 's/\(keyword\)\([^_]\)/\_keyword\2/g' src/content/image-swap.ts

# Run prettier to clean up formatting
yarn format

echo "Running lint check..."
yarn lint

echo "Fix complete!"