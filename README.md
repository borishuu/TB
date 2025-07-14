## Setup

### 1. Clone repository

```bash
git clone https://github.com/borishuu/TB.git
cd TB
```

### 2. Set environment variables

Create a file at the root of the folder named `.env` and add the following contents:

```
GEMINI_API_KEY="..."
MISTRAL_API_KEY="..."
DATABASE_URL="postgresql://admin:admin@db:5432/db?schema=public"
JWT_KEY="..."
```

### 3. Run the app

Run the following command:

```bash
docker-compose up --build
```

Once the containers are running, visit:

[http://localhost:3000](http://localhost:3000)


### Optional: Change the exposed port
By default the app runs on port `3000`. You may change the host port by editing the `docker-compose.yml` file:

```yml
services:
  app:
    ports:
      - "3001:3000"  # host:container
```