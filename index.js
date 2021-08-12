const wtf = require('wtfnode');
const Boss = require('pg-boss');
const { DockerComposeEnvironment } = require('testcontainers');

let environment;

(async () => {
  environment = await new DockerComposeEnvironment('.', 'compose.yml').up();

  const boss = new Boss(
    'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
  );

  await boss.start();
  await boss.subscribe('test event', async (job) => {
    // throw error
    throw new Error("I'm going to cause a timer to hang until the job lease expires in 15min");
  });

  // create job
  await boss.publish('test event');

  // shutdown after 5 seconds
  setTimeout(() => {
    console.log('shutting down...');
    (async () => {
      await boss.stop();
      await environment.down();
      await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

      // dump open handles
      wtf.dump();

      // // check open handles after 20 mins
      // setTimeout(() => {
      //   console.log('\n--- after 20 mins\n');

      //   // dump open handles
      //   wtf.dump();
      // }, 20 * 60 * 1000);
    })().catch(console.error);
  }, 5 * 1000);

  console.log('initialized!');
})().catch(console.error);
