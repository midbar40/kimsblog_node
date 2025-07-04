# Node.js 22.16.0 버전 사용
FROM node:22.16.0-alpine AS builder

WORKDIR /app

# 패키지 파일들 먼저 복사 (의존성 캐싱을 위해)
COPY package*.json ./

# tsconfig.json 복사 (있다면)
COPY tsconfig.json ./

# 의존성 설치 (TypeScript 컴파일러 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# TypeScript 컴파일 (npm run build = tsc)
RUN npm run build

# 실행 단계 - 프로덕션용 경량 이미지
FROM node:22.16.0-alpine

WORKDIR /app

# curl 설치 (헬스체크용)
RUN apk add --no-cache curl

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 컴파일된 JavaScript 파일들 복사
COPY --from=builder /app/dist/ ./dist/

# 정적 파일들이 있다면 복사 (public, assets 등)
COPY --chown=appuser:nodejs public* ./

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# 파일 소유권 변경
RUN chown -R appuser:nodejs /app

# 사용자 권한 변경
USER appuser

# Express 서버 포트
EXPOSE 5000

# 헬스체크 추가 (Koyeb 필수)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# npm start 실행 (node dist/app.js)
ENTRYPOINT ["npm", "start"]