# syntax=docker/dockerfile:1

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
FROM node:24-slim AS runtime
WORKDIR /app

# TeX Live, restricted to what template.tex actually loads. The full
# distribution is ~4 GB; this set stays under 500 MB.
RUN apt-get update && apt-get install -y --no-install-recommends \
      texlive-latex-base \
      texlive-latex-recommended \
      texlive-latex-extra \
      texlive-fonts-recommended \
      texlive-lang-italian \
 && rm -rf /var/lib/apt/lists/* /usr/share/doc/texlive-doc

ENV NODE_ENV=production \
    PORT=3000 \
    TEMPLATES_DIR=/app/src/documents \
    LATEX_TIMEOUT_MS=10000

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Templates and logo are read at runtime, so the build never traces them.
COPY --from=build /app/src/documents ./src/documents

# pdflatex parses untrusted input: never run it as root.
RUN useradd --system --uid 1001 eko && chown -R eko /app
USER eko

EXPOSE 3000
CMD ["node", "server.js"]