FROM golang:1.25-alpine AS builder
WORKDIR /app
RUN apk add --no-cache gcc musl-dev
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -trimpath -ldflags="-s -w" -o server .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates \
    && adduser -D -u 1000 appuser
WORKDIR /app
COPY --from=builder /app/server .
COPY --from=builder /app/pkg/db/migrations ./pkg/db/migrations
RUN mkdir -p /app/data && chown -R appuser:appuser /app
USER appuser
EXPOSE 8080
CMD ["./server"]