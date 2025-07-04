# Node.js 22.16.0 버전 사용 - tsx 직접 실행 방식
FROM node:22.16.0-alpine

WORKDIR /app

# curl 설치 (헬스체크용)
RUN apk add --no-cache curl

# 패키지 파일들 복사
COPY package*.json ./

# tsconfig.json 복사 (tsx가 TypeScript 설정을 참조할 수 있음)
COPY tsconfig.json ./

# Prisma 스키마 복사 (prisma generate를 위해 필요)
COPY prisma/ ./prisma/

# 모든 의존성 설치
RUN npm ci

# Prisma 클라이언트 생성 (기존 DB 스키마 기반)
# 주의: db pull은 하지 않고 generate만 실행 (기존 schema.prisma 사용)
RUN npx prisma generate

# 소스 코드 전체 복사
COPY . .

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# 파일 소유권 변경
RUN chown -R appuser:nodejs /app

# 사용자 권한 변경
USER appuser

# Express 서버 포트
EXPOSE 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# tsx로 TypeScript 파일 직접 실행 (컴파일 없이)
ENTRYPOINT ["npx", "tsx", "app.ts"]