# NestJS Encrypt / Decrypt API

**Repo:** https://github.com/ThePeetMan/nest-encrypt-decrypt-test

HTTP service that encrypts and decrypts string payloads with **hybrid RSA + AES**.

บริการ HTTP สำหรับเข้ารหัสและถอดรหัสข้อความด้วย **RSA + AES แบบ hybrid**

## Non-functional requirements / ความต้องการที่ไม่ใช่ฟังก์ชัน

- NestJS HTTP server
- Unit tests (`pnpm test`) and e2e tests (`pnpm test:e2e`)
- Swagger UI at [`/api-docs`](http://localhost:3001/api-docs)
- RSA key pair in PEM format (same kind as [cryptotools.net/rsagen](https://cryptotools.net/rsagen))

## How to start / วิธีรันบริการ

```bash
pnpm install
pnpm run start:dev
```

The service listens on **http://localhost:3001** (override with `PORT`).

| What | URL |
| --- | --- |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/api-docs |

Other start modes:

```bash
# one-shot (no watch)
pnpm run start

# production
pnpm run build
pnpm run start:prod
```

Replace the sample keys anytime (RSA 2048, PEM — same output style as cryptotools.net):

```bash
pnpm run generate:keys
```

## API

### `POST /get-encrypt-data`

```json
{ "payload": "string, required, 0-2000 characters" }
```

```json
{
  "successful": true,
  "error_code": "",
  "data": { "data1": "string", "data2": "string" }
}
```

### `POST /get-decrypt-data`

```json
{ "data1": "string, required", "data2": "string, required" }
```

```json
{
  "successful": true,
  "error_code": "",
  "data": { "payload": "string" }
}
```

Validation errors return HTTP 400 with `error_code: "INVALID_PAYLOAD"`. Crypto failures return HTTP 200 with `successful: false` and `error_code: "ENCRYPT_FAILED"` or `"DECRYPT_FAILED"`.

ข้อผิดพลาดจาก validation ได้ HTTP 400 และ `error_code: "INVALID_PAYLOAD"` ส่วนความล้มเหลวตอนเข้ารหัส/ถอดรหัสได้ HTTP 200 พร้อม `successful: false`

## Encryption design / วิธีเข้ารหัส

RSA-2048 cannot encrypt a 2000-character payload directly, so the service uses hybrid encryption:

1. Generate a random **AES-256** key and 12-byte IV.
2. Encrypt the payload with **AES-256-GCM** → `data2` = base64(`iv || authTag || ciphertext`).
3. Wrap the AES key with **RSA-OAEP (SHA-256)** using `keys/public.pem` → `data1` (base64).

Decrypt reverses the steps with `keys/private.pem`.

คีย์ตัวอย่างอยู่ใน `keys/public.pem` และ `keys/private.pem` (สำหรับเดโมเท่านั้น)

## Tests / การทดสอบ

```bash
pnpm test          # unit tests
pnpm test:e2e      # HTTP e2e tests
pnpm test:cov      # coverage
```
