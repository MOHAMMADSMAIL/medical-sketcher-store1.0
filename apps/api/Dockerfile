FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY prisma prisma
RUN npm install
RUN npx prisma generate --schema prisma/schema.prisma
COPY apps/api apps/api
RUN npm run build --workspace apps/api
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
CMD ["node","apps/api/dist/main.js"]
