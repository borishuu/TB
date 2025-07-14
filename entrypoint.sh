# Wait for the database to be ready
echo "Waiting for PostgreSQL to start..."
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL started."

# Run the database schema push
echo "Pushing database schema..."
npx prisma db push

# Start the application
echo "Starting the application..."
npm run dev