#!/bin/bash

# Script to seed test data
echo "🌱 Starting data seeding..."

cd "$(dirname "$0")/.."

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Run seed script
python scripts/seed_test_data.py

echo ""
echo "✅ Done! You can now test with:"
echo "   Teacher: teacher@test.com / teacher123"
echo "   Student: student@test.com / student123"
