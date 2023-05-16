# Building Custom Actions

1. Javascript Actions
   - You write the logics in javascript.
   - Use Javascript (NodeJS) + any packages of your choice
2. Docker Actions
   - Containerized action
   - Define `Dockerfile` and `image`s
   - Perform tasks of your choice
   - A lot of flexibility but requires the knowledge of Docker
3. Composite Actions
   - Combine multiple workflow steps in one single Action
   - Combine `run`s and `uses`
   - Allows for reusing shared `Steps`

## Composite Actions

### Creating Custom Action

In the `deploy.yml`, we have few jobs that repeat. You can import actions that are from any public repository as needed.

We will create a new folder `actions` (or any name of your choice) under `.github`. In this example, we will separate the logics of caching the dependencies and installations.

```yml
  - name: Cache dependencies
      id: cache
      uses: actions/cache@v3
      with:
         path: node_modules
         key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
   - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
      run: npm ci
```

No matter what kind of custom action you create, you always must create `action.yml` file. This file must inlcude the configuration and definition of that action. The action must include the following items.

- Name : The action name
- Description : The description of the action. It is displayed on the marketplace. So it is nice to have thsi value.
- Runs: must include runs -> using -> composite
- ![](res/2023-05-08-12-12-31.png)

[Runs for composite actions](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#runs-for-composite-actions)

We will add steps now. In the steps, if we are using the `run` command, we must always provide `shell` value.

```yml
steps:
  - name: Install dependencies
    if: steps.cache.outputs.cache-hit != 'true'
    run: npm ci
    shell: bash
```

Also, you are free to use other actions in your custom actions.

### Importing custom action

You use `uses` in the steps to import your custom action.

```yml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Load & Cache dependencies
        uses: {user}/{repo}/{path to action}
```

You can use action imported from other repo you have an access to or you can use action within your repository by providing the path from the root.

```yml
- name: Load & Cache dependencies
  uses: ./.github/actions/cache-deps/action.yml
```

Or you dont need to explicitly declare `action.yml`. It will automatically search for the `action.yml` file so you could just end up with the following.

```yml
- name: Load & Cache dependencies
  uses: ./.github/actions/cache-deps
```

## Javascript Actions

[Javascript Action Docs](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)

Javascript requires to have a javascript file in the same directory and also must declare `runs` -> `using` as `node16` or other versions.

More can be found on this [link](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#runs-for-javascript-actions)

`post` and `pre` can be declared as needed. These are separate javascript file that can run on as needed.

Example

```yml
name: "Name"
description: "Description"
runs:
  using: "node16"
  pre: "my-pre.js"
  main: "my-main.js"
  post: "my-post.js"
```

You can install all kinds of dependencies from github toolkits. You can find toolkits from [here](https://github.com/actions/toolkit)

In our example, we will install `@actions/core`, `@actions/github`, `@actions/exec`.
Inside of main js file, `my-runner.js`,

**Importantly**, you have to install the dependencies in the action directory and node_modules must also be pushed to the repository for the use.

`my-runner.js`

```js
const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");

function run() {
  core.notice("Hello from my custom Javascript Action!");
}

run();
```

Once imported, you can again import javascript action as below.

```yml
jobs:
  information:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Run Custom Action
        uses: ./github/actions/my-js-s3-upload
```

Always, make sure if you are using the action within the repository, always pull the code first.

### Getting Inputs to the javascript action

What if you want to the created artifact to the s3? And also, you would like to pass in the s3 bucket, dist folder and other information as input to javascript instead of hard-coding. You will first update the action.yml as follow:

```yml
name: "Deploy to AWS S3"
description: "Deploy a static website via AWS S3."
inputs:
  my-input:
    description: "My Input Description"
    required: true
    default: "abcdefg"
  my-input-2:
    description: "My Input 2 Description"
    required: false
    default: "us-east-1"
  dist-folder:
    description: "The folder containing the deployable file..."
    required: true
runs:
  using: "node16"
  main: "my-runner.js"
```

As you can see, we've declared the new field input and passed in the array object with description and other fields. Now you can update your javascript code as follows.

```js
function run() {
  const myInput = core.getInput("my-input", {
    required: true,
  });
  const myInput2 = core.getInput("my-input-2", { required: false });
  const distFolder = core.getInput("dist-folder", { required: true });

  console.log(myInput, myInput2, distFolder);
}
```

Now question arises. In order to interact with s3 bucket, you need to have `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. These should be declared not **inside** of the code but as environment variables. How would you solve this issue?

Can solve this by passing variables in the workflow yml file.
The workflow can be updated as

```yml
- name: Deploy site
  uses: ./.github/actions/my-js-s3-upload
  env:
    AWS_ACCESS_KEY_ID: 123123
    AWS_SECRET_ACCESS_KEY_ID: 123123
  with:
    my-input: "Hello World"
    my-input-2: "Hello World 2"
    dist-folder: "DistDist"
```

Of course you can avoid passing in explicitly using the github secret. `Repo` -> `Settings` -> `Actions` -> `Actions secrets` -> `New repository secret`

Now the worfklow job will be updated as follow.

```yml
- name: Deploy site
  uses: ./.github/actions/my-js-s3-upload
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY_ID: ${{ secrets.AWS_SECRET_ACCESS_KEY_ID }}
  with:
    my-input: "Hello World"
    my-input-2: "Hello World 2"
    dist-folder: "DistDist"
```

### Exporting outputs from javascript

1. First include outputs field in the `action.yml` file. We will include that under `inputs` field.

```yml
outputs:
  my-output:
    description: My custom output from javascript code
    # You dont add value like inputs
```

Now you can export the ouput from the javascript. Exporting is simple.

```js
// inside run function
const myoutput = "abcdef";
core.setOutput("my-output", myoutput);
```

This can be picked up in our main `workflow` file. In the job steps, first provide `id` for the `step` using the javascript,

```yml
- name: Deploy site
  id: deploy
  uses: ./.github/actions/my-js-s3-upload
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY_ID: ${{ secrets.AWS_SECRET_ACCESS_KEY_ID }}
  with:
    my-input: "Hello World"
    my-input-2: "Hello World 2"
    dist-folder: "DistDist"
```

and use the output as below

```yml
- name: Output Information
  run: |
    echo "My Custom Output is ${{ steps.deploy.outputs.my-output }}"
```
