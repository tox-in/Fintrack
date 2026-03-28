import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: { title: 'FinTrack', description: 'Description' },
  host: 'localhost:3000'
};

const outputFile = '../documentation/swagger-output.json';
const routes = ['./index.ts'];
swaggerAutogen()(outputFile, routes, doc);