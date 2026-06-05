---
name: OpenAPI YAML structure
description: New paths/schemas must be inserted in the correct sections, not appended to file end
---

The openapi.yaml file has this structure:
```
paths:
  /healthz: ...
  ...existing paths...
  ← NEW PATHS GO HERE (before components:)

components:
  schemas:
    HealthStatus: ...
    ...existing schemas...
    ← NEW SCHEMAS GO HERE (inside components/schemas:)
```

**Why:** Appending new path entries at the end of the file places them after `components:`, making YAML parsers interpret them as component properties and not path items. This causes Orval validation errors like "Property /my-path is not expected to be here".

**How to apply:** Use a Node.js script to find the `\ncomponents:\n` boundary, slice the file into paths-part and components-part, then insert new content into the correct section before writing back. Never use `cat >>` to append path definitions to openapi.yaml.
