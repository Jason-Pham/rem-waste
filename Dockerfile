# syntax=docker/dockerfile:1.6

# --- build stage -------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY ui/package.json ui/package-lock.json* ./
RUN npm install

COPY ui/ ./
RUN npm run build

# --- runtime stage -----------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

# Vite preview is enough for a static MSW-mocked demo — no backend needed.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/vite.config.ts ./vite.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json

EXPOSE 4173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
