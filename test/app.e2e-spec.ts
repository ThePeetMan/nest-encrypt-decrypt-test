import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter.js';
import { ErrorCode } from '../src/common/error-codes.js';

describe('Encrypt / Decrypt API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Encrypt / Decrypt API')
      .setVersion('1.0')
      .build();
    SwaggerModule.setup(
      'api-docs',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /get-encrypt-data then POST /get-decrypt-data round-trips', async () => {
    const payload = 'e2e-secret-payload';

    const encryptRes = await request(app.getHttpServer())
      .post('/get-encrypt-data')
      .send({ payload })
      .expect(200);

    expect(encryptRes.body.successful).toBe(true);
    expect(encryptRes.body.error_code).toBe('');
    expect(encryptRes.body.data.data1).toEqual(expect.any(String));
    expect(encryptRes.body.data.data2).toEqual(expect.any(String));

    const decryptRes = await request(app.getHttpServer())
      .post('/get-decrypt-data')
      .send({
        data1: encryptRes.body.data.data1,
        data2: encryptRes.body.data.data2,
      })
      .expect(200);

    expect(decryptRes.body).toEqual({
      successful: true,
      error_code: '',
      data: { payload },
    });
  });

  it('POST /get-encrypt-data rejects payload longer than 2000 characters', async () => {
    const res = await request(app.getHttpServer())
      .post('/get-encrypt-data')
      .send({ payload: 'x'.repeat(2001) })
      .expect(400);

    expect(res.body).toEqual({
      successful: false,
      error_code: ErrorCode.INVALID_PAYLOAD,
      data: null,
    });
  });

  it('POST /get-encrypt-data rejects a missing payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/get-encrypt-data')
      .send({})
      .expect(400);

    expect(res.body.error_code).toBe(ErrorCode.INVALID_PAYLOAD);
    expect(res.body.successful).toBe(false);
  });

  it('POST /get-decrypt-data rejects missing fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/get-decrypt-data')
      .send({ data1: 'only-one-field' })
      .expect(400);

    expect(res.body.error_code).toBe(ErrorCode.INVALID_PAYLOAD);
  });

  it('POST /get-decrypt-data returns DECRYPT_FAILED for garbage input', async () => {
    const res = await request(app.getHttpServer())
      .post('/get-decrypt-data')
      .send({ data1: 'aaaa', data2: 'bbbb' })
      .expect(200);

    expect(res.body).toEqual({
      successful: false,
      error_code: ErrorCode.DECRYPT_FAILED,
      data: null,
    });
  });

  it('GET /api-docs serves Swagger UI', async () => {
    const res = await request(app.getHttpServer()).get('/api-docs').expect(200);
    expect(res.text).toContain('Swagger UI');
  });
});
