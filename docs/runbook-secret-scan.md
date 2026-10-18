# Runbook: secret scan

CI runs gitleaks 8.30.1 over every commit in the pushed range (`secrets` job in
`.github/workflows/ci.yml`), with `.gitleaks.toml`. That config extends the default rules and
allowlists the JWT-shaped test fixtures by their exact shape.

## Scanning the whole history locally

```bash
docker run --rm -v "$PWD":/repo:ro ghcr.io/gitleaks/gitleaks:v8.30.1 git /repo -c /repo/.gitleaks.toml --redact
```

## A new fixture gets flagged

Add an entry to `.gitleaks.toml` that matches that string and nothing wider. A path-wide exception
would also hide a real key committed to the same file.
