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
