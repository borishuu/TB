## Setup

### 1. Clone repository

```bash
git clone https://github.com/borishuu/TB.git
cd TB
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Create a file at the root of the foler named `.env` and add the following entries in the file :

```
GEMINI_API_KEY="..."
MISTRAL_API_KEY="..."
DATABASE_URL="postgresql://admin:admin@localhost:5432/db?schema=public"
JWT_KEY="..."
```

### 4. Setup database

```bash
docker-compose up -d
```

```bash
docker exec -it evagen-db psql -U admin -d db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

```bash
npx prisma db push
npx prisma generate
```

### 5. Run the app

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
