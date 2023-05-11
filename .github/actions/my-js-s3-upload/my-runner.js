const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");

function run() {
  // 1. Get User Inputs
  const myInput = core.getInput("my-input", {
    required: true,
  });
  const myInput2 = core.getInput("my-input-2", { required: false });
  const distFolder = core.getInput("dist-folder", { required: true });

  console.log(myInput, myInput2, distFolder);

  // 2. Run the logics of upload result to somewhere.
  const s3Uri = `s3://${myInput}`;
  // If we want to run aws
  exec.exec('echo "Hello World!"');
  // exec.exec('aws s3 sync <local-folder> <s3-bucket> --region <region>')
  // exec.exec('aws s3 sync ${distFolder} ${s3Uri} --region ${myInput2}')
  core.notice("Hello from my custom Javascript Action!");

  // 3. Github
  // This github object makes the request to github easy.
  github;
}

run();
