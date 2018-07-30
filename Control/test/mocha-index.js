const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('./test-config.js');
const {spawn} = require('child_process');
const grpc = require('grpc');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../protobuf/octlserver.proto');

// APIs:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
// https://mochajs.org/

// Tips:
// Network and rendering can have delays this can leads to random failures
// if they are tested just after their initialization.

describe('Control', function () {
  let browser;
  let page;
  let subprocess; // web-server runs into a subprocess
  let subprocessOutput = '';
  this.timeout(5000);
  this.slow(1000);
  const url = 'http://' + config.http.hostname + ':' + config.http.port + '/';

  const calls = {}; // Object.<string:method, bool:flag> memorize that gRPC methods have been called indeed

  before(async () => {
    // Start gRPC server, this replaces the real Control server written in Go.
    const server = new grpc.Server();
    const octlProto = grpc.load(PROTO_PATH, 'proto', {convertFieldsToCamelCase: true});
    const credentials = grpc.ServerCredentials.createInsecure();
    const address = `${config.grpc.hostname}:${config.grpc.port}`;
    server.addService(octlProto.octl.Octl.service, {
      getFrameworkInfo(call, callback) {
        calls['getFrameworkInfo'] = true;
        callback(null, {fakeData: 1});
      },
      getEnvironments(call, callback) {
        calls['getEnvironments'] = true;
        callback(null, {fakeData: 1});
      },
      getRoles(call, callback) {
        calls['getRoles'] = true;
        callback(null, {fakeData: 1});
      },
    });
    server.bind(address, credentials);
    server.start();

    // Start web-server in background
    subprocess = spawn('node', ['index.js', 'test/test-config.js'], {stdio: 'pipe'});
    subprocess.stdout.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });
    subprocess.stderr.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });

    // Start browser to test UI
    browser = await puppeteer.launch({
      headless: true
    });
    page = await browser.newPage();
  });

  it('should load first page "/"', async () => {
    // try many times until backend server is ready
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto(url, {waitUntil: 'networkidle0'});
        break; // conneciton ok, this test passed
      } catch(e) {
        if (e.message.includes('net::ERR_CONNECTION_REFUSED')) {
          await new Promise((done) => setTimeout(done, 500));
          continue; // try again
        }
        throw e;
      }
    }
  });

  it('should have redirected to default page "/?page=status"', async () => {
    const location = await page.evaluate(() => window.location);
    assert(location.search === '?page=status');
  });

  describe('page status', () => {
    it('should load', async () => {
      await page.goto(url + '?page=status', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=status');
    });

    it('should have gotten data from getEnvironments', async () => {
      assert(calls['getFrameworkInfo'] === true);
    });
  });

  describe('page environments', () => {
    it('should load', async () => {
      await page.goto(url + '?page=environments', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=environments');
    });

    it('should have gotten data from getEnvironments', async () => {
      assert(calls['getEnvironments'] === true);
    });
  });

  describe('page roles', () => {
    it('should load', async () => {
      await page.goto(url + '?page=roles', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=roles');
    });

    it('should have gotten data from getRoles', async () => {
      assert(calls['getRoles'] === true);
    });
  });

  after(async () => {
    await browser.close();
    console.log('---------------------------------------------');
    console.log('Output of server logs for the previous tests:');
    console.log('---------------------------------------------');
    console.log(subprocessOutput);
    subprocess.kill();
    process.exit(0);
  });
});
