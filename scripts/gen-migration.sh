#!/bin/bash
set -o pipefail
set -e

# Check if migration name is provided
if [ -z "$1" ]; then
    echo "Error: Migration name is required."
    echo "Usage: $0 <migration_name> [--custom]"
    exit 1
fi


# Assign migration name to a variable
MIGRATION_NAME="$1"

if [[ ! "$MIGRATION_NAME" =~ ^[a-z0-9_]+$ ]]; then
    echo "Error: Migration name must be a snake_case ASCII string (only lowercase letters, numbers, and underscores)."
    exit 1
fi

# Build the command
CMD="yarn drizzle-kit generate --config=src/db/drizzle-config.ts --name=$"{MIGRATION_NAME}""

# Check for the optional --custom flag
if [[ "$2" == "--custom" ]]; then
    CMD+=" --custom"
fi

# Execute the command
echo "Executing: $CMD"
eval "$CMD"
