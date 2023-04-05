const request = require('supertest');

const createApp = require('../src/app');
const { models } = require('../src/db/sequelize');
const { config } = require('../src/config/config');
const { upSeed, downSeed } = require('./utils/umzug');

describe('Test for products ', () => {
  const endpoint = '/api/v1/products';
  let app = null;
  let server = null;
  let api = null;

  beforeAll(async () => {
    app = createApp();
    server = app.listen(config.port);
    api = request(app);
    await upSeed();
  });

  describe('GET /products', () => {
    test('should return the products', async () => {
      const products = await models.Product.findAll();
      const response = await api.get(endpoint);

      expect(response.statusCode).toEqual(200);
      expect(response.body.length).toEqual(products.length);
      expect(response.body[0].category).toBeTruthy();
    });

    test('should return two products with limit = 2 and offset = 0', async () => {
      const limit = 2;
      const offset = 0;
      const response = await api.get(
        `${endpoint}?limit=${limit}&offset=${offset}`
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body.length).toEqual(2);
    });

    test('should return one product', async () => {
      const product = await models.Product.findByPk(1);
      const response = await api.get(`${endpoint}/1`);

      expect(response.statusCode).toEqual(200);
      expect(response.body.name).toEqual(product.name);
    });

    test('return 404 when it does not exist a product with that ID', async () => {
      const response = await api.get(`${endpoint}/100`);

      expect(response.statusCode).toEqual(404);
    });
  });

  describe('POST /products', () => {
    test('should create a product', async () => {
      const inputData = {
        name: 'New Product',
        price: 10000,
        description: 'A description',
        categoryId: 1,
        image: 'https://api.lorem.space/image/game?w=150&h=220',
      };
      const response = await api.post(endpoint).send(inputData);
      const productCreated = await models.Product.findByPk(response.body.id);

      expect(response.statusCode).toEqual(201);
      expect(productCreated.name).toEqual(inputData.name);
    });

    test('return 404 when it does not exist the category asigned', async () => {
      const inputData = {
        name: 'New Product',
        price: 10000,
        description: 'A description',
        categoryId: 100,
        image: 'https://api.lorem.space/image/game?w=150&h=220',
      };
      const response = await api.post(endpoint).send(inputData);

      expect(response.statusCode).toEqual(404);
    });

    test('return error when the properties required are not send', async () => {
      const inputData = {
        name: 'New Product',
        categoryId: 100,
        image: 'https://api.lorem.space/image/game?w=150&h=220',
      };
      const response = await api.post(endpoint).send(inputData);

      expect(response.statusCode).toEqual(400);
    });
  });

  afterAll(async () => {
    await downSeed();
    server.close();
  });
});
